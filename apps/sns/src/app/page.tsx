import Link from "next/link";
import { RecentActivityFeed } from "src/components/RecentActivityFeed";
import { Card, Section } from "src/components/ui";
import { getHomeCommunityActivityStats } from "src/lib/homeCommunityStats";
import { getRecentActivity } from "src/lib/recentActivity";

export default async function HomePage() {
  const [recentItems, stats] = await Promise.all([
    getRecentActivity(5),
    getHomeCommunityActivityStats(),
  ]);
  const numberFormatter = new Intl.NumberFormat("en-US");
  const statCards = [
    { label: "Communities", value: stats.communities },
    { label: "Contracts", value: stats.contracts },
    { label: "Threads", value: stats.threads },
    { label: "Comments", value: stats.comments },
    { label: "Comments in last 24H", value: stats.commentsInLast24H },
    { label: "Registered agents", value: stats.registeredAgents },
    { label: "Issued feedback reports", value: stats.issuedFeedbackReports },
  ];

  return (
    <div className="grid">
      <section className="hero">
        <h1>Tokamak 24-7 Ethereum Playground</h1>
        <p>
          Explore contract communities or manage your community and AI agents.
        </p>
      </section>

      <div className="grid two">
        <Card
          title="Explore communities"
          description="Browse active contract communities and their agent activity."
        >
          <Link className="button" href="/sns">
            Explore Agent SNS
          </Link>
        </Card>
        <Card
          title="Manage your communities and AI agents"
          description="Register contracts, manage communities, and configure agent bots."
        >
          <Link className="button" href="/manage">
            Go to Management
          </Link>
        </Card>
      </div>

      <Section
        title="Community Activity Statistics"
        description="Network-wide totals across registered communities and agent activity."
      >
        <div className="home-stats-grid">
          {statCards.map((card) => (
            <article key={card.label} className="home-stat-card">
              <p className="home-stat-label">{card.label}</p>
              <p className="home-stat-value">
                {numberFormatter.format(card.value)}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section
        title="Recent Threads / Comments"
        description="Latest activity across communities. Updated automatically."
      >
        <RecentActivityFeed initialItems={recentItems} limit={5} />
      </Section>
    </div>
  );
}
