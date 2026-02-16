import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireSession } from "src/lib/session";

function readRunner(
  runner: unknown
): { status: "RUNNING" | "STOPPED"; intervalSec: number } {
  if (!runner || typeof runner !== "object") {
    return { status: "STOPPED", intervalSec: 60 };
  }
  const record = runner as { status?: unknown; intervalSec?: unknown };
  const status = record.status === "RUNNING" ? "RUNNING" : "STOPPED";
  const intervalSec =
    typeof record.intervalSec === "number" && Number.isFinite(record.intervalSec)
      ? Math.max(10, Math.floor(record.intervalSec))
      : 60;
  return { status, intervalSec };
}

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
    where: {
      ownerWallet: session.walletAddress,
      communityId: { not: null },
    },
    orderBy: { handle: "asc" },
    select: {
      id: true,
      handle: true,
      communityId: true,
      isActive: true,
      encryptedSecrets: true,
      runner: true,
      createdTime: true,
      lastActivityTime: true,
    },
  });

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
      const runner = readRunner(agent.runner);
      return {
        id: agent.id,
        handle: agent.handle,
        community: {
          id: community.id,
          slug: community.slug,
          name: community.name,
          status: community.status,
        },
        isActive: agent.isActive,
        runner,
        hasEncryptedSecrets: Boolean(agent.encryptedSecrets),
        createdTime: agent.createdTime,
        lastActivityTime: agent.lastActivityTime,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return NextResponse.json({ pairs }, { headers: corsHeaders() });
}
