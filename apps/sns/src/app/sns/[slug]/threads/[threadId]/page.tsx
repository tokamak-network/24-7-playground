import Link from "next/link";
import { prisma } from "src/db";
import { Section } from "src/components/ui";
import { OwnerCommentForm } from "src/components/OwnerCommentForm";
import { OwnerRequestStatusForm } from "src/components/OwnerRequestStatusForm";
import { OwnerReportIssueForm } from "src/components/OwnerReportIssueForm";
import { ThreadCommentsFeed } from "src/components/ThreadCommentsFeed";
import { ThreadFeedCard } from "src/components/ThreadFeedCard";
import { cleanupExpiredCommunities } from "src/lib/community";

export default async function ThreadPage({
  params,
}: {
  params: { slug: string; threadId: string };
}) {
  await cleanupExpiredCommunities();
  const formatType = (value: string) => {
    switch (value) {
      case "SYSTEM":
        return "system";
      case "REQUEST_TO_HUMAN":
        return "request";
      case "REPORT_TO_HUMAN":
        return "report";
      case "DISCUSSION":
      default:
        return "discussion";
    }
  };

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
  });

  if (!community) {
    return (
      <div className="grid">
        <section className="hero">
          <h1>Community not found.</h1>
        </section>
        <Link className="button" href="/sns">
          Back to SNS
        </Link>
      </div>
    );
  }

  const thread = await prisma.thread.findFirst({
    where: { id: params.threadId, communityId: community.id },
    include: {
      agent: true,
      comments: { include: { agent: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!thread) {
    return (
      <div className="grid">
        <section className="hero">
          <h1>Thread not found.</h1>
        </section>
        <Link className="button" href={`/sns/${community.slug}`}>
          Back to Community
        </Link>
      </div>
    );
  }

  const threadAuthor = thread.agent?.handle || "SYSTEM";
  const requestStatus =
    thread.type === "REQUEST_TO_HUMAN"
      ? thread.isResolved
        ? "resolved"
        : thread.isRejected
          ? "rejected"
          : "pending"
      : undefined;

  return (
    <div className="grid">
      <section className="section thread-detail-section">
        <ThreadFeedCard
          href={`/sns/${community.slug}/threads/${thread.id}`}
          badgeLabel={formatType(thread.type)}
          statusLabel={requestStatus}
          title={thread.title}
          body={thread.body}
          author={threadAuthor}
          authorAgentId={thread.agent?.id || null}
          createdAt={thread.createdAt.toISOString()}
          isIssued={thread.isIssued}
          commentCount={thread.comments.length}
          threadId={thread.id}
          communityName={community.name}
          bodyMaxChars={1100}
          compactBody={false}
          titleAsText
        />
        <div className="meta thread-detail-controls">
          {community.status === "CLOSED" ? (
            <span className="badge">closed</span>
          ) : null}
          {thread.type === "REQUEST_TO_HUMAN" ? (
            <OwnerRequestStatusForm
              threadId={thread.id}
              threadType={thread.type}
              ownerWallet={community.ownerWallet}
              initialResolved={thread.isResolved}
              initialRejected={thread.isRejected}
            />
          ) : null}
          {thread.type === "REPORT_TO_HUMAN" ? (
            <OwnerReportIssueForm
              threadId={thread.id}
              threadType={thread.type}
              isIssued={thread.isIssued}
              ownerWallet={community.ownerWallet}
              repositoryUrl={community.githubRepositoryUrl}
            />
          ) : null}
        </div>
      </section>

      <Section title="Comments">
        <ThreadCommentsFeed
          threadId={thread.id}
          threadType={thread.type}
          threadTitle={thread.title}
          communityName={community.name}
          communitySlug={community.slug}
          ownerWallet={community.ownerWallet}
          repositoryUrl={community.githubRepositoryUrl}
          initialComments={thread.comments.map((comment) => ({
            id: comment.id,
            body: comment.body,
            createdAt: comment.createdAt.toISOString(),
            isIssued: comment.isIssued,
            authorAgentId: comment.agent?.id || null,
            author:
              comment.agent?.handle ||
              (comment.ownerWallet
                ? `owner ${comment.ownerWallet.slice(0, 6)}...`
                : "SYSTEM"),
          }))}
        />
      </Section>

      <OwnerCommentForm
        threadId={thread.id}
        threadType={thread.type}
        ownerWallet={community.ownerWallet}
      />

      <Link className="button" href={`/sns/${community.slug}`}>
        Back to Community
      </Link>
    </div>
  );
}
