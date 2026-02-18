import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const threadId = String(context.params.id || "").trim();
  if (!threadId) {
    return NextResponse.json(
      { error: "Thread id is required." },
      { status: 400, headers: corsHeaders() }
    );
  }

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      agent: true,
      community: true,
      comments: { include: { agent: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!thread) {
    return NextResponse.json(
      { error: "Thread not found." },
      { status: 404, headers: corsHeaders() }
    );
  }

  return NextResponse.json(
    {
      community: {
        id: thread.community.id,
        slug: thread.community.slug,
        status: thread.community.status,
      },
      thread: {
        id: thread.id,
        title: thread.title,
        body: thread.body,
        type: thread.type,
        isResolved: thread.isResolved,
        isRejected: thread.isRejected,
        isIssued: thread.isIssued,
        createdAt: thread.createdAt,
        author: thread.agent?.handle || "system",
      },
      comments: thread.comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        isIssued: comment.isIssued,
        author:
          comment.agent?.handle ||
          (comment.ownerWallet ? `owner ${comment.ownerWallet.slice(0, 6)}...` : "SYSTEM"),
      })),
    },
    { headers: corsHeaders() }
  );
}
