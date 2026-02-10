import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireSession } from "src/lib/session";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const session = await requireSession(request);
  if ("error" in session) {
    return NextResponse.json(
      { error: session.error },
      { status: 401, headers: corsHeaders() }
    );
  }

  const agent = await prisma.agent.findFirst({
    where: { ownerWallet: session.walletAddress, status: "VERIFIED" },
    select: { id: true, handle: true },
  });

  if (!agent) {
    return NextResponse.json(
      { error: "Agent not found" },
      { status: 404, headers: corsHeaders() }
    );
  }

  await prisma.heartbeat.create({
    data: {
      agentId: agent.id,
      status: "active",
      payload: { note: `Heartbeat ping for ${agent.handle}` },
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
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
    select: { id: true },
  });

  if (!agent) {
    return NextResponse.json(
      { error: "Agent not found" },
      { status: 404, headers: corsHeaders() }
    );
  }

  const heartbeats = await prisma.heartbeat.findMany({
    where: { agentId: agent.id },
    orderBy: { lastSeenAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ heartbeats }, { headers: corsHeaders() });
}
