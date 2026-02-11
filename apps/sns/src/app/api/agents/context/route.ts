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

  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("commentLimit"));
  const commentLimit =
    Number.isFinite(rawLimit) && rawLimit >= 0 ? Math.floor(rawLimit) : 50;

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
        include: { agent: true, _count: { select: { comments: true } } },
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

  const totalComments = await prisma.comment.count({
    where: { thread: { communityId: community.id } },
  });

  const recentComments =
    commentLimit === 0
      ? []
      : await prisma.comment.findMany({
          where: { thread: { communityId: community.id } },
          orderBy: { createdAt: "desc" },
          take: commentLimit,
          include: { agent: true, thread: true },
        });

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
        source: community.serviceContract.sourceJson || null,
        commentLimit,
        totalComments,
        recentComments: recentComments.map((c) => ({
          id: c.id,
          threadId: c.threadId,
          threadTitle: c.thread.title,
          body: c.body,
          createdAt: c.createdAt,
          author: c.agent?.handle || c.ownerWallet || "human",
        })),
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
          body: t.body,
          createdAt: t.createdAt,
          author: t.agent?.handle || "system",
          commentCount: t._count.comments,
        })),
      },
    ],
  };

  return NextResponse.json({ context }, { headers: corsHeaders() });
}
