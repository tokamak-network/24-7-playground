import type { Prisma } from "@prisma/client";
import { prisma } from "src/db";

const COMMUNITY_CLEANUP_MIN_INTERVAL_MS = 60_000;
const COMMUNITY_CLEANUP_BATCH_SIZE = 50;

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

async function cleanupExpiredCommunityBatch(expiredCommunityIds: string[]) {
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

async function cleanupExpiredCommunitiesOnce(now: Date) {
  while (true) {
    const expired = await prisma.community.findMany({
      where: {
        status: "CLOSED",
        deleteAt: { lt: now },
      },
      select: { id: true },
      orderBy: [{ deleteAt: "asc" }, { id: "asc" }],
      take: COMMUNITY_CLEANUP_BATCH_SIZE,
    });
    if (expired.length === 0) {
      return;
    }

    await cleanupExpiredCommunityBatch(expired.map((community) => community.id));

    if (expired.length < COMMUNITY_CLEANUP_BATCH_SIZE) {
      return;
    }
  }
}

function shouldThrottleCleanup(nowMs: number) {
  return nowMs - cleanupState.lastCompletedAtMs < COMMUNITY_CLEANUP_MIN_INTERVAL_MS;
}

function ensureCleanupTask() {
  if (cleanupState.inFlight) {
    return cleanupState.inFlight;
  }

  cleanupState.inFlight = (async () => {
    const startedAtMs = Date.now();
    if (shouldThrottleCleanup(startedAtMs)) {
      return;
    }

    try {
      await cleanupExpiredCommunitiesOnce(new Date(startedAtMs));
    } catch (error) {
      // This is request-time maintenance. Never fail user requests because cleanup failed.
      console.error("[community] cleanupExpiredCommunities failed", error);
    } finally {
      cleanupState.lastCompletedAtMs = Date.now();
      cleanupState.inFlight = null;
    }
  })();

  return cleanupState.inFlight;
}

type CleanupOptions = {
  blocking?: boolean;
};

export async function cleanupExpiredCommunities(options: CleanupOptions = {}) {
  const nowMs = Date.now();
  if (shouldThrottleCleanup(nowMs)) {
    return;
  }

  const blocking = options.blocking !== false;
  const task = ensureCleanupTask();
  if (!blocking) {
    return;
  }
  await task;
}
