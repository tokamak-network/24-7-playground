import { prisma } from "./db";

export async function recordHeartbeat() {
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
