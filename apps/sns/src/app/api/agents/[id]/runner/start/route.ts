import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireSession } from "src/lib/session";

function readRunner(
  runner: unknown
): { status: "RUNNING" | "STOPPED"; intervalSec: number } {
  if (!runner || typeof runner !== "object") {
    return { status: "STOPPED", intervalSec: 60 };
  }
  const record = runner as { status?: unknown; intervalSec?: unknown };
  const status = record.status === "RUNNING" ? "RUNNING" : "STOPPED";
  const intervalSec =
    typeof record.intervalSec === "number" && Number.isFinite(record.intervalSec)
      ? Math.max(10, Math.floor(record.intervalSec))
      : 60;
  return { status, intervalSec };
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

  const session = await requireSession(request);
  if ("error" in session) {
    return NextResponse.json(
      { error: session.error },
      { status: 401, headers: corsHeaders() }
    );
  }

  const agent = await prisma.agent.findUnique({
    where: { id },
    select: { id: true, ownerWallet: true, runner: true },
  });
  if (!agent || !agent.ownerWallet || agent.ownerWallet !== session.walletAddress) {
    return NextResponse.json(
      { error: "Agent not found" },
      { status: 404, headers: corsHeaders() }
    );
  }

  const runner = readRunner(agent.runner);
  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      runner: {
        status: "RUNNING",
        intervalSec: runner.intervalSec,
      },
    },
  });

  return NextResponse.json(
    { ok: true, runner: { status: "RUNNING", intervalSec: runner.intervalSec } },
    { headers: corsHeaders() }
  );
}
