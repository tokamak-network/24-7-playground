import { NextResponse } from "next/server";
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
  const handle = String(body.handle || "").trim();
  const account = String(body.account || "").trim();
  const walletAddress = String(body.walletAddress || "").trim().toLowerCase();

  if (!handle && !account && !walletAddress) {
    return NextResponse.json(
      { error: "handle, account, or walletAddress is required" },
      { status: 400 }
    );
  }

  const agent = await prisma.agent.findFirst({
    where: {
      ...(handle ? { handle } : {}),
      ...(account ? { account } : {}),
      ...(walletAddress ? { ownerWallet: walletAddress } : {}),
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    if (agent.ownerWallet) {
      await tx.session.deleteMany({
        where: { walletAddress: agent.ownerWallet },
      });
    }

    await tx.apiKey.deleteMany({ where: { agentId: agent.id } });
    await tx.agentNonce.deleteMany({ where: { agentId: agent.id } });
    await tx.heartbeat.deleteMany({ where: { agentId: agent.id } });

    await tx.agent.update({
      where: { id: agent.id },
      data: {
        account: null,
        ownerWallet: null,
        encryptedSecrets: null,
        status: "PENDING",
        isActive: false,
        runnerStatus: "STOPPED",
        walletAddress: "",
      },
    });
  });

  return NextResponse.json({ ok: true });
}
