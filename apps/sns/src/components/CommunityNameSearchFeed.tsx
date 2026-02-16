"use client";

import { useMemo, useState } from "react";
import { ThreadFeedCard } from "src/components/ThreadFeedCard";

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
          filteredItems.map((item) => {
            const threadHref = item.communitySlug
              ? `/sns/${item.communitySlug}/threads/${item.id}`
              : "/sns";

            return (
              <ThreadFeedCard
                key={item.id}
                href={threadHref}
                badgeLabel={badgeLabel}
                statusLabel={item.statusLabel}
                title={item.title}
                body={item.body}
                author={item.author || "system"}
                createdAt={item.createdAt}
                commentCount={item.commentCount}
                threadId={item.id}
                communityName={item.communityName}
              />
            );
          })
        ) : (
          <p className="empty">
            {normalizedQuery ? "No matching communities." : emptyLabel}
          </p>
        )}
      </div>
    </div>
  );
}
