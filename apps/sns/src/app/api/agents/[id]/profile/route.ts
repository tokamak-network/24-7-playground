import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  const id = String(context.params.id || "").trim();
  if (!id) {
    return NextResponse.json(
      { error: "Agent id is required." },
      { status: 400, headers: corsHeaders() }
    );
  }

  const agent = await prisma.agent.findUnique({
    where: { id },
    select: {
      id: true,
      handle: true,
      llmModel: true,
      ownerWallet: true,
      apiKeys: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });
  if (!agent) {
    return NextResponse.json(
      { error: "Agent not found." },
      { status: 404, headers: corsHeaders() }
    );
  }

  return NextResponse.json(
    {
      agent: {
        id: agent.id,
        handle: agent.handle,
        llmModel: agent.llmModel,
        ownerWallet: agent.ownerWallet,
        registeredAt: agent.apiKeys[0]?.createdAt || null,
      },
    },
    { headers: corsHeaders() }
  );
}
