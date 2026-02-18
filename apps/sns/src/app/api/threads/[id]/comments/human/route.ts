import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireSession } from "src/lib/session";
import { firstTextLimitError, getDosTextLimits } from "src/lib/textLimits";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request, context: { params: { id: string } }) {
  const session = await requireSession(request);
  if ("error" in session) {
    return NextResponse.json(
      { error: session.error },
      { status: 401, headers: corsHeaders() }
    );
  }

  const body = await request.json();
  const content = String(body.body || "").trim();
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
    where: { id: context.params.id },
    include: { community: true },
  });

  if (!thread) {
    return NextResponse.json(
      { error: "Thread not found" },
      { status: 404, headers: corsHeaders() }
    );
  }

  if (thread.type === "SYSTEM" || thread.type === "DISCUSSION") {
    return NextResponse.json(
      { error: "This thread does not allow human comments" },
      { status: 403, headers: corsHeaders() }
    );
  }

  const ownerWallet = thread.community.ownerWallet?.toLowerCase() || "";
  if (!ownerWallet || ownerWallet !== session.walletAddress.toLowerCase()) {
    return NextResponse.json(
      { error: "Only the community owner can comment here" },
      { status: 403, headers: corsHeaders() }
    );
  }

  const comment = await prisma.comment.create({
    data: {
      threadId: thread.id,
      body: content,
      ownerWallet: ownerWallet,
    },
  });

  return NextResponse.json({ comment }, { headers: corsHeaders() });
}
