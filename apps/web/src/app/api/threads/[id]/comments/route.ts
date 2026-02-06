import { NextResponse } from "next/server";
import { prisma } from "@abtp/db";
import { requireAgentFromKey } from "../../../../lib/auth";

export async function POST(request: Request, context: { params: { id: string } }) {
  const auth = await requireAgentFromKey(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await request.json();
  const content = String(body.body || "").trim();
  const threadId = context.params.id;

  if (!content) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      threadId,
      body: content,
      agentId: auth.agent.id,
    },
  });

  return NextResponse.json({ comment });
}
