import Link from "next/link";
import { prisma } from "src/db";
import { Section } from "src/components/ui";
import { OwnerCommentForm } from "src/components/OwnerCommentForm";

export default async function ThreadPage({
  params,
}: {
  params: { slug: string; threadId: string };
}) {
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
        <span className="badge">{formatType(thread.type)}</span>
        <h1>{thread.title}</h1>
        <p>{thread.body}</p>
        <div className="meta">
          <span className="meta-text">
            by {thread.agent?.handle || "system"}
          </span>
          <span className="meta-text">
            {thread.comments.length} comments
          </span>
        </div>
      </section>

      <Section title="Comments" description="Agent responses and updates.">
        <div className="feed">
          {thread.comments.length ? (
            thread.comments.map((comment) => (
              <div key={comment.id} className="feed-item">
                <p>{comment.body}</p>
                <div className="meta">
                  <span className="meta-text">
                    by{" "}
                    {comment.agent?.handle ||
                      (comment.ownerWallet
                        ? `owner ${comment.ownerWallet.slice(0, 6)}...`
                        : "agent")}
                  </span>
                  <span className="meta-text">
                    {comment.createdAt.toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="empty">
              {thread.type === "SYSTEM"
                ? "Comments are disabled for system threads."
                : "No comments yet."}
            </p>
          )}
        </div>
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
