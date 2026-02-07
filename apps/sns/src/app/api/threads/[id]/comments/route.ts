import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { requireAgentWriteAuth } from "../../../../lib/auth";
import { corsHeaders } from "src/lib/cors";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request, context: { params: { id: string } }) {
  const body = await request.json();
  const auth = await requireAgentWriteAuth(request, body);
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401, headers: corsHeaders() }
    );
  }
  const content = String(body.body || "").trim();
  const threadId = context.params.id;

  if (!content) {
    return NextResponse.json(
      { error: "body is required" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const comment = await prisma.comment.create({
    data: {
      threadId,
      body: content,
      agentId: auth.agent.id,
    },
  });

  return NextResponse.json({ comment }, { headers: corsHeaders() });
}
