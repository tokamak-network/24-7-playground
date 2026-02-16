"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExpandableFormattedContent } from "src/components/ExpandableFormattedContent";

type ThreadItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  commentCount: number;
  communitySlug: string | null;
  communityName: string;
  author: string;
  statusLabel?: string;
};

type Props = {
  items: ThreadItem[];
  badgeLabel: string;
  emptyLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  datalistId: string;
  communityPlacement?: "between" | "meta";
};

export function CommunityNameSearchFeed({
  items,
  badgeLabel,
  emptyLabel,
  searchLabel,
  searchPlaceholder,
  datalistId,
  communityPlacement = "between",
}: Props) {
  const [communityQuery, setCommunityQuery] = useState("");
  const normalizedQuery = communityQuery.trim().toLowerCase();

  const communityOptions = useMemo(() => {
    return Array.from(
      new Set(
        items
          .map((item) => item.communityName)
          .filter((name) => name && name !== "Unknown community")
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) return items;
    return items.filter((item) =>
      item.communityName.toLowerCase().includes(normalizedQuery)
    );
  }, [items, normalizedQuery]);

  return (
    <div className="thread-feed">
      <label className="field thread-community-search-field">
        <span>{searchLabel}</span>
        <input
          value={communityQuery}
          onChange={(event) => setCommunityQuery(event.target.value)}
          placeholder={searchPlaceholder}
          list={datalistId}
        />
        <datalist id={datalistId}>
          {communityOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </label>

      <div className="feed">
        {filteredItems.length ? (
          filteredItems.map((item) => {
            const threadHref = item.communitySlug
              ? `/sns/${item.communitySlug}/threads/${item.id}`
              : "/sns";

            return (
            <article className="feed-item" key={item.id}>
              <div className="thread-title-block">
                <div className="badge">{badgeLabel}</div>
                {item.statusLabel ? (
                  <span className="thread-community-status">{item.statusLabel}</span>
                ) : null}
                <h4 className="thread-card-title">
                  <Link href={threadHref} className="feed-title-link">
                    {item.title}
                  </Link>
                </h4>
              </div>
              {communityPlacement === "between" ? (
                <div className="thread-community-highlight">
                  <span className="thread-community-kicker">community</span>
                  <span className="thread-community-name">{item.communityName}</span>
                </div>
              ) : null}
              <div className="thread-body-block">
                <ExpandableFormattedContent
                  content={item.body}
                  className="is-compact"
                  maxChars={280}
                />
              </div>
              <div className="meta thread-meta">
                <div className="meta thread-meta-main">
                  {communityPlacement === "meta" ? (
                    <span className="meta-text thread-community-inline">
                      <span className="thread-community-kicker">community</span>
                      <strong>{item.communityName}</strong>
                    </span>
                  ) : null}
                  <span className="meta-text">by {item.author || "system"}</span>
                  <span className="meta-text">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                  <span className="meta-text">{item.commentCount} comments</span>
                </div>
                <span className="meta-text thread-id-meta">
                  thread id: <code>{item.id}</code>
                </span>
              </div>
            </article>
          )})
        ) : (
          <p className="empty">
            {normalizedQuery ? "No matching communities." : emptyLabel}
          </p>
        )}
      </div>
    </div>
  );
}
