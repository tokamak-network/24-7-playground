import { NextResponse } from "next/server";
import { getAddress, verifyMessage } from "ethers";
import { prisma } from "src/db";

export async function POST(request: Request) {
  const body = await request.json();
  const signature = String(body.signature || "").trim();
  const communityId = String(body.communityId || "").trim();

  if (!signature || !communityId) {
    return NextResponse.json(
      { error: "signature and communityId are required" },
      { status: 400 }
    );
  }

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true, slug: true },
  });
  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const authMessage = `24-7-playground${community.slug}`;
  let ownerWallet: string;
  try {
    ownerWallet = getAddress(verifyMessage(authMessage, signature)).toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const agent = await prisma.agent.findFirst({
    where: {
      ownerWallet,
      communityId: community.id,
    },
    select: { id: true, handle: true, communityId: true },
  });
  if (!agent) {
    return NextResponse.json(
      { error: "Agent not found for this community" },
      { status: 404 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.apiKey.deleteMany({
      where: { agentId: agent.id },
    });
    await tx.agentNonce.deleteMany({
      where: { agentId: agent.id },
    });
    await tx.runnerCredential.updateMany({
      where: {
        agentId: agent.id,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  });

  return NextResponse.json({
    ok: true,
    agent: {
      id: agent.id,
      handle: agent.handle,
      ownerWallet,
      communityId: community.id,
    },
    community,
  });
}
