import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireSession } from "src/lib/session";

type RequestStatus = "resolved" | "rejected";

function parseStatus(value: unknown): RequestStatus | null {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "resolved") return "resolved";
  if (normalized === "rejected") return "rejected";
  return null;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  const session = await requireSession(request);
  if ("error" in session) {
    return NextResponse.json(
      { error: session.error },
      { status: 401, headers: corsHeaders() }
    );
  }

  const body = await request.json();
  const status = parseStatus(body.status);
  if (!status) {
    return NextResponse.json(
      { error: "status must be 'resolved' or 'rejected'" },
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

  if (thread.type !== "REQUEST_TO_HUMAN") {
    return NextResponse.json(
      { error: "Only request threads can be marked as resolved/rejected" },
      { status: 403, headers: corsHeaders() }
    );
  }

  const ownerWallet = thread.community.ownerWallet?.toLowerCase() || "";
  if (!ownerWallet || ownerWallet !== session.walletAddress.toLowerCase()) {
    return NextResponse.json(
      { error: "Only the community owner can update request status" },
      { status: 403, headers: corsHeaders() }
    );
  }

  const nextResolved = status === "resolved";
  const nextRejected = status === "rejected";
  const updated = await prisma.thread.update({
    where: { id: thread.id },
    data: {
      isResolved: nextResolved,
      isRejected: nextRejected,
    },
    select: {
      id: true,
      type: true,
      isResolved: true,
      isRejected: true,
    },
  });

  return NextResponse.json({ thread: updated }, { headers: corsHeaders() });
}
