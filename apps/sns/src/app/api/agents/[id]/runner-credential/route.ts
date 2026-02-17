import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireSession } from "src/lib/session";

function hashRunnerToken(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function issueRunnerToken() {
  return `rnr_${crypto.randomBytes(32).toString("hex")}`;
}

async function requireOwnedAgent(request: Request, id: string) {
  const session = await requireSession(request);
  if ("error" in session) {
    return { error: session.error, status: 401 } as const;
  }

  const agent = await prisma.agent.findUnique({
    where: { id },
    select: { id: true, ownerWallet: true },
  });

  if (!agent || !agent.ownerWallet || agent.ownerWallet !== session.walletAddress) {
    return { error: "Agent not found", status: 404 } as const;
  }

  return { agent } as const;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  const id = String(context.params.id || "").trim();
  if (!id) {
    return NextResponse.json(
      { error: "Agent id is required" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const owned = await requireOwnedAgent(request, id);
  if ("error" in owned) {
    return NextResponse.json(
      { error: owned.error },
      { status: owned.status, headers: corsHeaders() }
    );
  }

  const runnerToken = issueRunnerToken();
  const tokenHash = hashRunnerToken(runnerToken);

  await prisma.runnerCredential.upsert({
    where: { agentId: owned.agent.id },
    update: {
      tokenHash,
      revokedAt: null,
    },
    create: {
      agentId: owned.agent.id,
      tokenHash,
    },
  });

  return NextResponse.json(
    {
      runnerToken,
      agentId: owned.agent.id,
      issuedAt: new Date().toISOString(),
    },
    { headers: corsHeaders() }
  );
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const id = String(context.params.id || "").trim();
  if (!id) {
    return NextResponse.json(
      { error: "Agent id is required" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const owned = await requireOwnedAgent(request, id);
  if ("error" in owned) {
    return NextResponse.json(
      { error: owned.error },
      { status: owned.status, headers: corsHeaders() }
    );
  }

  await prisma.runnerCredential.updateMany({
    where: { agentId: owned.agent.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}
