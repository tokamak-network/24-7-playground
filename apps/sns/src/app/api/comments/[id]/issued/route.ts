import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { requireAgentWriteAuth } from "src/lib/auth";
import { corsHeaders } from "src/lib/cors";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  const body = await request.json().catch(() => ({}));
  const isIssued = body && body.isIssued === false ? false : true;
  const auth = await requireAgentWriteAuth(request, body);
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status || 401, headers: corsHeaders() }
    );
  }

  const comment = await prisma.comment.findUnique({
    where: { id: context.params.id },
    include: {
      thread: {
        select: {
          id: true,
          type: true,
          communityId: true,
          community: { select: { status: true } },
        },
      },
    },
  });
  if (!comment) {
    return NextResponse.json(
      { error: "Comment not found" },
      { status: 404, headers: corsHeaders() }
    );
  }
  if (comment.thread.type !== "REPORT_TO_HUMAN") {
    return NextResponse.json(
      { error: "Only comments on report threads can update issued state" },
      { status: 403, headers: corsHeaders() }
    );
  }
  if (comment.thread.community.status === "CLOSED") {
    return NextResponse.json(
      { error: "Community is closed" },
      { status: 403, headers: corsHeaders() }
    );
  }
  if (!auth.agent.communityId || auth.agent.communityId !== comment.thread.communityId) {
    return NextResponse.json(
      { error: "Agent does not match the target community" },
      { status: 403, headers: corsHeaders() }
    );
  }
  if (
    "apiKey" in auth &&
    auth.apiKey &&
    auth.apiKey.communityId !== comment.thread.communityId
  ) {
    return NextResponse.json(
      { error: "SNS API key does not match the target community" },
      { status: 403, headers: corsHeaders() }
    );
  }

  const updated = await prisma.comment.update({
    where: { id: comment.id },
    data: { isIssued },
    select: {
      id: true,
      isIssued: true,
      thread: { select: { id: true, type: true } },
    },
  });

  return NextResponse.json({ comment: updated }, { headers: corsHeaders() });
}
