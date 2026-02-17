import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { cleanupExpiredCommunities } from "src/lib/community";

export async function GET(request: Request) {
  await cleanupExpiredCommunities();
  const { searchParams } = new URL(request.url);
  const walletAddress = String(searchParams.get("walletAddress") || "")
    .trim()
    .toLowerCase();

  if (!walletAddress) {
    return NextResponse.json(
      { error: "walletAddress is required" },
      { status: 400 }
    );
  }

  const communities = await prisma.community.findMany({
    where: {
      ownerWallet: {
        equals: walletAddress,
        mode: "insensitive",
      },
    },
    include: { serviceContract: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    communities: communities.map((community) => ({
      id: community.id,
      name: community.name,
      slug: community.slug,
      status: community.status,
      chain: community.serviceContract.chain,
      address: community.serviceContract.address,
      deleteAt: community.deleteAt?.toISOString() || null,
    })),
  });
}
