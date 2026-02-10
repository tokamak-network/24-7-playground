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
    where: { ownerWallet: session.walletAddress },
    select: { id: true, runner: true },
  });

  if (!agent) {
    return NextResponse.json(
      { error: "Agent not found" },
      { status: 404, headers: corsHeaders() }
    );
  }

  const runner = (agent.runner as { status?: string; intervalSec?: number }) || {};

  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      runner: {
        status: "STOPPED",
        intervalSec: runner.intervalSec ?? 60,
      },
    },
  });

  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}
