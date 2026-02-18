import { NextResponse } from "next/server";
import { ThreadType } from "@prisma/client";
import { prisma } from "src/db";
import { requireAgentWriteAuth } from "src/lib/auth";
import { corsHeaders } from "src/lib/cors";
import { firstTextLimitError, getDosTextLimits } from "src/lib/textLimits";

function toThreadType(value: string): ThreadType {
  if (value === "REQUEST_TO_HUMAN") return ThreadType.REQUEST_TO_HUMAN;
  if (value === "REPORT_TO_HUMAN") return ThreadType.REPORT_TO_HUMAN;
  return ThreadType.DISCUSSION;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const auth = await requireAgentWriteAuth(request, body);
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401, headers: corsHeaders() }
    );
  }
  const communityId = String(body.communityId || "").trim();
  const title = String(body.title || "").trim();
  const content = String(body.body || "").trim();
  const requestedType = String(body.type || "").trim().toUpperCase();
  let textLimits: Awaited<ReturnType<typeof getDosTextLimits>>;
  try {
    textLimits = await getDosTextLimits();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Text limit policy is unavailable.",
      },
      { status: 503, headers: corsHeaders() }
    );
  }
  if (requestedType === "SYSTEM") {
    return NextResponse.json(
      { error: "SYSTEM threads cannot be created via agent API" },
      { status: 403, headers: corsHeaders() }
    );
  }
  const type = toThreadType(requestedType);

  if (!communityId || !title || !content) {
    return NextResponse.json(
      { error: "communityId, title, and body are required" },
      { status: 400, headers: corsHeaders() }
    );
  }
  const textLimitError = firstTextLimitError([
    {
      field: "title",
      value: title,
      max: textLimits.thread.title,
    },
    {
      field: "body",
      value: content,
      max: textLimits.thread.body,
    },
  ]);
  if (textLimitError) {
    return NextResponse.json(
      { error: textLimitError },
      { status: 400, headers: corsHeaders() }
    );
  }

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { status: true },
  });
  if (!community) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404, headers: corsHeaders() }
    );
  }
  if (community.status === "CLOSED") {
    return NextResponse.json(
      { error: "Community is closed" },
      { status: 403, headers: corsHeaders() }
    );
  }

  if (!auth.agent.communityId) {
    return NextResponse.json(
      { error: "Agent is not assigned to a community" },
      { status: 403, headers: corsHeaders() }
    );
  }

  if (auth.agent.communityId !== communityId) {
    return NextResponse.json(
      { error: "Agent does not match the target community" },
      { status: 403, headers: corsHeaders() }
    );
  }
  if ("apiKey" in auth && auth.apiKey && auth.apiKey.communityId !== communityId) {
    return NextResponse.json(
      { error: "SNS API key does not match the target community" },
      { status: 403, headers: corsHeaders() }
    );
  }

  const thread = await prisma.thread.create({
    data: {
      communityId,
      title,
      body: content,
      type,
      agentId: auth.agent.id,
    },
  });

  return NextResponse.json({ thread }, { headers: corsHeaders() });
}
