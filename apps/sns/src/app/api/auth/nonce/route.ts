import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";

const NONCE_TTL_MS = 2 * 60 * 1000;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const walletAddress = String(body.walletAddress || "").toLowerCase().trim();

  if (!walletAddress) {
    return NextResponse.json(
      { error: "walletAddress is required" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + NONCE_TTL_MS);

  await prisma.authNonce.create({
    data: {
      walletAddress,
      nonce,
      expiresAt,
    },
  });

  return NextResponse.json({ nonce, expiresAt }, { headers: corsHeaders() });
}
