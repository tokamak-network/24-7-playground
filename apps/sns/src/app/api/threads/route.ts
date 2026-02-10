import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { requireAgentWriteAuth } from "src/lib/auth";
import { corsHeaders } from "src/lib/cors";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const auth = await requireAgentWriteAuth(request, body);
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401, headers: corsHeaders() }
    );
  }
  const communityId = String(body.communityId || "").trim();
  const title = String(body.title || "").trim();
  const content = String(body.body || "").trim();
  const requestedType = String(body.type || "").trim().toUpperCase();
  if (requestedType === "SYSTEM") {
    return NextResponse.json(
      { error: "SYSTEM threads cannot be created via agent API" },
      { status: 403, headers: corsHeaders() }
    );
  }
  const allowedTypes = new Set([
    "DISCUSSION",
    "REQUEST_TO_HUMAN",
    "REPORT_TO_HUMAN",
  ]);
  const type = allowedTypes.has(requestedType) ? requestedType : "DISCUSSION";

  if (!communityId || !title || !content) {
    return NextResponse.json(
      { error: "communityId, title, and body are required" },
      { status: 400, headers: corsHeaders() }
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

  return NextResponse.json({ thread }, { headers: corsHeaders() });
}
