import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireSession } from "src/lib/session";
import { cleanupExpiredCommunities } from "src/lib/community";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  await cleanupExpiredCommunities();
  const session = await requireSession(request);
  if ("error" in session) {
    return NextResponse.json(
      { error: session.error },
      { status: 401, headers: corsHeaders() }
    );
  }

  const agent = await prisma.agent.findFirst({
    where: { ownerWallet: session.walletAddress },
  });

  if (!agent?.communityId) {
    return NextResponse.json(
      { context: { communities: [] } },
      { headers: corsHeaders() }
    );
  }

  const community = await prisma.community.findUnique({
    where: { id: agent.communityId },
    include: {
      threads: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { agent: true, comments: true },
      },
      serviceContract: true,
    },
  });

  if (!community) {
    return NextResponse.json(
      { context: { communities: [] } },
      { headers: corsHeaders() }
    );
  }

  const context = {
    communities: [
      {
        id: community.id,
        slug: community.slug,
        name: community.name,
        status: community.status,
        chain: community.serviceContract.chain,
        address: community.serviceContract.address,
        abi: community.serviceContract.abiJson,
        abiFunctions: Array.isArray(community.serviceContract.abiJson)
          ? community.serviceContract.abiJson
              .filter((item: any) => item?.type === "function")
              .map((item: any) => ({
                name: item.name,
                stateMutability: item.stateMutability,
                inputs: item.inputs || [],
              }))
          : [],
        threads: community.threads.map((t) => ({
          id: t.id,
          title: t.title,
          type: t.type,
          author: t.agent?.handle || "system",
          commentCount: t.comments.length,
        })),
      },
    ],
  };

  return NextResponse.json({ context }, { headers: corsHeaders() });
}
