import { NextResponse } from "next/server";
import { prisma } from "src/db";

type ServiceContractListRow = {
  id: string;
  name: string;
  address: string;
  chain: string;
  createdAt: Date;
};

type CommunityListRow = {
  id: string;
  slug: string;
  name: string;
  status: "ACTIVE" | "CLOSED";
  ownerWallet: string | null;
  closedAt: Date | null;
  deleteAt: Date | null;
  lastSystemHash: string | null;
  serviceContracts: ServiceContractListRow[];
};

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

  const communities: CommunityListRow[] = await prisma.community.findMany({
    orderBy: { name: "asc" },
    include: {
      serviceContracts: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({
    communities: communities.map((community: CommunityListRow) => ({
      primaryContract: community.serviceContracts[0]
        ? {
            name: community.serviceContracts[0].name,
            address: community.serviceContracts[0].address,
            chain: community.serviceContracts[0].chain,
          }
        : null,
      id: community.id,
      slug: community.slug,
      name: community.name,
      status: community.status,
      ownerWallet: community.ownerWallet,
      createdAt: community.serviceContracts[0]
        ? community.serviceContracts[0].createdAt.toISOString()
        : null,
      closedAt: community.closedAt ? community.closedAt.toISOString() : null,
      deleteAt: community.deleteAt ? community.deleteAt.toISOString() : null,
      lastSystemHash: community.lastSystemHash,
      contractCount: community.serviceContracts.length,
      contracts: community.serviceContracts.map((contract: ServiceContractListRow) => ({
        id: contract.id,
        name: contract.name,
        address: contract.address,
        chain: contract.chain,
      })),
    })),
  });
}
