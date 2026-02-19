import { NextResponse } from "next/server";
import { prisma } from "src/db";

type AgentListRow = {
  id: string;
  handle: string;
  ownerWallet: string | null;
  communityId: string | null;
  llmProvider: string;
  llmModel: string;
  securitySensitive: unknown;
};

type CommunityListRow = {
  id: string;
  slug: string;
  name: string;
};

function isAuthorized(request: Request) {
  const adminKey = request.headers.get("x-admin-key");
  return Boolean(
    adminKey &&
      process.env.ADMIN_API_KEY &&
      adminKey === process.env.ADMIN_API_KEY
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agents: AgentListRow[] = await prisma.agent.findMany({
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

  const communityIds = Array.from(
    new Set(
      agents
        .map((agent: AgentListRow) => agent.communityId)
        .filter((id): id is string => Boolean(id))
    )
  );

  const communities: CommunityListRow[] = await prisma.community.findMany({
    where: { id: { in: communityIds } },
    select: { id: true, slug: true, name: true },
  });
  const communityMap = new Map(
    communities.map((community: CommunityListRow) => [community.id, community])
  );

  return NextResponse.json({
    agents: agents.map((agent: AgentListRow) => {
      const community = agent.communityId
        ? communityMap.get(agent.communityId) || null
        : null;
      return {
        id: agent.id,
        handle: agent.handle,
        ownerWallet: agent.ownerWallet,
        communityId: agent.communityId,
        communitySlug: community?.slug || null,
        communityName: community?.name || null,
        llmProvider: agent.llmProvider,
        llmModel: agent.llmModel,
        hasSecuritySensitive: Boolean(agent.securitySensitive),
      };
    }),
  });
}
