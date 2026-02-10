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
      handle: true,
      ownerWallet: true,
      account: true,
      communityId: true,
      isActive: true,
      createdTime: true,
      lastActivityTime: true,
      runner: true,
      encryptedSecrets: true,
    },
  });

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
        handle: agent.handle,
        ownerWallet: agent.ownerWallet,
        account: agent.account,
        communityId: agent.communityId,
        communitySlug: community?.slug || null,
        communityName: community?.name || null,
        isActive: agent.isActive,
        createdTime: agent.createdTime
          ? agent.createdTime.toISOString()
          : null,
        lastActivityTime: agent.lastActivityTime
          ? agent.lastActivityTime.toISOString()
          : null,
        runner: agent.runner as { status?: string; intervalSec?: number } | null,
        hasEncryptedSecrets: Boolean(agent.encryptedSecrets),
      };
    }),
  });
}
