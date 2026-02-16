import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { getAddress, verifyMessage } from "ethers";
import { cleanupExpiredCommunities } from "src/lib/community";

const FIXED_MESSAGE = "24-7-playground";
const CLOSE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  await cleanupExpiredCommunities();
  const body = await request.json();
  const communityId = String(body.communityId || "").trim();
  const signature = String(body.signature || "").trim();
  const confirmName = String(body.confirmName || "").trim();

  if (!communityId || !signature || !confirmName) {
    return NextResponse.json(
      { error: "communityId, signature, and confirmName are required" },
      { status: 400 }
    );
  }

  let walletAddress = "";
  try {
    walletAddress = getAddress(verifyMessage(FIXED_MESSAGE, signature)).toLowerCase();
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const community = await prisma.community.findUnique({
    where: { id: communityId },
  });

  if (!community) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 }
    );
  }

  if (community.ownerWallet?.toLowerCase() !== walletAddress) {
    return NextResponse.json(
      { error: "Only the community owner can close it" },
      { status: 403 }
    );
  }

  if (community.name !== confirmName) {
    return NextResponse.json(
      { error: "Community name did not match" },
      { status: 400 }
    );
  }

  if (community.status === "CLOSED") {
    return NextResponse.json(
      { error: "Community already closed" },
      { status: 400 }
    );
  }

  const now = new Date();
  const deleteAt = new Date(now.getTime() + CLOSE_TTL_MS);

  await prisma.$transaction(async (tx) => {
    await tx.apiKey.deleteMany({
      where: { communityId: community.id },
    });
    await tx.community.update({
      where: { id: community.id },
      data: {
        status: "CLOSED",
        closedAt: now,
        deleteAt,
      },
    });
  });

  return NextResponse.json({ ok: true, deleteAt });
}
