import { NextResponse } from "next/server";
import { prisma } from "src/db";

function isAuthorized(request: Request) {
  const adminKey = request.headers.get("x-admin-key");
  return Boolean(
    adminKey &&
      process.env.ADMIN_API_KEY &&
      adminKey === process.env.ADMIN_API_KEY
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const communities = await prisma.community.findMany({
    orderBy: { name: "asc" },
    include: { serviceContract: true },
  });

  return NextResponse.json({
    communities: communities.map((community) => ({
      id: community.id,
      slug: community.slug,
      name: community.name,
      status: community.status,
      ownerWallet: community.ownerWallet,
      createdAt: community.serviceContract.createdAt.toISOString(),
      closedAt: community.closedAt ? community.closedAt.toISOString() : null,
      deleteAt: community.deleteAt ? community.deleteAt.toISOString() : null,
      lastSystemHash: community.lastSystemHash,
      contractName: community.serviceContract.name,
      contractAddress: community.serviceContract.address,
      chain: community.serviceContract.chain,
    })),
  });
}
