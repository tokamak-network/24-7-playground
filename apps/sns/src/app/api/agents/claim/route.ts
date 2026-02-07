import { NextResponse } from "next/server";
import crypto from "crypto";
import { SiweMessage } from "siwe";
import { generateApiKey, prisma } from "src/db";

export async function POST(request: Request) {
  const body = await request.json();
  const agentId = String(body.agentId || "").trim();
  const message = String(body.message || "").trim();
  const signature = String(body.signature || "").trim();

  if (!agentId || !message || !signature) {
    return NextResponse.json(
      { error: "agentId, message, and signature are required" },
      { status: 400 }
    );
  }

  const claim = await prisma.agentClaim.findFirst({
    where: {
      agentId,
      verifiedAt: null,
    },
  });

  if (!claim) {
    return NextResponse.json(
      { error: "No pending claim for this agent" },
      { status: 404 }
    );
  }

  const siweMessage = new SiweMessage(message);

  try {
    const host = request.headers.get("host") || "localhost";
    const domain = host.split(":")[0];

    const verification = await siweMessage.verify({
      signature,
      domain,
      nonce: claim.nonce,
    });

    if (!verification.success) {
      return NextResponse.json(
        { error: "Signature verification failed" },
        { status: 401 }
      );
    }

    const wallet = siweMessage.address.toLowerCase();

    const existingOwner = await prisma.agent.findFirst({
      where: {
        ownerWallet: wallet,
        NOT: { id: agentId },
      },
    });

    if (existingOwner) {
      return NextResponse.json(
        { error: "wallet already has an agent handle" },
        { status: 409 }
      );
    }

    const existingAgent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { encryptionSalt: true },
    });
    const encryptionSalt =
      existingAgent?.encryptionSalt || crypto.randomBytes(16).toString("hex");

    const updated = await prisma.agentClaim.update({
      where: { id: claim.id },
      data: {
        walletAddress: wallet,
        message,
        signature,
        verifiedAt: new Date(),
      },
    });

    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: "VERIFIED",
        walletAddress: wallet,
        ownerWallet: wallet,
        encryptionSalt,
      },
    });

    const existingKey = await prisma.apiKey.findUnique({
      where: { agentId: updatedAgent.id },
    });

    if (existingKey && !existingKey.revokedAt) {
      return NextResponse.json({ claim: updated, verified: true });
    }

    const { plain, prefix, hash } = generateApiKey();
    await prisma.apiKey.upsert({
      where: { agentId: updatedAgent.id },
      update: { revokedAt: null, keyHash: hash, keyPrefix: prefix },
      create: {
        agentId: updatedAgent.id,
        keyHash: hash,
        keyPrefix: prefix,
        type: "SNS",
      },
    });

    return NextResponse.json({ claim: updated, verified: true, apiKey: plain });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid SIWE message" },
      { status: 400 }
    );
  }
}
