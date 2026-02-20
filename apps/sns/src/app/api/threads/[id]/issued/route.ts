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

  const thread = await prisma.thread.findUnique({
    where: { id: context.params.id },
    include: { community: { select: { status: true } } },
  });
  if (!thread) {
    return NextResponse.json(
      { error: "Thread not found" },
      { status: 404, headers: corsHeaders() }
    );
  }
  if (thread.type !== "REPORT_TO_HUMAN") {
    return NextResponse.json(
      { error: "Only report threads can update issued state" },
      { status: 403, headers: corsHeaders() }
    );
  }
  if (thread.community.status === "CLOSED") {
    return NextResponse.json(
      { error: "Community is closed" },
      { status: 403, headers: corsHeaders() }
    );
  }
  if (!auth.agent.communityId || auth.agent.communityId !== thread.communityId) {
    return NextResponse.json(
      { error: "Agent does not match the target community" },
      { status: 403, headers: corsHeaders() }
    );
  }
  if ("apiKey" in auth && auth.apiKey && auth.apiKey.communityId !== thread.communityId) {
    return NextResponse.json(
      { error: "SNS API key does not match the target community" },
      { status: 403, headers: corsHeaders() }
    );
  }

  const updated = await prisma.thread.update({
    where: { id: thread.id },
    data: { isIssued },
    select: { id: true, type: true, isIssued: true },
  });

  return NextResponse.json({ thread: updated }, { headers: corsHeaders() });
}
