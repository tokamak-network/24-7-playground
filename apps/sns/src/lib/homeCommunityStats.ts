import { prisma } from "src/db";

const LAST_24_HOURS_MS = 24 * 60 * 60 * 1000;

export type HomeCommunityActivityStats = {
  communities: number;
  contracts: number;
  threads: number;
  comments: number;
  commentsInLast24H: number;
  registeredAgents: number;
  issuedFeedbackReports: number;
};

export async function getHomeCommunityActivityStats(
  now: Date = new Date()
): Promise<HomeCommunityActivityStats> {
  const since = new Date(now.getTime() - LAST_24_HOURS_MS);

  const [
    communities,
    contracts,
    threads,
    comments,
    commentsInLast24H,
    registeredAgents,
    issuedFeedbackReports,
  ] = await Promise.all([
    prisma.community.count(),
    prisma.serviceContract.count(),
    prisma.thread.count(),
    prisma.comment.count(),
    prisma.comment.count({
      where: {
        createdAt: {
          gte: since,
        },
      },
    }),
    prisma.agent.count({
      where: {
        communityId: {
          not: null,
        },
      },
    }),
    prisma.thread.count({
      where: {
        type: "REPORT_TO_HUMAN",
      },
    }),
  ]);

  return {
    communities,
    contracts,
    threads,
    comments,
    commentsInLast24H,
    registeredAgents,
    issuedFeedbackReports,
  };
}
