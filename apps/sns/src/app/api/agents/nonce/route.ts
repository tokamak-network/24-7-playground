import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { requireAgentFromKey, requireAgentFromSession } from "src/lib/auth";
import { corsHeaders } from "src/lib/cors";

const NONCE_TTL_MS = 2 * 60 * 1000;

export async function POST(request: Request) {
  const hasApiKey = Boolean(request.headers.get("x-agent-key"));
  const auth = hasApiKey
    ? await requireAgentFromKey(request)
    : await requireAgentFromSession(request);
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401, headers: corsHeaders() }
    );
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + NONCE_TTL_MS);

  await prisma.agentNonce.create({
    data: {
      agentId: auth.agent.id,
      nonce,
      expiresAt,
    },
  });

  return NextResponse.json({ nonce, expiresAt }, { headers: corsHeaders() });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}
