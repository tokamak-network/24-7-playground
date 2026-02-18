"use client";

import { useEffect, useRef, useState } from "react";
import { ThreadFeedCard } from "src/components/ThreadFeedCard";

type ThreadItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  isResolved?: boolean;
  isRejected?: boolean;
  isIssued?: boolean;
  createdAt: string;
  author: string;
  commentCount: number;
};

type Props = {
  slug: string;
  communityName: string;
  initialThreads: ThreadItem[];
};

const THREAD_TYPE_OPTIONS = [
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

export function CommunityThreadFeed({ slug, communityName, initialThreads }: Props) {
  const [threads, setThreads] = useState<ThreadItem[]>(initialThreads);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const timerRef = useRef<number | null>(null);
  const typeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!searchQuery && typeFilters.length === 0) {
      setThreads(initialThreads);
    }
  }, [initialThreads, searchQuery, typeFilters]);

  useEffect(() => {
    const debounceTimer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(debounceTimer);
  }, [searchInput]);

  useEffect(() => {
    if (!isTypeMenuOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!typeMenuRef.current) return;
      if (!typeMenuRef.current.contains(event.target as Node)) {
        setIsTypeMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [isTypeMenuOpen]);

  useEffect(() => {
    const tick = async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery) {
          params.set("q", searchQuery);
        }
        for (const typeFilter of typeFilters) {
          params.append("type", typeFilter);
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
  }, [slug, searchQuery, typeFilters]);

  const hasFilter = Boolean(searchQuery) || typeFilters.length > 0;

  const toggleTypeFilter = (value: string) => {
    setTypeFilters((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  return (
    <div className="thread-feed">
      <div className="thread-feed-controls">
        <label className="field thread-feed-search">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search threads by author, title, body, thread ID, comment ID"
          />
        </label>
        <div className="field thread-feed-filter">
          <span>Type</span>
          <div className="thread-type-dropdown" ref={typeMenuRef}>
            <button
              type="button"
              className="thread-type-dropdown-trigger"
              onClick={() => setIsTypeMenuOpen((prev) => !prev)}
            >
              <span className="thread-type-dropdown-value">
                {typeFilters.length > 0 ? `${typeFilters.length} selected` : "All"}
              </span>
              <span
                className={`thread-type-dropdown-caret${isTypeMenuOpen ? " is-open" : ""}`}
                aria-hidden
              >
                ▼
              </span>
            </button>
            {isTypeMenuOpen ? (
              <div className="thread-type-dropdown-menu">
                {THREAD_TYPE_OPTIONS.map((option) => {
                  const isSelected = typeFilters.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`thread-type-dropdown-item${isSelected ? " is-selected" : ""}`}
                      aria-pressed={isSelected}
                      onClick={() => toggleTypeFilter(option.value)}
                    >
                      <span className="thread-type-option-label">{option.label}</span>
                      {isSelected ? (
                        <span className="thread-type-option-state">selected</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="feed">
        {threads.length ? (
          threads.map((thread) => (
            <ThreadFeedCard
              key={thread.id}
              href={`/sns/${slug}/threads/${thread.id}`}
              badgeLabel={formatType(thread.type)}
              statusLabel={
                thread.type === "REQUEST_TO_HUMAN"
                  ? thread.isResolved
                    ? "resolved"
                    : thread.isRejected
                      ? "rejected"
                      : "pending"
                  : undefined
              }
              title={thread.title}
              body={thread.body}
              author={thread.author || "system"}
              createdAt={thread.createdAt}
              isIssued={thread.isIssued}
              commentCount={thread.commentCount}
              threadId={thread.id}
              communityName={communityName}
            />
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
