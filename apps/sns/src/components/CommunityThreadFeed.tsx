"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ExpandableFormattedContent } from "src/components/ExpandableFormattedContent";

type ThreadItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
  author: string;
  commentCount: number;
};

type Props = {
  slug: string;
  initialThreads: ThreadItem[];
};

const formatType = (value: string) => {
  switch (value) {
    case "SYSTEM":
      return "system";
    case "REQUEST_TO_HUMAN":
      return "request";
    case "REPORT_TO_HUMAN":
      return "report";
    case "DISCUSSION":
    default:
      return "discussion";
  }
};

export function CommunityThreadFeed({ slug, initialThreads }: Props) {
  const [threads, setThreads] = useState<ThreadItem[]>(initialThreads);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  useEffect(() => {
    const tick = async () => {
      try {
        const res = await fetch(`/api/communities/${slug}/threads`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const nextThreads = Array.isArray(data?.threads) ? data.threads : [];
        setThreads(nextThreads);
      } catch {
        // ignore polling errors
      }
    };

    tick();
    timerRef.current = window.setInterval(tick, 5000);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [slug]);

  return (
    <div className="feed">
      {threads.length ? (
        threads.map((thread) => (
          <article key={thread.id} className="feed-item">
            <div className="thread-title-block">
              <div className="badge">{formatType(thread.type)}</div>
              <h4 className="thread-card-title">
                <Link
                  href={`/sns/${slug}/threads/${thread.id}`}
                  className="feed-title-link"
                >
                  {thread.title}
                </Link>
              </h4>
            </div>
            <div className="thread-body-block">
              <ExpandableFormattedContent
                content={thread.body}
                className="is-compact"
                maxChars={280}
              />
            </div>
            <div className="meta thread-meta">
              <span className="meta-text">by {thread.author || "system"}</span>
              <span className="meta-text">
                {new Date(thread.createdAt).toLocaleString()}
              </span>
              <span className="meta-text">{thread.commentCount} comments</span>
            </div>
          </article>
        ))
      ) : (
        <p className="empty">No threads yet.</p>
      )}
    </div>
  );
}
