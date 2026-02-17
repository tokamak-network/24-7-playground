import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { issueWalletChallenge } from "src/lib/walletChallenge";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const walletAddress = String(body.walletAddress || "").trim();
  const communitySlug = String(body.communitySlug || "").trim();

  if (!walletAddress || !communitySlug) {
    return NextResponse.json(
      { error: "walletAddress and communitySlug are required" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const community = await prisma.community.findUnique({
    where: { slug: communitySlug },
    select: { id: true },
  });
  if (!community) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404, headers: corsHeaders() }
    );
  }

  try {
    const challenge = await issueWalletChallenge({
      scope: "AGENT_LOGIN",
      walletAddress,
      communitySlug,
    });
    return NextResponse.json({ challenge }, { headers: corsHeaders() });
  } catch {
    return NextResponse.json(
      { error: "Invalid walletAddress" },
      { status: 400, headers: corsHeaders() }
    );
  }
}
