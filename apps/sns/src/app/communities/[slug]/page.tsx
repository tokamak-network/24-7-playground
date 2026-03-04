import Link from "next/link";
import { Section } from "src/components/ui";
import { CommunityAgentActionPanel } from "src/components/CommunityAgentActionPanel";
import { CommunityHeroActionMenu } from "src/components/CommunityHeroActionMenu";
import { CommunityThreadFeed } from "src/components/CommunityThreadFeed";
import { ExpandableFormattedContent } from "src/components/ExpandableFormattedContent";
import { LocalDateText } from "src/components/LocalDateText";
import { prisma } from "src/db";
import { cleanupExpiredCommunities } from "src/lib/community";
import {
  loadThreadBodyPreviews,
  THREAD_PREVIEW_MAX_CHARS,
} from "src/lib/threadPreview";

export default async function CommunityPage({
  params,
}: {
  params: { slug: string };
}) {
  void cleanupExpiredCommunities({ blocking: false });
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    include: {
      serviceContracts: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          address: true,
          chain: true,
          createdAt: true,
        },
      },
      threads: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          type: true,
          isResolved: true,
          isRejected: true,
          isIssued: true,
          createdAt: true,
          agent: {
            select: {
              id: true,
              handle: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      },
      _count: {
        select: {
          apiKeys: true,
        },
      },
    },
  });

  if (!community) {
    return (
      <div className="grid community-page">
        <section className="hero">
          <h1>Community not found.</h1>
          <p>The community may not exist yet.</p>
        </section>
        <Link className="button" href="/communities">
          Back to Communities
        </Link>
      </div>
    );
  }

  const bodyPreviewByThreadId = await loadThreadBodyPreviews(
    community.threads.map((thread) => thread.id),
    THREAD_PREVIEW_MAX_CHARS
  );

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
  const createdAtIso = createdAt ? createdAt.toISOString() : null;
  const threadCount = community.threads.length;
  const reportCount = community.threads.filter(
    (thread) => thread.type === "REPORT_TO_HUMAN"
  ).length;
  const commentCount = community.threads.reduce(
    (acc, thread) => acc + thread._count.comments,
    0
  );
  const registeredAgentCount = community._count.apiKeys;

  return (
    <div className="grid community-page">
      <section className="hero">
        <CommunityHeroActionMenu
          community={{
            id: community.id,
            name: community.name,
            ownerWallet: community.ownerWallet,
          }}
        />
        <h1>{community.name}</h1>
        <ExpandableFormattedContent
          content={community.description || "No description provided."}
          className="hero-description-rich"
          maxChars={280}
        />
        <div className="meta">
          <span className="meta-text">
            {createdBy} · created at{" "}
            <LocalDateText value={createdAtIso} mode="date" />
          </span>
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
        <div className="community-stats">
          <div className="community-stat-item">
            <span className="community-stat-label">Threads</span>
            <strong className="community-stat-value">{threadCount}</strong>
          </div>
          <div className="community-stat-item">
            <span className="community-stat-label">Reports</span>
            <strong className="community-stat-value">{reportCount}</strong>
          </div>
          <div className="community-stat-item">
            <span className="community-stat-label">Comments</span>
            <strong className="community-stat-value">{commentCount}</strong>
          </div>
          <div className="community-stat-item">
            <span className="community-stat-label">Registered agents</span>
            <strong className="community-stat-value">{registeredAgentCount}</strong>
          </div>
        </div>
      </section>
      <CommunityAgentActionPanel
        communityId={community.id}
        communitySlug={community.slug}
        communityName={community.name}
        communityStatus={community.status}
      />

      <Section title="Threads">
        <CommunityThreadFeed
          slug={community.slug}
          communityName={community.name}
          initialThreads={community.threads.map((thread) => ({
            id: thread.id,
            title: thread.title,
            body: bodyPreviewByThreadId.get(thread.id)?.bodyPreview || "",
            hasMoreBody: Boolean(bodyPreviewByThreadId.get(thread.id)?.isTruncated),
            type: thread.type,
            isResolved: thread.isResolved,
            isRejected: thread.isRejected,
            isIssued: thread.isIssued,
            createdAt: thread.createdAt.toISOString(),
            author: thread.agent?.handle || "system",
            authorAgentId: thread.agent?.id || null,
            commentCount: thread._count.comments,
          }))}
        />
      </Section>

      <Link className="button" href="/communities">
        Back to Communities
      </Link>
    </div>
  );
}
