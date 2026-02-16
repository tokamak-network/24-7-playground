import { NextResponse } from "next/server";
import { generateApiKey, prisma } from "src/db";
import { getAddress, verifyMessage } from "ethers";

export async function POST(request: Request) {
  const body = await request.json();
  const handle = String(body.handle || "").trim();
  const signature = String(body.signature || "").trim();
  const communityId = String(body.communityId || "").trim();

  if (!handle || !signature || !communityId) {
    return NextResponse.json(
      { error: "handle, signature, and communityId are required" },
      { status: 400 }
    );
  }

  const community = await prisma.community.findUnique({
    where: { id: communityId },
  });
  if (!community) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 }
    );
  }
  if (community.status === "CLOSED") {
    return NextResponse.json(
      { error: "Community is closed" },
      { status: 403 }
    );
  }

  const authMessage = `24-7-playground${community.slug}`;
  let ownerWallet: string;
  try {
    ownerWallet = getAddress(verifyMessage(authMessage, signature)).toLowerCase();
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const existingPair = await prisma.agent.findFirst({
    where: {
      ownerWallet,
      communityId: community.id,
    },
    select: {
      id: true,
      handle: true,
      ownerWallet: true,
      communityId: true,
      account: true,
      runner: true,
    },
  });

  const existingHandle = await prisma.agent.findUnique({
    where: { handle },
    select: {
      id: true,
      handle: true,
      ownerWallet: true,
      communityId: true,
      account: true,
      runner: true,
    },
  });

  if (
    existingHandle &&
    existingHandle.ownerWallet &&
    existingHandle.ownerWallet !== ownerWallet
  ) {
    return NextResponse.json(
      { error: "handle already exists" },
      { status: 409 }
    );
  }

  const existingAccount = await prisma.agent.findFirst({
    where: { account: signature },
    select: {
      id: true,
      handle: true,
      ownerWallet: true,
      communityId: true,
      account: true,
      runner: true,
    },
  });

  if (
    existingAccount &&
    existingAccount.ownerWallet &&
    existingAccount.ownerWallet !== ownerWallet
  ) {
    return NextResponse.json(
      { error: "account already registered to another handle" },
      { status: 409 }
    );
  }

  let agent:
    | {
        id: string;
        handle: string;
        ownerWallet: string | null;
        account: string | null;
        communityId: string | null;
        runner: unknown;
      }
    | null = null;

  if (existingPair) {
    if (existingHandle && existingHandle.id !== existingPair.id) {
      return NextResponse.json(
        { error: "handle already exists" },
        { status: 409 }
      );
    }
    if (existingAccount && existingAccount.id !== existingPair.id) {
      return NextResponse.json(
        { error: "account already registered to another handle" },
        { status: 409 }
      );
    }

    agent = await prisma.agent.update({
      where: { id: existingPair.id },
      data: {
        handle,
        ownerWallet,
        account: signature,
        communityId: community.id,
        runner:
          (existingPair as { runner?: { status?: string; intervalSec?: number } })
            ?.runner || { status: "STOPPED", intervalSec: 60 },
      },
      select: {
        id: true,
        handle: true,
        ownerWallet: true,
        account: true,
        communityId: true,
        runner: true,
      },
    });
  } else {
    const reusableByAccount =
      existingAccount &&
      existingAccount.ownerWallet === ownerWallet &&
      (!existingAccount.communityId || existingAccount.communityId === community.id)
        ? existingAccount
        : null;

    const reusableByHandle =
      existingHandle &&
      existingHandle.ownerWallet === ownerWallet &&
      (!existingHandle.communityId || existingHandle.communityId === community.id)
        ? existingHandle
        : null;

    const reusable = reusableByAccount || reusableByHandle;

    if (reusable) {
      agent = await prisma.agent.update({
        where: { id: reusable.id },
        data: {
          handle,
          ownerWallet,
          account: signature,
          communityId: community.id,
          runner:
            (reusable as { runner?: { status?: string; intervalSec?: number } })
              ?.runner || { status: "STOPPED", intervalSec: 60 },
        },
        select: {
          id: true,
          handle: true,
          ownerWallet: true,
          account: true,
          communityId: true,
          runner: true,
        },
      });
    } else {
      agent = await prisma.agent.create({
        data: {
          handle,
          ownerWallet,
          account: signature,
          communityId: community.id,
          runner: { status: "STOPPED", intervalSec: 60 },
        },
        select: {
          id: true,
          handle: true,
          ownerWallet: true,
          account: true,
          communityId: true,
          runner: true,
        },
      });
    }
  }

  const existingKey = await prisma.apiKey.findUnique({
    where: { agentId: agent.id },
  });

  if (
    existingKey &&
    !existingKey.revokedAt &&
    existingKey.communityId === community.id
  ) {
    return NextResponse.json({ agent, community });
  }

  const { plain, prefix, hash } = generateApiKey();

  if (!plain) {
    return NextResponse.json(
      { error: "Failed to issue API key" },
      { status: 500 }
    );
  }

  await prisma.apiKey.upsert({
    where: { agentId: agent.id },
    update: {
      revokedAt: null,
      keyHash: hash,
      keyPrefix: prefix,
      communityId: community.id,
    },
    create: {
      agentId: agent.id,
      keyHash: hash,
      keyPrefix: prefix,
      communityId: community.id,
      type: "SNS",
    },
  });

  return NextResponse.json({ agent, community, apiKey: plain });
}
