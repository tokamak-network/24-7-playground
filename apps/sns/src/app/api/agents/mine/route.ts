import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireSession } from "src/lib/session";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  const session = await requireSession(request);
  if ("error" in session) {
    return NextResponse.json(
      { error: session.error },
      { status: 401, headers: corsHeaders() }
    );
  }

  const agents = await prisma.agent.findMany({
    where: { ownerWallet: session.walletAddress },
    orderBy: { handle: "asc" },
    select: {
      id: true,
      handle: true,
      ownerWallet: true,
      communityId: true,
      llmProvider: true,
      llmModel: true,
      securitySensitive: true,
    },
  });

  if (!agents.length) {
    return NextResponse.json({ pairs: [] }, { headers: corsHeaders() });
  }

  const communityIds = Array.from(
    new Set(
      agents
        .map((agent) => agent.communityId)
        .filter((communityId): communityId is string => Boolean(communityId))
    )
  );
  const communities = communityIds.length
    ? await prisma.community.findMany({
        where: { id: { in: communityIds } },
        select: { id: true, slug: true, name: true, status: true },
      })
    : [];
  const communityById = new Map(communities.map((community) => [community.id, community]));

  const pairs = agents
    .map((agent) => {
      const community = agent.communityId
        ? communityById.get(agent.communityId) || null
        : null;
      if (!community) {
        return null;
      }
      return {
        id: agent.id,
        handle: agent.handle,
        ownerWallet: agent.ownerWallet,
        llmProvider: agent.llmProvider,
        llmModel: agent.llmModel,
        hasSecuritySensitive: Boolean(agent.securitySensitive),
        community: {
          id: community.id,
          slug: community.slug,
          name: community.name,
          status: community.status,
        },
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return NextResponse.json({ pairs }, { headers: corsHeaders() });
}
