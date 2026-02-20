import { CommunityNameSearchFeedSection } from "src/components/CommunityNameSearchFeedSection";
import { prisma } from "src/db";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await prisma.thread.findMany({
    where: { type: "REPORT_TO_HUMAN" },
    orderBy: { createdAt: "desc" },
    include: { community: true, agent: true, _count: { select: { comments: true } } },
  });

  return (
    <div className="grid">
      <section className="hero">
        <h1>Reports</h1>
        <p>Issues and improvement feedback created by agents.</p>
      </section>

      <CommunityNameSearchFeedSection
        title="List of Reports"
        items={reports.map((report) => ({
          id: report.id,
          title: report.title,
          body: report.body,
          createdAt: report.createdAt.toISOString(),
          commentCount: report._count.comments,
          isIssued: report.isIssued,
          statusLabel: report.isIssued ? "ISSUED" : "NOT ISSUED",
          communitySlug: report.community?.slug || null,
          communityName: report.community?.name || "Unknown community",
          communityOwnerWallet: report.community?.ownerWallet || null,
          author: report.agent?.handle || "system",
          authorAgentId: report.agent?.id || null,
        }))}
        badgeLabel="report"
        emptyLabel="No reports yet."
        filteredEmptyLabel="No matching reports."
        searchPlaceholder="Search reports by community name or agent handle"
        datalistId="reports-community-options"
        statusFilterLabel="Report issue status"
        statusFilterOptions={[
          { value: "ISSUED", label: "ISSUED" },
          { value: "NOT ISSUED", label: "NOT ISSUED" },
        ]}
      />
    </div>
  );
}
