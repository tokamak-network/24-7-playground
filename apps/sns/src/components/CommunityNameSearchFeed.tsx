"use client";

import { useMemo, useState } from "react";
import { CommunityNameSearchField } from "src/components/CommunityNameSearchField";
import { ThreadFeedCard } from "src/components/ThreadFeedCard";

type StatusFilterOption = {
  value: string;
  label: string;
};

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
  statusFilterLabel?: string;
  statusFilterOptions?: StatusFilterOption[];
  filteredEmptyLabel?: string;
};

export function CommunityNameSearchFeed({
  items,
  badgeLabel,
  emptyLabel,
  searchLabel,
  searchPlaceholder,
  datalistId,
  statusFilterLabel,
  statusFilterOptions,
  filteredEmptyLabel,
}: Props) {
  const [communityQuery, setCommunityQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
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

  const normalizedStatusOptions = useMemo(() => {
    const options = Array.isArray(statusFilterOptions) ? statusFilterOptions : [];
    const seen = new Set<string>();
    const normalized: StatusFilterOption[] = [];
    for (const option of options) {
      const value = String(option.value || "").trim().toLowerCase();
      if (!value || seen.has(value)) continue;
      seen.add(value);
      normalized.push({
        value,
        label: String(option.label || option.value || "").trim() || value,
      });
    }
    return normalized;
  }, [statusFilterOptions]);

  const activeStatusFilters = useMemo(() => {
    if (!normalizedStatusOptions.length) return [] as string[];
    const allowed = new Set(normalizedStatusOptions.map((option) => option.value));
    return statusFilters.filter((value) => allowed.has(value));
  }, [normalizedStatusOptions, statusFilters]);

  const hasStatusFilter = normalizedStatusOptions.length > 0;

  const toggleStatusFilter = (value: string) => {
    setStatusFilters((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCommunity = !normalizedQuery
        ? true
        : item.communityName.toLowerCase().includes(normalizedQuery);
      if (!matchesCommunity) return false;

      if (!activeStatusFilters.length) return true;
      const status = String(item.statusLabel || "").trim().toLowerCase();
      return status ? activeStatusFilters.includes(status) : false;
    });
  }, [activeStatusFilters, items, normalizedQuery]);

  const hasFilter = Boolean(normalizedQuery) || activeStatusFilters.length > 0;

  return (
    <div className="thread-feed">
      {hasStatusFilter ? (
        <div className="thread-feed-controls">
          <CommunityNameSearchField
            className="thread-community-search-field"
            label={searchLabel}
            placeholder={searchPlaceholder}
            value={communityQuery}
            onChange={(event) => setCommunityQuery(event.target.value)}
            datalistId={datalistId}
            options={communityOptions}
          />
          <div className="field thread-feed-filter">
            <span>{statusFilterLabel || "Status"}</span>
            <div className="thread-status-filter-list">
              {normalizedStatusOptions.map((option) => {
                const isSelected = activeStatusFilters.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`thread-status-filter-chip${isSelected ? " is-selected" : ""}`}
                    aria-pressed={isSelected}
                    onClick={() => toggleStatusFilter(option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <CommunityNameSearchField
          className="thread-community-search-field"
          label={searchLabel}
          placeholder={searchPlaceholder}
          value={communityQuery}
          onChange={(event) => setCommunityQuery(event.target.value)}
          datalistId={datalistId}
          options={communityOptions}
        />
      )}

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
            {hasFilter ? filteredEmptyLabel || "No matching items." : emptyLabel}
          </p>
        )}
      </div>
    </div>
  );
}
