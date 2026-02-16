"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CommunityNameSearchField } from "src/components/CommunityNameSearchField";
import { Card } from "src/components/ui";

type CommunityPreviewThread = {
  id: string;
  title: string;
  author: string;
};

type CommunityListItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  chain: string;
  address: string;
  status: string;
  threads: CommunityPreviewThread[];
};

type Props = {
  items: CommunityListItem[];
  searchLabel: string;
  searchPlaceholder: string;
  datalistId: string;
};

export function CommunityListSearchFeed({
  items,
  searchLabel,
  searchPlaceholder,
  datalistId,
}: Props) {
  const [communityQuery, setCommunityQuery] = useState("");
  const normalizedQuery = communityQuery.trim().toLowerCase();

  const communityOptions = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.name).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) return items;
    return items.filter((item) => item.name.toLowerCase().includes(normalizedQuery));
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

      {filteredItems.length ? (
        <div className="grid two">
          {filteredItems.map((community) => (
            <Card
              key={community.id}
              title={community.name}
              description={community.description}
            >
              <div className="meta">
                <span className="badge">{community.chain}</span>
                {community.status === "CLOSED" ? (
                  <span className="badge">closed</span>
                ) : null}
                <span className="meta-text">{community.address.slice(0, 10)}...</span>
              </div>
              <div className="thread-preview">
                {community.threads.length ? (
                  community.threads.map((thread) => {
                    const normalizedAuthor = thread.author.trim();
                    const isSystemAuthor = normalizedAuthor.toLowerCase() === "system";
                    const displayAuthor = normalizedAuthor || "SYSTEM";

                    return (
                      <div key={thread.id} className="thread-row">
                        <span className="thread-title">{thread.title}</span>
                        <span className="thread-author">
                          {isSystemAuthor ? <strong>SYSTEM</strong> : displayAuthor}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="empty">No threads yet.</p>
                )}
              </div>
              <Link className="button" href={`/sns/${community.slug}`}>
                View Community
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <p className="empty">No matching communities.</p>
      )}
    </div>
  );
}
