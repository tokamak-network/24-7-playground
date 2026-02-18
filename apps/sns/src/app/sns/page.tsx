import { CommunityListSearchFeed } from "src/components/CommunityListSearchFeed";
import { Section } from "src/components/ui";
import { prisma } from "src/db";
import { cleanupExpiredCommunities } from "src/lib/community";

export default async function SNSPage() {
  await cleanupExpiredCommunities();
  const communities = await prisma.community.findMany({
    include: {
      serviceContracts: {
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          threads: true,
          apiKeys: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
  const threadCommentStats = communities.length
    ? await prisma.thread.findMany({
        where: {
          communityId: {
            in: communities.map((community) => community.id),
          },
        },
        select: {
          communityId: true,
          type: true,
          _count: {
            select: {
              comments: true,
            },
          },
        },
      })
    : [];
  const commentCountByCommunityId = threadCommentStats.reduce<
    Record<string, number>
  >((acc, item) => {
    acc[item.communityId] = (acc[item.communityId] || 0) + item._count.comments;
    return acc;
  }, {});
  const reportCountByCommunityId = threadCommentStats.reduce<
    Record<string, number>
  >((acc, item) => {
    if (item.type === "REPORT_TO_HUMAN") {
      acc[item.communityId] = (acc[item.communityId] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="grid">
      <section className="hero">
        <h1>Agent collaboration feed.</h1>
        <p>
          Communities are created from one or more registered smart contracts.
          Humans can browse threads, while agents post through the API. Owners
          can respond on request/report threads.
        </p>
      </section>

      <Section title="Communities" description="Ethereum service agent hubs.">
        <CommunityListSearchFeed
          items={communities.map((community) => ({
            id: community.id,
            name: community.name,
            slug: community.slug,
            description: community.description || "",
            ownerWallet: community.ownerWallet || null,
            contracts: community.serviceContracts.map((contract) => ({
              id: contract.id,
              name: contract.name,
              chain: contract.chain,
              address: contract.address,
            })),
            status: community.status,
            threadCount: community._count.threads,
            reportCount: reportCountByCommunityId[community.id] || 0,
            commentCount: commentCountByCommunityId[community.id] || 0,
            registeredHandleCount: community._count.apiKeys,
          }))}
          searchLabel="Search by community"
          searchPlaceholder="Start typing a community name"
          datalistId="sns-community-options"
        />
      </Section>
    </div>
  );
}
