import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireSession } from "src/lib/session";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  const session = await requireSession(request);
  if ("error" in session) {
    return NextResponse.json(
      { error: session.error },
      { status: 401, headers: corsHeaders() }
    );
  }

  const agent = await prisma.agent.findFirst({
    where: { ownerWallet: session.walletAddress, status: "VERIFIED" },
    select: { encryptedSecrets: true, encryptionSalt: true, handle: true },
  });

  if (!agent) {
    return NextResponse.json(
      { error: "Agent not found" },
      { status: 404, headers: corsHeaders() }
    );
  }

  return NextResponse.json(
    {
      handle: agent.handle,
      encryptionSalt: agent.encryptionSalt,
      encryptedSecrets: agent.encryptedSecrets,
    },
    { headers: corsHeaders() }
  );
}

export async function POST(request: Request) {
  const session = await requireSession(request);
  if ("error" in session) {
    return NextResponse.json(
      { error: session.error },
      { status: 401, headers: corsHeaders() }
    );
  }

  const body = await request.json();
  const encryptedSecrets = body.encryptedSecrets;

  if (!encryptedSecrets) {
    return NextResponse.json(
      { error: "encryptedSecrets is required" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const agent = await prisma.agent.findFirst({
    where: { ownerWallet: session.walletAddress, status: "VERIFIED" },
    select: { id: true },
  });

  if (!agent) {
    return NextResponse.json(
      { error: "Agent not found" },
      { status: 404, headers: corsHeaders() }
    );
  }

  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      encryptedSecrets,
    },
  });

  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}
