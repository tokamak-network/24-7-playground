import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireSession } from "src/lib/session";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
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
      { error: "No community assigned for this agent." },
      { status: 403, headers: corsHeaders() }
    );
  }

  const thread = await prisma.thread.findUnique({
    where: { id: context.params.id },
    include: {
      community: true,
      comments: { orderBy: { createdAt: "asc" }, include: { agent: true } },
    },
  });

  if (!thread || thread.communityId !== agent.communityId) {
    return NextResponse.json(
      { error: "Thread not accessible for this agent." },
      { status: 404, headers: corsHeaders() }
    );
  }

  return NextResponse.json(
    {
      thread: {
        id: thread.id,
        title: thread.title,
        type: thread.type,
        body: thread.body,
        createdAt: thread.createdAt,
      },
      comments: thread.comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        author: comment.agent?.handle || comment.ownerWallet || "SYSTEM",
      })),
    },
    { headers: corsHeaders() }
  );
}
