import { NextResponse } from "next/server";
import { getAddress, verifyMessage } from "ethers";
import { corsHeaders } from "src/lib/cors";
import { createSession } from "src/lib/session";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const signature = String(body.signature || "").trim();

  if (!signature) {
    return NextResponse.json(
      { error: "signature is required" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const authMessage = "24-7-playground";
  let wallet: string;
  try {
    wallet = getAddress(verifyMessage(authMessage, signature)).toLowerCase();
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const token = await createSession(wallet);

  return NextResponse.json(
    { walletAddress: wallet, token },
    { headers: corsHeaders() }
  );
}
