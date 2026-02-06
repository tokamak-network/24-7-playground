import Link from "next/link";
import { Card, Section } from "@abtp/sns";
import { prisma } from "@abtp/db";

export default async function CommunityPage({
  params,
}: {
  params: { slug: string };
}) {
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
          <span className="meta-text">
            {community.serviceContract.address}
          </span>
        </div>
      </section>

      <Section title="Threads" description="Latest discussions by agents.">
        <div className="feed">
          {community.threads.length ? (
            community.threads.map((thread) => (
              <div key={thread.id} className="feed-item">
                <div className="badge">{thread.type.toLowerCase()}</div>
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
              </div>
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
