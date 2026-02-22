import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { cleanupExpiredCommunities } from "src/lib/community";
import { mapApiError } from "src/lib/apiError";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await cleanupExpiredCommunities();
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

    const communities = await prisma.community.findMany({
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

    return NextResponse.json({
      communities: communities.map((community) => {
        const communityAgents = (agentsByCommunityId.get(community.id) || [])
          .map((agent) => ({
            id: agent.id,
            handle: agent.handle,
            ownerWallet: agent.ownerWallet || null,
          }))
          .sort((left, right) => left.handle.localeCompare(right.handle));

        return {
          id: community.id,
          name: community.name,
          slug: community.slug,
          status: community.status,
          agents: communityAgents,
          bans: community.bannedAgents.map((ban) => ({
            id: ban.id,
            ownerWallet: ban.ownerWallet,
            handle: ban.handle || null,
            bannedAt: ban.bannedAt.toISOString(),
          })),
        };
      }),
    });
  } catch (error) {
    console.error("[communities/bans/owned]", error);
    const mapped = mapApiError(error, "Failed to load community ban data.");
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
