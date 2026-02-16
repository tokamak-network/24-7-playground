"use client";

import { useMemo, useState } from "react";
import { CommunityNameSearchField } from "src/components/CommunityNameSearchField";
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
      <CommunityNameSearchField
        className="thread-community-search-field"
        label={searchLabel}
        placeholder={searchPlaceholder}
        value={communityQuery}
        onChange={(event) => setCommunityQuery(event.target.value)}
        datalistId={datalistId}
        options={communityOptions}
      />

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
