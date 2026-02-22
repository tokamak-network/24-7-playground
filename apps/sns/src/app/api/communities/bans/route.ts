import { NextResponse } from "next/server";
import { getAddress, verifyMessage } from "ethers";
import { prisma } from "src/db";
import { cleanupExpiredCommunities } from "src/lib/community";
import { firstTextLimitError, getDosTextLimits } from "src/lib/textLimits";
import { mapApiError } from "src/lib/apiError";

const FIXED_MESSAGE = "24-7-playground";
const BAN_ACTIONS = ["BAN", "UNBAN"] as const;

type BanAction = (typeof BAN_ACTIONS)[number];

function parseAction(value: unknown): BanAction | null {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  return BAN_ACTIONS.includes(normalized as BanAction)
    ? (normalized as BanAction)
    : null;
}

function normalizeWallet(value: string) {
  try {
    return getAddress(value).toLowerCase();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    await cleanupExpiredCommunities();
    const body = await request.json();
    const communityId = String(body.communityId || "").trim();
    const signature = String(body.signature || "").trim();
    const ownerWalletInput = String(body.ownerWallet || "").trim();
    const handleInput = String(body.handle || "").trim();
    const action = parseAction(body.action);
    let textLimits: Awaited<ReturnType<typeof getDosTextLimits>>;

    try {
      textLimits = await getDosTextLimits();
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Text limit policy is unavailable.",
        },
        { status: 503 }
      );
    }

    if (!communityId || !signature || !ownerWalletInput || !action) {
      return NextResponse.json(
        { error: "communityId, signature, ownerWallet, and action are required" },
        { status: 400 }
      );
    }

    const textLimitError = firstTextLimitError([
      {
        field: "communityId",
        value: communityId,
        max: textLimits.ids.communityId,
      },
      {
        field: "ownerWallet",
        value: ownerWalletInput,
        max: textLimits.serviceContract.address,
      },
      {
        field: "handle",
        value: handleInput,
        max: textLimits.agent.handle,
      },
    ]);
    if (textLimitError) {
      return NextResponse.json({ error: textLimitError }, { status: 400 });
    }

    const targetOwnerWallet = normalizeWallet(ownerWalletInput);
    if (!targetOwnerWallet) {
      return NextResponse.json({ error: "ownerWallet is invalid" }, { status: 400 });
    }

    let requesterWallet = "";
    try {
      requesterWallet = getAddress(verifyMessage(FIXED_MESSAGE, signature)).toLowerCase();
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: {
        id: true,
        status: true,
        ownerWallet: true,
      },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }
    if (community.status === "CLOSED") {
      return NextResponse.json({ error: "Community is closed" }, { status: 403 });
    }

    const ownerWallet = String(community.ownerWallet || "").toLowerCase();
    if (!ownerWallet || ownerWallet !== requesterWallet) {
      return NextResponse.json(
        { error: "Only the community owner can manage bans" },
        { status: 403 }
      );
    }

    if (action === "BAN") {
      const targetAgent = await prisma.agent.findFirst({
        where: {
          communityId: community.id,
          ownerWallet: {
            equals: targetOwnerWallet,
            mode: "insensitive",
          },
        },
        select: {
          handle: true,
        },
      });
      if (!targetAgent) {
        return NextResponse.json(
          { error: "Target agent not found in this community" },
          { status: 404 }
        );
      }
      if (handleInput && handleInput !== targetAgent.handle) {
        return NextResponse.json(
          { error: "handle does not match the target agent" },
          { status: 400 }
        );
      }

      const banned = await prisma.communityBannedAgent.upsert({
        where: {
          communityId_ownerWallet: {
            communityId: community.id,
            ownerWallet: targetOwnerWallet,
          },
        },
        update: {
          handle: targetAgent.handle,
          bannedAt: new Date(),
        },
        create: {
          communityId: community.id,
          ownerWallet: targetOwnerWallet,
          handle: targetAgent.handle,
        },
        select: {
          id: true,
          ownerWallet: true,
          handle: true,
          bannedAt: true,
        },
      });

      return NextResponse.json({
        ok: true,
        action,
        ban: {
          id: banned.id,
          ownerWallet: banned.ownerWallet,
          handle: banned.handle,
          bannedAt: banned.bannedAt.toISOString(),
        },
      });
    }

    const removed = await prisma.communityBannedAgent.deleteMany({
      where: {
        communityId: community.id,
        ownerWallet: {
          equals: targetOwnerWallet,
          mode: "insensitive",
        },
      },
    });

    return NextResponse.json({
      ok: true,
      action,
      removed: removed.count,
    });
  } catch (error) {
    console.error("[communities/bans]", error);
    const mapped = mapApiError(error, "Failed to update ban state.");
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
