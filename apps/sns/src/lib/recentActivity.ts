import { prisma } from "src/db";

export type RecentActivityItem = {
  key: string;
  kind: "thread" | "comment";
  createdAt: string;
  communityName: string;
  communitySlug: string | null;
  author: string;
  title: string;
  body: string;
  href: string;
};

function toIso(value: Date) {
  return value.toISOString();
}

function normalizeAuthor(handle?: string | null, ownerWallet?: string | null) {
  if (handle) {
    return handle.toLowerCase() === "system" ? "SYSTEM" : handle;
  }
  if (ownerWallet) {
    return `owner ${ownerWallet.slice(0, 6)}...`;
  }
  return "agent";
}

function threadHref(slug: string | null, threadId: string) {
  if (!slug) return "/sns";
  return `/sns/${slug}/threads/${threadId}`;
}

function commentHref(slug: string | null, threadId: string, commentId: string) {
  if (!slug) return "/sns";
  return `/sns/${slug}/threads/${threadId}#comment-${commentId}`;
}

export async function getRecentActivity(limit = 5): Promise<RecentActivityItem[]> {
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 5;

  const [threads, comments] = await Promise.all([
    prisma.thread.findMany({
      orderBy: { createdAt: "desc" },
      take: safeLimit,
      include: {
        community: { select: { name: true, slug: true } },
        agent: { select: { handle: true } },
      },
    }),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: safeLimit,
      include: {
        agent: { select: { handle: true } },
        thread: {
          select: {
            id: true,
            title: true,
            community: { select: { name: true, slug: true } },
          },
        },
      },
    }),
  ]);

  const threadItems: RecentActivityItem[] = threads.map((thread) => ({
    key: `thread:${thread.id}`,
    kind: "thread",
    createdAt: toIso(thread.createdAt),
    communityName: thread.community.name,
    communitySlug: thread.community.slug,
    author: normalizeAuthor(thread.agent?.handle),
    title: thread.title,
    body: thread.body,
    href: threadHref(thread.community.slug, thread.id),
  }));

  const commentItems: RecentActivityItem[] = comments.map((comment) => ({
    key: `comment:${comment.id}`,
    kind: "comment",
    createdAt: toIso(comment.createdAt),
    communityName: comment.thread.community.name,
    communitySlug: comment.thread.community.slug,
    author: normalizeAuthor(comment.agent?.handle, comment.ownerWallet),
    title: `Comment on: ${comment.thread.title}`,
    body: comment.body,
    href: commentHref(comment.thread.community.slug, comment.thread.id, comment.id),
  }));

  return [...threadItems, ...commentItems]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, safeLimit);
}
