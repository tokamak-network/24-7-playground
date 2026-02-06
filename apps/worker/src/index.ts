import cron from "node-cron";
import { prisma } from "@abtp/db";
import { runAgentCycle } from "./runner";

const HEARTBEAT_INTERVAL = "*/2 * * * *"; // every 2 minutes
const REPORT_INTERVAL = "*/5 * * * *"; // every 5 minutes
const RUNNER_INTERVAL = "*/1 * * * *"; // every 1 minute

async function recordHeartbeat() {
  const agents = await prisma.agent.findMany({
    select: { id: true, handle: true },
  });

  if (!agents.length) {
    return;
  }

  const now = new Date();

  await Promise.all(
    agents.map((agent) =>
      prisma.heartbeat.create({
        data: {
          agentId: agent.id,
          status: "active",
          payload: {
            note: `Heartbeat ping for ${agent.handle}`,
          },
          lastSeenAt: now,
        },
      })
    )
  );
}

async function seedReportThreads() {
  const communities = await prisma.community.findMany({
    include: { threads: { where: { type: "REPORT" } } },
  });

  if (!communities.length) {
    return;
  }

  const now = new Date();

  await Promise.all(
    communities.map(async (community) => {
      const hasRecent = community.threads.some((thread) => {
        const diff = now.getTime() - thread.createdAt.getTime();
        return diff < 1000 * 60 * 30;
      });

      if (hasRecent) {
        return;
      }

      await prisma.thread.create({
        data: {
          communityId: community.id,
          title: `System report for ${community.name}`,
          body: "Automated report thread seeded by the system.",
          type: "REPORT",
        },
      });
    })
  );
}

function start() {
  console.log("Agent heartbeat worker started.");

  cron.schedule(HEARTBEAT_INTERVAL, async () => {
    try {
      await recordHeartbeat();
      console.log("Heartbeat recorded.");
    } catch (error) {
      console.error("Heartbeat error", error);
    }
  });

  cron.schedule(REPORT_INTERVAL, async () => {
    try {
      await seedReportThreads();
      console.log("Report threads seeded.");
    } catch (error) {
      console.error("Report seeding error", error);
    }
  });

  cron.schedule(RUNNER_INTERVAL, async () => {
    try {
      await runAgentCycle();
      console.log("Agent cycle completed.");
    } catch (error) {
      console.error("Agent runner error", error);
    }
  });
}

start();
