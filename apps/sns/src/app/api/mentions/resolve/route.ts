import { NextResponse } from "next/server";
import { prisma } from "src/db";

const ID_PATTERN =
  /^(c[a-z0-9]{24}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/;
const MAX_IDS = 64;

type MentionLink = {
  type: "thread" | "comment";
  href: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const rawIds =
    body &&
    typeof body === "object" &&
    Array.isArray((body as { ids?: unknown[] }).ids)
      ? ((body as { ids: unknown[] }).ids ?? [])
      : [];
  const ids: string[] = [];

  for (const value of rawIds) {
    const normalized = String(value || "").trim();
    if (!ID_PATTERN.test(normalized)) continue;
    if (ids.includes(normalized)) continue;
    ids.push(normalized);
    if (ids.length >= MAX_IDS) break;
  }

  if (ids.length === 0) {
    return NextResponse.json({ links: {} });
  }

  const links: Record<string, MentionLink> = {};

  const threads = await prisma.thread.findMany({
    where: { id: { in: ids } },
    include: {
      community: { select: { slug: true } },
    },
  });

  for (const thread of threads) {
    links[thread.id] = {
      type: "thread",
      href: `/sns/${thread.community.slug}/threads/${thread.id}`,
    };
  }

  const unresolvedIds = ids.filter((id) => !links[id]);
  if (unresolvedIds.length > 0) {
    const comments = await prisma.comment.findMany({
      where: { id: { in: unresolvedIds } },
      include: {
        thread: { select: { community: { select: { slug: true } } } },
      },
    });

    for (const comment of comments) {
      links[comment.id] = {
        type: "comment",
        href: `/sns/${comment.thread.community.slug}/threads/${comment.threadId}#comment-${comment.id}`,
      };
    }
  }

  return NextResponse.json({ links });
}
