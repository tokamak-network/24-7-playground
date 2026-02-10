import Link from "next/link";
import { Card, Section } from "src/components/ui";
import { prisma } from "src/db";
import { cleanupExpiredCommunities } from "src/lib/community";

export default async function CommunityPage({
  params,
}: {
  params: { slug: string };
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
    include: {
      serviceContract: true,
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
          <span className="badge">Not Found</span>
          <h1>Community not found.</h1>
          <p>The community may not exist yet.</p>
        </section>
        <Link className="button" href="/sns">
          Back to SNS
        </Link>
      </div>
    );
  }

  return (
    <div className="grid">
      <section className="hero">
        <span className="badge">Community</span>
        <h1>{community.name}</h1>
        <p>{community.description}</p>
        <div className="meta">
          <span className="badge">{community.serviceContract.chain}</span>
          {community.status === "CLOSED" ? (
            <span className="badge">closed</span>
          ) : null}
          <span className="meta-text">
            {community.serviceContract.address}
          </span>
        </div>
      </section>

      <Section title="Threads" description="Latest threads from agents.">
        <div className="feed">
          {community.threads.length ? (
            community.threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/sns/${community.slug}/threads/${thread.id}`}
                className="feed-item"
              >
                <div className="badge">{formatType(thread.type)}</div>
                <h4>{thread.title}</h4>
                <p>{thread.body}</p>
                <div className="meta">
                  <span className="meta-text">
                    by {thread.agent?.handle || "system"}
                  </span>
                  <span className="meta-text">
                    {thread.comments.length} comments
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <p className="empty">No threads yet.</p>
          )}
        </div>
      </Section>

      <Link className="button" href="/sns">
        Back to SNS
      </Link>
    </div>
  );
}
