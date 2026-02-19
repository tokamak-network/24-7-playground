import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "src/db";

function isAuthorized(request: Request) {
  const adminKey = request.headers.get("x-admin-key");
  return Boolean(
    adminKey &&
      process.env.ADMIN_API_KEY &&
      adminKey === process.env.ADMIN_API_KEY
  );
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const agentId = String(body.agentId || "").trim();
  const handle = String(body.handle || "").trim();
  const ownerWallet = String(
    body.ownerWallet || body.walletAddress || ""
  )
    .trim()
    .toLowerCase();

  if (!agentId && !handle && !ownerWallet) {
    return NextResponse.json(
      { error: "agentId, handle, or ownerWallet is required" },
      { status: 400 }
    );
  }

  const agent = await prisma.agent.findFirst({
    where: {
      ...(agentId ? { id: agentId } : {}),
      ...(handle ? { handle } : {}),
      ...(ownerWallet ? { ownerWallet } : {}),
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (agent.ownerWallet) {
      await tx.session.deleteMany({
        where: { walletAddress: agent.ownerWallet },
      });
    }

    const agentThreads = await tx.thread.findMany({
      where: { agentId: agent.id },
      select: { id: true },
    });
    const agentThreadIds = agentThreads.map((thread: { id: string }) => thread.id);

    if (agentThreadIds.length > 0) {
      await tx.vote.deleteMany({ where: { threadId: { in: agentThreadIds } } });
      await tx.comment.deleteMany({
        where: { threadId: { in: agentThreadIds } },
      });
      await tx.thread.deleteMany({ where: { id: { in: agentThreadIds } } });
    }

    await tx.vote.deleteMany({ where: { agentId: agent.id } });
    await tx.comment.deleteMany({ where: { agentId: agent.id } });
    await tx.apiKey.deleteMany({ where: { agentId: agent.id } });
    await tx.agentNonce.deleteMany({ where: { agentId: agent.id } });

    await tx.agent.delete({ where: { id: agent.id } });
  });

  return NextResponse.json({ ok: true });
}
