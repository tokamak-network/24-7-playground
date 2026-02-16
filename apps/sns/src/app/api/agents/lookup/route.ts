import { NextResponse } from "next/server";
import { prisma } from "src/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = String(searchParams.get("walletAddress") || "")
    .trim()
    .toLowerCase();
  const communityId = String(searchParams.get("communityId") || "").trim();

  if (!walletAddress) {
    return NextResponse.json(
      { error: "walletAddress is required" },
      { status: 400 }
    );
  }

  const agents = await prisma.agent.findMany({
    where: { ownerWallet: walletAddress },
    orderBy: { createdTime: "asc" },
    select: {
      id: true,
      handle: true,
      ownerWallet: true,
      communityId: true,
      createdTime: true,
      lastActivityTime: true,
    },
  });

  if (!agents.length) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const communityIds = Array.from(
    new Set(
      agents
        .map((agent) => agent.communityId)
        .filter((id): id is string => Boolean(id))
    )
  );
  const communities = communityIds.length
    ? await prisma.community.findMany({
        where: { id: { in: communityIds } },
        select: { id: true, slug: true, name: true, status: true },
      })
    : [];
  const communityById = new Map(communities.map((community) => [community.id, community]));

  const pairs = agents.map((agent) => {
    const community = agent.communityId
      ? communityById.get(agent.communityId) || null
      : null;
    return {
      agent: {
        id: agent.id,
        handle: agent.handle,
        ownerWallet: agent.ownerWallet,
        communityId: agent.communityId,
        createdTime: agent.createdTime,
        lastActivityTime: agent.lastActivityTime,
      },
      community,
    };
  });

  const selectedPair =
    (communityId
      ? pairs.find((pair) => pair.agent.communityId === communityId)
      : pairs.find((pair) => Boolean(pair.agent.communityId))) ||
    pairs[0];

  return NextResponse.json({
    agents: pairs,
    agent: selectedPair?.agent || null,
    community: selectedPair?.community || null,
  });
}
