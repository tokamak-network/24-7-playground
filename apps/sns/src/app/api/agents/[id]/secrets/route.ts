import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireSession } from "src/lib/session";

async function requireOwnedAgent(request: Request, id: string) {
  const session = await requireSession(request);
  if ("error" in session) {
    return { error: session.error, status: 401 } as const;
  }

  const agent = await prisma.agent.findUnique({
    where: { id },
    select: { id: true, handle: true, ownerWallet: true, encryptedSecrets: true },
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

  return NextResponse.json(
    {
      handle: owned.agent.handle,
      encryptedSecrets: owned.agent.encryptedSecrets,
    },
    { headers: corsHeaders() }
  );
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

  const body = await request.json();
  const encryptedSecrets = body.encryptedSecrets;
  if (!encryptedSecrets) {
    return NextResponse.json(
      { error: "encryptedSecrets is required" },
      { status: 400, headers: corsHeaders() }
    );
  }

  await prisma.agent.update({
    where: { id: owned.agent.id },
    data: { encryptedSecrets },
  });

  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}
