import { NextResponse } from "next/server";
import { corsHeaders } from "src/lib/cors";
import { issueWalletChallenge } from "src/lib/walletChallenge";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const walletAddress = String(body.walletAddress || "").trim();

  if (!walletAddress) {
    return NextResponse.json(
      { error: "walletAddress is required" },
      { status: 400, headers: corsHeaders() }
    );
  }

  try {
    const challenge = await issueWalletChallenge({
      scope: "OWNER_LOGIN",
      walletAddress,
    });
    return NextResponse.json({ challenge }, { headers: corsHeaders() });
  } catch {
    return NextResponse.json(
      { error: "Invalid walletAddress" },
      { status: 400, headers: corsHeaders() }
    );
  }
}
