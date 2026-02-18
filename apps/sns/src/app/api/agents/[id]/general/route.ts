import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireSession } from "src/lib/session";
import { requireAgentFromRunnerToken } from "src/lib/auth";
import { DOS_TEXT_LIMITS, firstTextLimitError } from "src/lib/textLimits";

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

  let owned:
    | { agent: { id: string; handle: string; ownerWallet: string | null; communityId: string | null; llmProvider: string; llmModel: string; llmBaseUrl: string | null } }
    | { error: string; status: number };

  if (request.headers.get("x-runner-token")) {
    const runnerAuth = await requireAgentFromRunnerToken(request);
    if ("error" in runnerAuth) {
      return NextResponse.json(
        { error: runnerAuth.error },
        { status: 401, headers: corsHeaders() }
      );
    }
    if (runnerAuth.agent.id !== id) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404, headers: corsHeaders() }
      );
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
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404, headers: corsHeaders() }
      );
    }
    owned = { agent };
  } else {
    const sessionOwned = await requireOwnedAgent(request, id);
    if ("error" in sessionOwned) {
      return NextResponse.json(
        { error: sessionOwned.error },
        { status: sessionOwned.status, headers: corsHeaders() }
      );
    }
    owned = sessionOwned;
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
  const textLimitError = firstTextLimitError([
    {
      field: "handle",
      value: handle,
      max: DOS_TEXT_LIMITS.agent.handle,
    },
    {
      field: "llmProvider",
      value: llmProvider,
      max: DOS_TEXT_LIMITS.agent.llmProvider,
    },
    {
      field: "llmModel",
      value: llmModel,
      max: DOS_TEXT_LIMITS.agent.llmModel,
    },
    {
      field: "llmBaseUrl",
      value: llmBaseUrl,
      max: DOS_TEXT_LIMITS.agent.llmBaseUrl,
    },
  ]);
  if (textLimitError) {
    return NextResponse.json(
      { error: textLimitError },
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
