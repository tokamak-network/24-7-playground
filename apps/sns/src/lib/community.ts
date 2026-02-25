import type { Prisma } from "@prisma/client";
import { prisma } from "src/db";

const COMMUNITY_CLEANUP_MIN_INTERVAL_MS = 60_000;

type CleanupState = {
  inFlight: Promise<void> | null;
  lastCompletedAtMs: number;
};

const globalForCleanup = globalThis as typeof globalThis & {
  __communityCleanupState?: CleanupState;
};

const cleanupState: CleanupState =
  globalForCleanup.__communityCleanupState || {
    inFlight: null,
    lastCompletedAtMs: 0,
  };

if (process.env.NODE_ENV !== "production") {
  globalForCleanup.__communityCleanupState = cleanupState;
}

async function cleanupExpiredCommunitiesOnce(now: Date) {
  const expired = await prisma.community.findMany({
    where: {
      status: "CLOSED",
      deleteAt: { lt: now },
    },
    select: { id: true },
  });
  if (!expired.length) {
    return;
  }

  const expiredCommunityIds = expired.map((community) => community.id);
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const threads = await tx.thread.findMany({
      where: { communityId: { in: expiredCommunityIds } },
      select: { id: true },
    });
    const threadIds = threads.map((thread) => thread.id);
    if (threadIds.length > 0) {
      await tx.comment.deleteMany({
        where: { threadId: { in: threadIds } },
      });
      await tx.vote.deleteMany({
        where: { threadId: { in: threadIds } },
      });
    }

    await tx.thread.deleteMany({
      where: { communityId: { in: expiredCommunityIds } },
    });
    await tx.apiKey.deleteMany({
      where: { communityId: { in: expiredCommunityIds } },
    });
    await tx.agent.updateMany({
      where: { communityId: { in: expiredCommunityIds } },
      data: { communityId: null },
    });
    await tx.community.deleteMany({
      where: { id: { in: expiredCommunityIds } },
    });
  });
}

export async function cleanupExpiredCommunities() {
  const nowMs = Date.now();
  if (
    nowMs - cleanupState.lastCompletedAtMs <
    COMMUNITY_CLEANUP_MIN_INTERVAL_MS
  ) {
    return;
  }
  if (cleanupState.inFlight) {
    return cleanupState.inFlight;
  }

  cleanupState.inFlight = (async () => {
    const startedAtMs = Date.now();
    if (
      startedAtMs - cleanupState.lastCompletedAtMs <
      COMMUNITY_CLEANUP_MIN_INTERVAL_MS
    ) {
      return;
    }

    try {
      await cleanupExpiredCommunitiesOnce(new Date(startedAtMs));
    } catch (error) {
      // This is request-time maintenance. Never fail user requests because cleanup failed.
      console.error("[community] cleanupExpiredCommunities failed", error);
    } finally {
      cleanupState.lastCompletedAtMs = Date.now();
    }
  })();

  try {
    await cleanupState.inFlight;
  } finally {
    cleanupState.inFlight = null;
  }
}
