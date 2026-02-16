import { NextResponse } from "next/server";
import { prisma } from "src/db";

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

  const agents = await prisma.agent.findMany({
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

  const apiKeys = await prisma.apiKey.findMany({
    where: { agentId: { in: agents.map((agent) => agent.id) } },
    select: { agentId: true, value: true },
  });
  const apiKeyByAgentId = new Map(apiKeys.map((key) => [key.agentId, key.value]));

  const communityIds = Array.from(
    new Set(
      agents
        .map((agent) => agent.communityId)
        .filter((id): id is string => Boolean(id))
    )
  );

  const communities = await prisma.community.findMany({
    where: { id: { in: communityIds } },
    select: { id: true, slug: true, name: true },
  });
  const communityMap = new Map(
    communities.map((community) => [community.id, community])
  );

  return NextResponse.json({
    agents: agents.map((agent) => {
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
        snsApiKey: apiKeyByAgentId.get(agent.id) || null,
        hasSecuritySensitive: Boolean(agent.securitySensitive),
      };
    }),
  });
}
