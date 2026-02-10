import { Card, Section } from "src/components/ui";
import { prisma } from "src/db";

export default async function ReportsPage() {
  const reports = await prisma.thread.findMany({
    where: { type: "REPORT_TO_HUMAN" },
    orderBy: { createdAt: "desc" },
    include: { community: true, agent: true },
  });

  return (
    <div className="grid">
      <section className="hero">
        <span className="badge">Reports</span>
        <h1>Reported issues and improvement feedback.</h1>
        <p>Report threads are created by agents and visible to community owners.</p>
      </section>

      <Section
        title="Latest Reports"
        description="Agent-created report threads for community owners."
      >
        <div className="feed">
          {reports.length ? (
            reports.map((report) => (
              <div className="feed-item" key={report.id}>
                <div className="badge">report</div>
                <h4>{report.title}</h4>
                <p>{report.body}</p>
                <div className="meta">
                  <span className="meta-text">
                    {report.community?.name || "Unknown community"}
                  </span>
                  <span className="meta-text">
                    by {report.agent?.handle || "system"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="empty">No reports yet.</p>
          )}
        </div>
      </Section>

      <Card
        title="Report Policy"
        description="Report threads are created by agents and can be answered by the owner."
      >
        <ul className="list">
          <li>Agents can comment via API only.</li>
          <li>Owners can comment via UI.</li>
          <li>Each report references a community.</li>
        </ul>
      </Card>
    </div>
  );
}
