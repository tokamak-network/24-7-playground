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

async function requireOwnedAgent(request: Request, id: string) {
  const session = await requireSession(request);
  if ("error" in session) {
    return { error: session.error, status: 401 } as const;
  }

  const agent = await prisma.agent.findUnique({
    where: { id },
    select: {
      id: true,
      handle: true,
      ownerWallet: true,
      account: true,
      communityId: true,
      isActive: true,
      runner: true,
      createdTime: true,
      lastActivityTime: true,
    },
  });
  if (!agent || !agent.ownerWallet || agent.ownerWallet !== session.walletAddress) {
    return { error: "Agent not found", status: 404 } as const;
  }

  return { agent } as const;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(
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

  const community = owned.agent.communityId
    ? await prisma.community.findUnique({
        where: { id: owned.agent.communityId },
        select: { id: true, slug: true, name: true, status: true },
      })
    : null;

  return NextResponse.json(
    {
      agent: {
        id: owned.agent.id,
        handle: owned.agent.handle,
        ownerWallet: owned.agent.ownerWallet,
        accountSignature: owned.agent.account,
        isActive: owned.agent.isActive,
        runner: readRunner(owned.agent.runner),
        createdTime: owned.agent.createdTime,
        lastActivityTime: owned.agent.lastActivityTime,
      },
      community,
    },
    { headers: corsHeaders() }
  );
}

export async function PATCH(
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

  const body = await request.json();
  const handle = String(body.handle || "").trim();
  const isActive =
    typeof body.isActive === "boolean" ? body.isActive : owned.agent.isActive;
  const intervalSec = Number(body.intervalSec);
  if (!handle) {
    return NextResponse.json(
      { error: "handle is required" },
      { status: 400, headers: corsHeaders() }
    );
  }
  if (!Number.isFinite(intervalSec) || intervalSec < 10) {
    return NextResponse.json(
      { error: "intervalSec must be >= 10" },
      { status: 400, headers: corsHeaders() }
    );
  }

  if (handle !== owned.agent.handle) {
    const conflict = await prisma.agent.findUnique({ where: { handle } });
    if (conflict && conflict.id !== owned.agent.id) {
      return NextResponse.json(
        { error: "handle already exists" },
        { status: 409, headers: corsHeaders() }
      );
    }
  }

  const existingRunner = readRunner(owned.agent.runner);

  const updated = await prisma.agent.update({
    where: { id: owned.agent.id },
    data: {
      handle,
      isActive,
      runner: {
        status: existingRunner.status,
        intervalSec: Math.floor(intervalSec),
      },
    },
    select: {
      id: true,
      handle: true,
      ownerWallet: true,
      account: true,
      isActive: true,
      runner: true,
      createdTime: true,
      lastActivityTime: true,
    },
  });

  return NextResponse.json(
    {
      agent: {
        id: updated.id,
        handle: updated.handle,
        ownerWallet: updated.ownerWallet,
        accountSignature: updated.account,
        isActive: updated.isActive,
        runner: readRunner(updated.runner),
        createdTime: updated.createdTime,
        lastActivityTime: updated.lastActivityTime,
      },
    },
    { headers: corsHeaders() }
  );
}
