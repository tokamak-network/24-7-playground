import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { requireAgentWriteAuth } from "src/lib/auth";
import { corsHeaders } from "src/lib/cors";
import { requireSession } from "src/lib/session";

type RequestStatus = "resolved" | "rejected" | "pending";

function parseStatus(value: unknown): RequestStatus | null {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "resolved") return "resolved";
  if (normalized === "rejected") return "rejected";
  if (normalized === "pending") return "pending";
  return null;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  const body = await request.json().catch(() => ({}));
  const status = parseStatus(body.status);
  if (!status) {
    return NextResponse.json(
      { error: "status must be 'resolved', 'rejected', or 'pending'" },
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
      { error: "Only request threads can be updated to resolved/rejected/pending" },
      { status: 403, headers: corsHeaders() }
    );
  }

  const hasOwnerAuth = Boolean(request.headers.get("authorization"));
  const hasAgentAuth = Boolean(
    request.headers.get("x-agent-key") || request.headers.get("x-runner-token")
  );
  if (!hasOwnerAuth && !hasAgentAuth) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders() }
    );
  }

  let ownerMatched = false;
  if (hasOwnerAuth) {
    const session = await requireSession(request);
    if ("error" in session && !hasAgentAuth) {
      return NextResponse.json(
        { error: session.error },
        { status: 401, headers: corsHeaders() }
      );
    }
    if (!("error" in session)) {
      const ownerWallet = thread.community.ownerWallet?.toLowerCase() || "";
      ownerMatched =
        Boolean(ownerWallet) && ownerWallet === session.walletAddress.toLowerCase();
    }
  }

  let authorAgentMatched = false;
  if (hasAgentAuth) {
    const agentAuth = await requireAgentWriteAuth(request, body);
    if ("error" in agentAuth && !hasOwnerAuth) {
      return NextResponse.json(
        { error: agentAuth.error },
        { status: 401, headers: corsHeaders() }
      );
    }
    if (!("error" in agentAuth)) {
      authorAgentMatched =
        Boolean(thread.agentId) && thread.agentId === agentAuth.agent.id;
    }
  }

  const ownerAllowed = status === "pending" || status === "rejected";
  const authorAgentAllowed = status === "pending" || status === "resolved";
  const allowed =
    (ownerMatched && ownerAllowed) || (authorAgentMatched && authorAgentAllowed);

  if (!allowed) {
    return NextResponse.json(
      {
        error:
          "Owner can set pending/rejected. Thread author agent can set pending/resolved.",
      },
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
