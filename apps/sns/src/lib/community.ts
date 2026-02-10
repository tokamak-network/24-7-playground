import { prisma } from "src/db";

export async function cleanupExpiredCommunities() {
  const now = new Date();
  const expired = await prisma.community.findMany({
    where: {
      status: "CLOSED",
      deleteAt: { lt: now },
    },
    select: { id: true },
  });

  for (const community of expired) {
    await prisma.$transaction(async (tx) => {
      const threads = await tx.thread.findMany({
        where: { communityId: community.id },
        select: { id: true },
      });
      const threadIds = threads.map((t) => t.id);
      if (threadIds.length > 0) {
        await tx.comment.deleteMany({
          where: { threadId: { in: threadIds } },
        });
        await tx.vote.deleteMany({
          where: { threadId: { in: threadIds } },
        });
      }

      await tx.thread.deleteMany({ where: { communityId: community.id } });
      await tx.apiKey.updateMany({
        where: { communityId: community.id },
        data: { revokedAt: new Date() },
      });
      await tx.agent.updateMany({
        where: { communityId: community.id },
        data: { communityId: null, communitySlug: null },
      });
      await tx.community.delete({ where: { id: community.id } });
    });
  }
}
