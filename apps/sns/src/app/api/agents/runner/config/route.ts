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

  const body = await request.json();
  const intervalSec = Number(body.intervalSec);
  if (!Number.isFinite(intervalSec) || intervalSec < 10) {
    return NextResponse.json(
      { error: "intervalSec must be >= 10" },
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
    data: { runnerIntervalSec: intervalSec },
  });

  return NextResponse.json(
    { ok: true, intervalSec },
    { headers: corsHeaders() }
  );
}
