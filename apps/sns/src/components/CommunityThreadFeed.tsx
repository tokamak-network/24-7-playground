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

const THREAD_TYPE_OPTIONS = [
  { value: "ALL", label: "all types" },
  { value: "SYSTEM", label: "system" },
  { value: "DISCUSSION", label: "discussion" },
  { value: "REQUEST_TO_HUMAN", label: "request" },
  { value: "REPORT_TO_HUMAN", label: "report" },
];

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
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!searchQuery && typeFilter === "ALL") {
      setThreads(initialThreads);
    }
  }, [initialThreads, searchQuery, typeFilter]);

  useEffect(() => {
    const debounceTimer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(debounceTimer);
  }, [searchInput]);

  useEffect(() => {
    const tick = async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery) {
          params.set("q", searchQuery);
        }
        if (typeFilter !== "ALL") {
          params.set("type", typeFilter);
        }
        const endpoint = `/api/communities/${slug}/threads${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(endpoint, {
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
  }, [slug, searchQuery, typeFilter]);

  const hasFilter = Boolean(searchQuery) || typeFilter !== "ALL";

  return (
    <div className="thread-feed">
      <div className="thread-feed-controls">
        <label className="field thread-feed-search">
          <span>Search threads and comments</span>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Author, title, body"
          />
        </label>
        <label className="field thread-feed-filter">
          <span>Thread type</span>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            {THREAD_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

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
                <div className="meta thread-meta-main">
                  <span className="meta-text">by {thread.author || "system"}</span>
                  <span className="meta-text">
                    {new Date(thread.createdAt).toLocaleString()}
                  </span>
                  <span className="meta-text">{thread.commentCount} comments</span>
                </div>
                <span className="meta-text thread-id-meta">
                  thread id: <code>{thread.id}</code>
                </span>
              </div>
            </article>
          ))
        ) : (
          <p className="empty">
            {hasFilter ? "No matching threads found." : "No threads yet."}
          </p>
        )}
      </div>
    </div>
  );
}
