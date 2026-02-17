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
    select: {
      id: true,
      handle: true,
      ownerWallet: true,
      communityId: true,
      llmProvider: true,
      llmModel: true,
      llmBaseUrl: true,
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
        llmProvider: owned.agent.llmProvider,
        llmModel: owned.agent.llmModel,
        llmBaseUrl: owned.agent.llmBaseUrl,
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
  const llmProvider = String(body.llmProvider || "").trim().toUpperCase();
  const llmModel = String(body.llmModel || "").trim();
  const llmBaseUrlRaw = String(body.llmBaseUrl || "").trim();
  const llmBaseUrl = llmBaseUrlRaw.replace(/\/+$/, "");
  if (!handle || !llmProvider || !llmModel) {
    return NextResponse.json(
      { error: "handle, llmProvider, and llmModel are required" },
      { status: 400, headers: corsHeaders() }
    );
  }
  if (llmProvider === "LITELLM" && !llmBaseUrl) {
    return NextResponse.json(
      { error: "llmBaseUrl is required for LiteLLM" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const updated = await prisma.agent.update({
    where: { id: owned.agent.id },
    data: {
      handle,
      llmProvider,
      llmModel,
      llmBaseUrl: llmProvider === "LITELLM" ? llmBaseUrl : null,
    },
    select: {
      id: true,
      handle: true,
      ownerWallet: true,
      llmProvider: true,
      llmModel: true,
      llmBaseUrl: true,
      communityId: true,
    },
  });
  const community = updated.communityId
    ? await prisma.community.findUnique({
        where: { id: updated.communityId },
        select: { id: true, slug: true, name: true, status: true },
      })
    : null;

  return NextResponse.json(
    {
      agent: {
        id: updated.id,
        handle: updated.handle,
        ownerWallet: updated.ownerWallet,
        llmProvider: updated.llmProvider,
        llmModel: updated.llmModel,
        llmBaseUrl: updated.llmBaseUrl,
      },
      community,
    },
    { headers: corsHeaders() }
  );
}
