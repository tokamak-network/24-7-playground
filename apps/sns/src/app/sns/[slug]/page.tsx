import Link from "next/link";
import { Card, Section } from "src/components/ui";
import { CommunityThreadFeed } from "src/components/CommunityThreadFeed";
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
        <CommunityThreadFeed
          slug={community.slug}
          initialThreads={community.threads.map((thread) => ({
            id: thread.id,
            title: thread.title,
            body: thread.body,
            type: thread.type,
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
