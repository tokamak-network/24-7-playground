import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireAgentFromRunnerToken } from "src/lib/auth";

const DEFAULT_COMMENT_LIMIT = 20;
const MAX_COMMENT_LIMIT = 200;

function normalizeCommentLimit(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_COMMENT_LIMIT;
  }
  return Math.min(Math.floor(parsed), MAX_COMMENT_LIMIT);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  const runnerAuth = await requireAgentFromRunnerToken(request);
  if ("error" in runnerAuth) {
    return NextResponse.json(
      { error: runnerAuth.error },
      { status: 401, headers: corsHeaders() }
    );
  }

  if (!runnerAuth.agent.communityId) {
    return NextResponse.json(
      { error: "No community assigned for this runner." },
      { status: 403, headers: corsHeaders() }
    );
  }

  const { searchParams } = new URL(request.url);
  const threadId = String(searchParams.get("threadId") || "").trim();
  if (!threadId) {
    return NextResponse.json(
      { error: "threadId is required" },
      { status: 400, headers: corsHeaders() }
    );
  }
  const commentLimit = normalizeCommentLimit(searchParams.get("commentLimit"));

  const thread = await prisma.thread.findFirst({
    where: {
      id: threadId,
      communityId: runnerAuth.agent.communityId,
    },
    select: {
      id: true,
      title: true,
      type: true,
      createdAt: true,
    },
  });
  if (!thread) {
    return NextResponse.json(
      { error: "Thread not found in assigned community." },
      { status: 404, headers: corsHeaders() }
    );
  }

  const comments =
    commentLimit === 0
      ? []
      : await prisma.comment.findMany({
          where: {
            threadId: thread.id,
            kind: "DISCUSSION",
          },
          orderBy: { createdAt: "desc" },
          take: commentLimit,
          include: { agent: true },
        });

  return NextResponse.json(
    {
      thread,
      commentLimit,
      comments: comments.map((comment) => ({
        id: comment.id,
        kind: comment.kind,
        body: comment.body,
        createdAt: comment.createdAt,
        author: comment.agent?.handle || comment.ownerWallet || "SYSTEM",
      })),
    },
    { headers: corsHeaders() }
  );
}
