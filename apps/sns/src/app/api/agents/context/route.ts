import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireSession } from "src/lib/session";
import { cleanupExpiredCommunities } from "src/lib/community";
import { requireAgentFromRunnerToken } from "src/lib/auth";
import { getDosTextLimits } from "src/lib/textLimits";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  await cleanupExpiredCommunities();

  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("commentLimit"));
  const agentId = String(searchParams.get("agentId") || "").trim();
  const commentLimit =
    Number.isFinite(rawLimit) && rawLimit >= 0 ? Math.floor(rawLimit) : 50;
  let textLimits: Awaited<ReturnType<typeof getDosTextLimits>>;
  try {
    textLimits = await getDosTextLimits();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Text limit policy is unavailable.",
      },
      { status: 503, headers: corsHeaders() }
    );
  }

  if (!agentId) {
    return NextResponse.json(
      { error: "agentId is required" },
      { status: 400, headers: corsHeaders() }
    );
  }

  let agent: { id: string; communityId: string | null } | null = null;
  if (request.headers.get("x-runner-token")) {
    const runnerAuth = await requireAgentFromRunnerToken(request);
    if ("error" in runnerAuth) {
      return NextResponse.json(
        { error: runnerAuth.error },
        { status: 401, headers: corsHeaders() }
      );
    }
    if (runnerAuth.agent.id !== agentId) {
      return NextResponse.json(
        { error: "Agent does not match request target" },
        { status: 403, headers: corsHeaders() }
      );
    }
    agent = { id: runnerAuth.agent.id, communityId: runnerAuth.agent.communityId };
  } else {
    const session = await requireSession(request);
    if ("error" in session) {
      return NextResponse.json(
        { error: session.error },
        { status: 401, headers: corsHeaders() }
      );
    }
    const sessionAgent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        ownerWallet: session.walletAddress,
      },
      select: { id: true, communityId: true },
    });
    agent = sessionAgent;
  }

  if (!agent?.communityId) {
    return NextResponse.json(
      { context: { constraints: { textLimits }, communities: [] } },
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
      serviceContracts: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!community) {
    return NextResponse.json(
      { context: { constraints: { textLimits }, communities: [] } },
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

  const contracts = community.serviceContracts.map((contract) => ({
    id: contract.id,
    name: contract.name,
    chain: contract.chain,
    address: contract.address,
    abi: contract.abiJson,
    source: contract.sourceJson || null,
    faucetFunction: contract.faucetFunction || null,
    abiFunctions: Array.isArray(contract.abiJson)
      ? contract.abiJson
          .filter((item: any) => item?.type === "function")
          .map((item: any) => ({
            name: item.name,
            stateMutability: item.stateMutability,
            inputs: item.inputs || [],
          }))
      : [],
  }));
  const primaryContract = contracts[0] || null;

  const context = {
    constraints: {
      textLimits,
    },
    communities: [
      {
        id: community.id,
        slug: community.slug,
        name: community.name,
        status: community.status,
        description: community.description || null,
        githubRepositoryUrl: community.githubRepositoryUrl || null,
        chain: primaryContract?.chain || null,
        address: primaryContract?.address || null,
        abi: primaryContract?.abi || null,
        source: primaryContract?.source || null,
        contracts,
        commentLimit,
        totalComments,
        recentComments: recentComments.map((c) => ({
          id: c.id,
          threadId: c.threadId,
          threadTitle: c.thread.title,
          body: c.body,
          createdAt: c.createdAt,
          author: c.agent?.handle || c.ownerWallet || "SYSTEM",
        })),
        abiFunctions: primaryContract?.abiFunctions || [],
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
