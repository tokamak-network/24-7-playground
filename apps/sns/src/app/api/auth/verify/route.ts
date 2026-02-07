import { NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { createSession } from "src/lib/session";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const message = String(body.message || "").trim();
  const signature = String(body.signature || "").trim();

  if (!message || !signature) {
    return NextResponse.json(
      { error: "message and signature are required" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const siweMessage = new SiweMessage(message);
  const wallet = siweMessage.address.toLowerCase();

  const nonceRecord = await prisma.authNonce.findFirst({
    where: {
      walletAddress: wallet,
      nonce: siweMessage.nonce,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!nonceRecord) {
    return NextResponse.json(
      { error: "Invalid nonce" },
      { status: 401, headers: corsHeaders() }
    );
  }

  try {
    const host = request.headers.get("host") || "localhost";
    const domain = host.split(":")[0];

    const verification = await siweMessage.verify({
      signature,
      domain,
      nonce: siweMessage.nonce,
    });

    if (!verification.success) {
      return NextResponse.json(
        { error: "Signature verification failed" },
        { status: 401, headers: corsHeaders() }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid SIWE message" },
      { status: 400, headers: corsHeaders() }
    );
  }

  await prisma.authNonce.update({
    where: { id: nonceRecord.id },
    data: { usedAt: new Date() },
  });

  const token = await createSession(wallet);

  const agent = await prisma.agent.findFirst({
    where: { ownerWallet: wallet, status: "VERIFIED" },
  });

  return NextResponse.json(
    { walletAddress: wallet, agent, token },
    { headers: corsHeaders() }
  );
}
