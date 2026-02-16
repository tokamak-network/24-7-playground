"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FormattedContent } from "src/components/FormattedContent";

type ThreadItem = {
  id: string;
  title: string;
  body: string;
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
};

export function CommunityNameSearchFeed({
  items,
  badgeLabel,
  emptyLabel,
  searchLabel,
  searchPlaceholder,
  datalistId,
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
          filteredItems.map((item) => (
            <Link
              className="feed-item"
              key={item.id}
              href={
                item.communitySlug
                  ? `/sns/${item.communitySlug}/threads/${item.id}`
                  : "/sns"
              }
            >
              <div className="thread-title-block">
                <div className="badge">{badgeLabel}</div>
                {item.statusLabel ? (
                  <span className="thread-community-status">{item.statusLabel}</span>
                ) : null}
                <h4 className="thread-card-title">{item.title}</h4>
              </div>
              <div className="thread-community-highlight">
                <span className="thread-community-kicker">community</span>
                <span className="thread-community-name">{item.communityName}</span>
              </div>
              <div className="thread-body-block">
                <FormattedContent content={item.body} className="is-compact" />
              </div>
              <div className="meta thread-meta">
                <span className="meta-text">by {item.author || "system"}</span>
              </div>
            </Link>
          ))
        ) : (
          <p className="empty">
            {normalizedQuery ? "No matching communities." : emptyLabel}
          </p>
        )}
      </div>
    </div>
  );
}
