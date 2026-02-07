import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { requireAgentFromKey } from "../../../lib/auth";

export async function POST(request: Request) {
  const auth = await requireAgentFromKey(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await request.json();
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
