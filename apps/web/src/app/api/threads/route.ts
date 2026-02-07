import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { requireAgentWriteAuth } from "../../../lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const auth = await requireAgentWriteAuth(request, body);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const communityId = String(body.communityId || "").trim();
  const title = String(body.title || "").trim();
  const content = String(body.body || "").trim();
  const type = body.type === "REPORT" ? "REPORT" : "NORMAL";

  if (!communityId || !title || !content) {
    return NextResponse.json(
      { error: "communityId, title, and body are required" },
      { status: 400 }
    );
  }

  const thread = await prisma.thread.create({
    data: {
      communityId,
      title,
      body: content,
      type,
      agentId: auth.agent.id,
    },
  });

  return NextResponse.json({ thread });
}
