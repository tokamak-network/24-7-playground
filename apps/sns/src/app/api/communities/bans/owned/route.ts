import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "src/db";
import { cleanupExpiredCommunities } from "src/lib/community";
import { mapApiError } from "src/lib/apiError";

export const dynamic = "force-dynamic";

async function loadOwnedCommunities(
  walletAddress: string,
  includeBans: boolean
) {
  const communities = includeBans
    ? await prisma.community.findMany({
        where: {
          ownerWallet: {
            equals: walletAddress,
            mode: "insensitive",
          },
        },
        include: {
          bannedAgents: {
            orderBy: { bannedAt: "desc" },
          },
        },
        orderBy: { name: "asc" },
      })
    : await prisma.community.findMany({
        where: {
          ownerWallet: {
            equals: walletAddress,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
        orderBy: { name: "asc" },
      });

  const communityIds = communities.map((community) => community.id);
  const agents = communityIds.length
    ? await prisma.agent.findMany({
        where: { communityId: { in: communityIds } },
        select: {
          id: true,
          handle: true,
          ownerWallet: true,
          communityId: true,
        },
      })
    : [];
  const agentsByCommunityId = new Map<string, Array<(typeof agents)[number]>>();
  for (const agent of agents) {
    if (!agent.communityId) {
      continue;
    }
    const existing = agentsByCommunityId.get(agent.communityId) || [];
    existing.push(agent);
    agentsByCommunityId.set(agent.communityId, existing);
  }

  return {
    communities: communities.map((community) => {
      const communityAgents = (agentsByCommunityId.get(community.id) || [])
        .map((agent) => ({
          id: agent.id,
          handle: agent.handle,
          ownerWallet: agent.ownerWallet || null,
        }))
        .sort((left, right) => left.handle.localeCompare(right.handle));
      const bannedAgents =
        includeBans &&
        "bannedAgents" in community &&
        Array.isArray((community as { bannedAgents?: unknown }).bannedAgents)
          ? (community as {
              bannedAgents: Array<{
                id: string;
                ownerWallet: string;
                handle: string | null;
                bannedAt: Date;
              }>;
            }).bannedAgents
          : [];

      return {
        id: community.id,
        name: community.name,
        slug: community.slug,
        status: community.status,
        agents: communityAgents,
        bans: bannedAgents.map((ban) => ({
          id: ban.id,
          ownerWallet: ban.ownerWallet,
          handle: ban.handle || null,
          bannedAt: ban.bannedAt.toISOString(),
        })),
      };
    }),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = String(searchParams.get("walletAddress") || "")
    .trim()
    .toLowerCase();

  if (!walletAddress) {
    return NextResponse.json(
      { error: "walletAddress is required" },
      { status: 400 }
    );
  }

  try {
    await cleanupExpiredCommunities();
    const payload = await loadOwnedCommunities(walletAddress, true);
    return NextResponse.json(payload);
  } catch (error) {
    const isSchemaOutdated =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022");
    if (isSchemaOutdated) {
      console.warn(
        "[communities/bans/owned] community ban schema missing, fallback without bans",
        error
      );
      try {
        const fallbackPayload = await loadOwnedCommunities(walletAddress, false);
        return NextResponse.json({
          ...fallbackPayload,
          banFeatureAvailable: false,
          warning:
            "Community ban feature is unavailable on this deployment. Run prisma migrate deploy.",
        });
      } catch (fallbackError) {
        console.error("[communities/bans/owned:fallback]", fallbackError);
        const mappedFallback = mapApiError(
          fallbackError,
          "Failed to load community ban data."
        );
        return NextResponse.json(
          { error: mappedFallback.message },
          { status: mappedFallback.status }
        );
      }
    }

    console.error("[communities/bans/owned]", error);
    const mapped = mapApiError(error, "Failed to load community ban data.");
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
