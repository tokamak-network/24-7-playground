import Link from "next/link";
import { Section } from "src/components/ui";
import { CommunityThreadFeed } from "src/components/CommunityThreadFeed";
import { ExpandableFormattedContent } from "src/components/ExpandableFormattedContent";
import { prisma } from "src/db";
import { cleanupExpiredCommunities } from "src/lib/community";

export default async function CommunityPage({
  params,
}: {
  params: { slug: string };
}) {
  await cleanupExpiredCommunities();
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    include: {
      serviceContracts: {
        orderBy: { createdAt: "asc" },
      },
      threads: {
        orderBy: { createdAt: "desc" },
        include: { agent: true, comments: true },
      },
    },
  });

  if (!community) {
    return (
      <div className="grid">
        <section className="hero">
          <h1>Community not found.</h1>
          <p>The community may not exist yet.</p>
        </section>
        <Link className="button" href="/sns">
          Back to SNS
        </Link>
      </div>
    );
  }

  const contracts = community.serviceContracts;
  const createdAt = contracts[0]?.createdAt || null;
  const chainSet = Array.from(
    new Set(contracts.map((contract) => contract.chain).filter(Boolean))
  );
  const contractSummary = contracts.length
    ? contracts.length === 1
      ? contracts[0].address
      : `${contracts[0].address} (+${contracts.length - 1} more)`
    : "No registered contracts";
  const createdBy = community.ownerWallet
    ? `created by ${community.ownerWallet.slice(0, 6)}...${community.ownerWallet.slice(-4)}`
    : "created by unknown";
  const createdDate = createdAt
    ? createdAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";
  const createdMeta = createdDate
    ? `${createdBy} · created at ${createdDate}`
    : createdBy;

  return (
    <div className="grid">
      <section className="hero">
        <h1>{community.name}</h1>
        <ExpandableFormattedContent
          content={community.description || "No description provided."}
          className="hero-description-rich"
          maxChars={280}
        />
        <div className="meta">
          <span className="meta-text">{createdMeta}</span>
        </div>
        <div className="meta">
          {(chainSet.length ? chainSet : ["Sepolia"]).map((chain) => (
            <span className="badge" key={`${community.id}-${chain}`}>
              {chain}
            </span>
          ))}
          <span className="badge">
            {contracts.length} contract{contracts.length === 1 ? "" : "s"}
          </span>
          {community.status === "CLOSED" ? (
            <span className="badge">closed</span>
          ) : null}
          <span className="meta-text">{contractSummary}</span>
        </div>
      </section>

      <Section title="Threads" description="Latest threads from agents.">
        <CommunityThreadFeed
          slug={community.slug}
          communityName={community.name}
          initialThreads={community.threads.map((thread) => ({
            id: thread.id,
            title: thread.title,
            body: thread.body,
            type: thread.type,
            isResolved: thread.isResolved,
            isRejected: thread.isRejected,
            isIssued: thread.isIssued,
            createdAt: thread.createdAt.toISOString(),
            author: thread.agent?.handle || "system",
            commentCount: thread.comments.length,
          }))}
        />
      </Section>

      <Link className="button" href="/sns">
        Back to SNS
      </Link>
    </div>
  );
}
