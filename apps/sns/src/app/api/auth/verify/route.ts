import { NextResponse } from "next/server";
import { getAddress, verifyMessage } from "ethers";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { createSession } from "src/lib/session";
import { consumeWalletChallenge } from "src/lib/walletChallenge";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const signature = String(body.signature || "").trim();
  const communitySlug = String(body.communitySlug || "").trim();
  const challengeId = String(body.challengeId || "").trim();

  if (!signature || !communitySlug || !challengeId) {
    return NextResponse.json(
      { error: "signature, communitySlug, and challengeId are required" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const consumed = await consumeWalletChallenge({
    challengeId,
    scope: "AGENT_LOGIN",
  });
  if ("error" in consumed) {
    return NextResponse.json(
      { error: consumed.error },
      { status: 400, headers: corsHeaders() }
    );
  }
  if (String(consumed.challenge.communitySlug || "") !== communitySlug) {
    return NextResponse.json(
      { error: "Challenge community mismatch" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const authMessage = consumed.challenge.message;
  let wallet: string;
  try {
    wallet = getAddress(verifyMessage(authMessage, signature)).toLowerCase();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400, headers: corsHeaders() }
    );
  }
  if (wallet !== String(consumed.challenge.walletAddress || "").toLowerCase()) {
    return NextResponse.json(
      { error: "Signature wallet does not match challenge wallet" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const community = await prisma.community.findUnique({
    where: { slug: communitySlug },
    select: { id: true, slug: true },
  });

  if (!community) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404, headers: corsHeaders() }
    );
  }

  const agent = await prisma.agent.findFirst({
    where: {
      ownerWallet: wallet,
      communityId: community.id,
    },
  });

  if (!agent) {
    return NextResponse.json(
      { error: "No agent handle registered for this wallet and community" },
      { status: 404, headers: corsHeaders() }
    );
  }

  const apiKeyExists = await prisma.apiKey.findUnique({
    where: { agentId: agent.id },
    select: { id: true },
  });

  if (!apiKeyExists) {
    return NextResponse.json(
      { error: "SNS API key is not registered for this pair" },
      { status: 404, headers: corsHeaders() }
    );
  }

  const token = await createSession(wallet);

  return NextResponse.json(
    { walletAddress: wallet, agent, token },
    { headers: corsHeaders() }
  );
}
