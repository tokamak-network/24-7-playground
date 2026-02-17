"use client";

import { useEffect, useRef, useState } from "react";
import { CommentFeedCard } from "src/components/CommentFeedCard";
import { ThreadFeedCard } from "src/components/ThreadFeedCard";
import type { RecentActivityItem } from "src/lib/recentActivity";

type VisualItem = RecentActivityItem & {
  phase: "enter" | "stable" | "exit";
};

type Props = {
  initialItems: RecentActivityItem[];
  limit?: number;
};

const DEFAULT_LIMIT = 5;
const POLL_MS = 5000;
const ANIMATION_MS = 420;

function signature(items: RecentActivityItem[]) {
  return items.map((item) => `${item.key}:${item.createdAt}`).join("|");
}

function toStable(items: RecentActivityItem[]): VisualItem[] {
  return items.map((item) => ({ ...item, phase: "stable" }));
}

function trimItems(items: RecentActivityItem[], limit: number) {
  return items.slice(0, Math.max(1, Math.floor(limit)));
}

export function RecentActivityFeed({ initialItems, limit = DEFAULT_LIMIT }: Props) {
  const initial = trimItems(initialItems, limit);
  const [items, setItems] = useState<VisualItem[]>(toStable(initial));
  const activeItemsRef = useRef<RecentActivityItem[]>(initial);
  const signatureRef = useRef(signature(initial));
  const settleTimerRef = useRef<number | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const next = trimItems(initialItems, limit);
    activeItemsRef.current = next;
    signatureRef.current = signature(next);
    setItems(toStable(next));
  }, [initialItems, limit]);

  useEffect(() => {
    const applySnapshot = (nextRaw: RecentActivityItem[]) => {
      const next = trimItems(nextRaw, limit);
      const nextSig = signature(next);
      if (nextSig === signatureRef.current) {
        return;
      }

      const prev = activeItemsRef.current;
      const prevKeySet = new Set(prev.map((item) => item.key));
      const nextKeySet = new Set(next.map((item) => item.key));
      const addedKeySet = new Set(
        next.filter((item) => !prevKeySet.has(item.key)).map((item) => item.key)
      );
      const removed = prev.filter((item) => !nextKeySet.has(item.key));

      const enteringOrStable: VisualItem[] = next.map((item) => ({
        ...item,
        phase: addedKeySet.has(item.key) ? "enter" : "stable",
      }));
      const exiting: VisualItem[] = removed.map((item) => ({
        ...item,
        phase: "exit",
      }));

      activeItemsRef.current = next;
      signatureRef.current = nextSig;
      setItems([...enteringOrStable, ...exiting]);

      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current);
      }
      settleTimerRef.current = window.setTimeout(() => {
        setItems(toStable(activeItemsRef.current));
      }, ANIMATION_MS);
    };

    const tick = async () => {
      try {
        const res = await fetch(`/api/activity/recent?limit=${limit}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const nextItems = Array.isArray(data?.items) ? data.items : [];
        applySnapshot(nextItems);
      } catch {
        // ignore polling errors
      }
    };

    tick();
    pollTimerRef.current = window.setInterval(tick, POLL_MS);
    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
      }
      if (settleTimerRef.current) {
        window.clearTimeout(settleTimerRef.current);
      }
    };
  }, [limit]);

  return (
    <div className="recent-activity-list">
      {items.length ? (
        items.map((item) => {
          const isComment = item.kind === "comment";
          if (isComment) {
            return (
              <CommentFeedCard
                key={`${item.key}:${item.phase}`}
                className={`recent-activity-item recent-activity-item-${item.phase}`}
                commentId={item.commentId}
                body={item.body}
                author={item.author}
                createdAt={item.createdAt}
                communityName={item.communityName}
                communitySlug={item.communitySlug}
                contextTitle={item.title}
                contextHref={item.href}
                maxChars={280}
              />
            );
          }
          return (
            <ThreadFeedCard
              key={`${item.key}:${item.phase}`}
              href={item.href}
              badgeLabel={item.badgeLabel || "discussion"}
              statusLabel={item.statusLabel}
              title={item.title}
              body={item.body}
              author={item.author}
              createdAt={item.createdAt}
              commentCount={item.commentCount || 0}
              threadId={item.threadId || item.key}
              communityName={item.communityName}
              className={`recent-activity-item recent-activity-item-${item.phase}`}
            />
          );
        })
      ) : (
        <p className="empty">No recent threads or comments yet.</p>
      )}
    </div>
  );
}
