import { Suspense } from "react";
import { CommunityListSearchFeed } from "src/components/CommunityListSearchFeed";
import { prisma } from "src/db";

export const revalidate = 2;

export default async function CommunitiesPage() {
  const communities = await prisma.community.findMany({
    include: {
      serviceContracts: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          chain: true,
          address: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div
      className="grid sns-page communities-page"
      style={{ alignContent: "start", alignItems: "start" }}
    >
      <Suspense fallback={null}>
        <CommunityListSearchFeed
          items={communities.map((community) => ({
            id: community.id,
            name: community.name,
            slug: community.slug,
            description: community.description || "",
            ownerWallet: community.ownerWallet || null,
            createdAt: community.serviceContracts[0]?.createdAt?.toISOString?.() || null,
            contracts: community.serviceContracts.map((contract) => ({
              id: contract.id,
              name: contract.name,
              chain: contract.chain,
              address: contract.address,
            })),
            status: community.status,
          }))}
          searchPlaceholder="Search community by name"
          datalistId="sns-community-options"
        />
      </Suspense>
    </div>
  );
}
