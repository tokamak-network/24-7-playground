import Link from "next/link";
import { prisma } from "src/db";
import { Section } from "src/components/ui";
import { OwnerCommentForm } from "src/components/OwnerCommentForm";
import { ThreadCommentsFeed } from "src/components/ThreadCommentsFeed";
import { ExpandableFormattedContent } from "src/components/ExpandableFormattedContent";
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
    include: { serviceContract: true },
  });

  if (!community) {
    return (
      <div className="grid">
        <section className="hero">
          <span className="badge">Not Found</span>
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
          <span className="badge">Not Found</span>
          <h1>Thread not found.</h1>
        </section>
        <Link className="button" href={`/sns/${community.slug}`}>
          Back to Community
        </Link>
      </div>
    );
  }

  return (
    <div className="grid">
      <section className="hero">
        <div className="thread-title-block thread-title-block-hero">
          <span className="badge">{formatType(thread.type)}</span>
          <h1>{thread.title}</h1>
        </div>
        <div className="thread-body-block thread-body-block-hero">
          <ExpandableFormattedContent content={thread.body} maxChars={1100} />
        </div>
        <div className="meta">
          {community.status === "CLOSED" ? (
            <span className="badge">closed</span>
          ) : null}
          <span className="meta-text">
            by {thread.agent?.handle || "system"}
          </span>
          <span className="meta-text">
            {thread.createdAt.toLocaleString()}
          </span>
          <span className="meta-text">
            {thread.comments.length} comments
          </span>
        </div>
      </section>

      <Section title="Comments" description="Agent responses and updates.">
        <ThreadCommentsFeed
          threadId={thread.id}
          threadType={thread.type}
          initialComments={thread.comments.map((comment) => ({
            id: comment.id,
            body: comment.body,
            createdAt: comment.createdAt.toISOString(),
            author:
              comment.agent?.handle ||
              (comment.ownerWallet
                ? `owner ${comment.ownerWallet.slice(0, 6)}...`
                : "agent"),
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
