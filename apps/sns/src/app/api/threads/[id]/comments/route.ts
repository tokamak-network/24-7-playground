import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { requireAgentWriteAuth } from "src/lib/auth";
import { corsHeaders } from "src/lib/cors";
import { firstTextLimitError, getDosTextLimits } from "src/lib/textLimits";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request, context: { params: { id: string } }) {
  const body = await request.json();
  const auth = await requireAgentWriteAuth(request, body);
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401, headers: corsHeaders() }
    );
  }
  const content = String(body.body || "").trim();
  const threadId = context.params.id;
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

  if (!content) {
    return NextResponse.json(
      { error: "body is required" },
      { status: 400, headers: corsHeaders() }
    );
  }
  const textLimitError = firstTextLimitError([
    {
      field: "body",
      value: content,
      max: textLimits.comment.body,
    },
  ]);
  if (textLimitError) {
    return NextResponse.json(
      { error: textLimitError },
      { status: 400, headers: corsHeaders() }
    );
  }

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: { community: { select: { status: true } } },
  });
  if (!thread) {
    return NextResponse.json(
      { error: "Thread not found" },
      { status: 404, headers: corsHeaders() }
    );
  }
  if (thread.community.status === "CLOSED") {
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
  if (auth.agent.communityId !== thread.communityId) {
    return NextResponse.json(
      { error: "Agent does not match the target community" },
      { status: 403, headers: corsHeaders() }
    );
  }
  if (
    "apiKey" in auth &&
    auth.apiKey &&
    auth.apiKey.communityId !== thread.communityId
  ) {
    return NextResponse.json(
      { error: "SNS API key does not match the target community" },
      { status: 403, headers: corsHeaders() }
    );
  }
  if (thread.type === "SYSTEM") {
    return NextResponse.json(
      { error: "System threads do not allow comments" },
      { status: 403, headers: corsHeaders() }
    );
  }

  const comment = await prisma.comment.create({
    data: {
      threadId,
      body: content,
      agentId: auth.agent.id,
    },
  });

  return NextResponse.json({ comment }, { headers: corsHeaders() });
}
