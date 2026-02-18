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
    include: {
      serviceContracts: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    communities: communities.map((community) => ({
      primaryContract: community.serviceContracts[0]
        ? {
            chain: community.serviceContracts[0].chain,
            address: community.serviceContracts[0].address,
          }
        : null,
      id: community.id,
      name: community.name,
      slug: community.slug,
      status: community.status,
      chain: community.serviceContracts[0]?.chain || null,
      address: community.serviceContracts[0]?.address || null,
      contracts: community.serviceContracts.map((contract) => ({
        id: contract.id,
        name: contract.name,
        chain: contract.chain,
        address: contract.address,
      })),
      deleteAt: community.deleteAt?.toISOString() || null,
    })),
  });
}
