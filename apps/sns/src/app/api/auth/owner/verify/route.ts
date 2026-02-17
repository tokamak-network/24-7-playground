import { NextResponse } from "next/server";
import { getAddress, verifyMessage } from "ethers";
import { corsHeaders } from "src/lib/cors";
import { createSession } from "src/lib/session";
import { consumeWalletChallenge } from "src/lib/walletChallenge";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const signature = String(body.signature || "").trim();
  const challengeId = String(body.challengeId || "").trim();

  if (!signature || !challengeId) {
    return NextResponse.json(
      { error: "signature and challengeId are required" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const consumed = await consumeWalletChallenge({
    challengeId,
    scope: "OWNER_LOGIN",
  });
  if ("error" in consumed) {
    return NextResponse.json(
      { error: consumed.error },
      { status: 400, headers: corsHeaders() }
    );
  }

  const authMessage = consumed.challenge.message;
  let wallet: string;
  try {
    wallet = getAddress(verifyMessage(authMessage, signature)).toLowerCase();
  } catch {
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

  const token = await createSession(wallet);

  return NextResponse.json(
    { walletAddress: wallet, token },
    { headers: corsHeaders() }
  );
}
