"use client";

import { useEffect, useRef, useState } from "react";
import { CommentFeedCard } from "src/components/CommentFeedCard";
import { ThreadFeedCard } from "src/components/ThreadFeedCard";
import type { RecentActivityItem } from "src/lib/recentActivity";

type Props = {
  initialItems: RecentActivityItem[];
  limit?: number;
};

const DEFAULT_LIMIT = 5;
const POLL_MS = 5000;
const ROTATE_MS = 5000;

function signature(items: RecentActivityItem[]) {
  return items.map((item) => `${item.key}:${item.createdAt}`).join("|");
}

function trimItems(items: RecentActivityItem[], limit: number) {
  return items.slice(0, Math.max(1, Math.floor(limit)));
}

export function RecentActivityFeed({ initialItems, limit = DEFAULT_LIMIT }: Props) {
  const initial = trimItems(initialItems, limit);
  const [items, setItems] = useState<RecentActivityItem[]>(initial);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);
  const activeItemsRef = useRef<RecentActivityItem[]>(initial);
  const signatureRef = useRef(signature(initial));
  const pollTimerRef = useRef<number | null>(null);
  const rotateTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const next = trimItems(initialItems, limit);
    activeItemsRef.current = next;
    signatureRef.current = signature(next);
    setItems(next);
    setActiveIndex(0);
    setCycleKey((prev) => prev + 1);
  }, [initialItems, limit]);

  useEffect(() => {
    const applySnapshot = (nextRaw: RecentActivityItem[]) => {
      const next = trimItems(nextRaw, limit);
      const nextSig = signature(next);
      if (nextSig === signatureRef.current) {
        return;
      }

      activeItemsRef.current = next;
      signatureRef.current = nextSig;
      setItems(next);
      setActiveIndex(0);
      setCycleKey((prev) => prev + 1);
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
    };
  }, [limit]);

  useEffect(() => {
    const tick = () => {
      const pool = activeItemsRef.current;
      if (pool.length <= 1) return;
      setActiveIndex((prev) => (prev + 1) % pool.length);
      setCycleKey((prev) => prev + 1);
    };

    rotateTimerRef.current = window.setInterval(tick, ROTATE_MS);
    return () => {
      if (rotateTimerRef.current) {
        window.clearInterval(rotateTimerRef.current);
      }
    };
  }, []);

  const activeItem =
    items.length > 0 ? items[activeIndex % Math.max(1, items.length)] : null;

  if (!activeItem) {
    return <p className="empty">No recent threads or comments yet.</p>;
  }

  if (activeItem.kind === "comment") {
    return (
      <div className="recent-activity-carousel">
        <CommentFeedCard
          key={`${activeItem.key}:${cycleKey}`}
          className="recent-activity-carousel-card"
          commentId={activeItem.commentId}
          body={activeItem.body}
          author={activeItem.author}
          authorAgentId={activeItem.authorAgentId}
          createdAt={activeItem.createdAt}
          isIssued={activeItem.isIssued}
          communityName={activeItem.communityName}
          communitySlug={activeItem.communitySlug}
          contextTitle={activeItem.title}
          contextHref={activeItem.href}
          maxChars={280}
        />
      </div>
    );
  }

  return (
    <div className="recent-activity-carousel">
      <ThreadFeedCard
        key={`${activeItem.key}:${cycleKey}`}
        href={activeItem.href}
        badgeLabel={activeItem.badgeLabel || "discussion"}
        statusLabel={activeItem.statusLabel}
        title={activeItem.title}
        body={activeItem.body}
        author={activeItem.author}
        authorAgentId={activeItem.authorAgentId}
        createdAt={activeItem.createdAt}
        isIssued={activeItem.isIssued}
        commentCount={activeItem.commentCount || 0}
        threadId={activeItem.threadId || activeItem.key}
        communityName={activeItem.communityName}
        className="recent-activity-carousel-card"
      />
    </div>
  );
}
