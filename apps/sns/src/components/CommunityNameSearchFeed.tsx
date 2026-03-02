"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  isIssued?: boolean;
  communitySlug: string | null;
  communityName: string;
  author: string;
  authorAgentId?: string | null;
  statusLabel?: string;
};

type Props = {
  items: ThreadItem[];
  badgeLabel: string;
  emptyLabel: string;
  searchLabel?: string;
  searchPlaceholder: string;
  datalistId: string;
  statusFilterLabel?: string;
  statusFilterOptions?: StatusFilterOption[];
  filteredEmptyLabel?: string;
  statusFilterFooter?: ReactNode;
};

const threadFilterTriggerStyle: CSSProperties = {
  height: "36px",
  minHeight: "36px",
  maxHeight: "36px",
  padding: "0 11px",
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
  statusFilterFooter,
}: Props) {
  const [communityQuery, setCommunityQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);
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
  const resolvedStatusFilterLabel =
    typeof statusFilterLabel === "string" ? statusFilterLabel.trim() : "Status";
  const controlsClassName =
    hasStatusFilter && statusFilterFooter
      ? "thread-feed-controls has-filter-footer"
      : "thread-feed-controls";

  useEffect(() => {
    if (!isStatusMenuOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!statusMenuRef.current) return;
      if (!statusMenuRef.current.contains(event.target as Node)) {
        setIsStatusMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [isStatusMenuOpen]);

  const toggleStatusFilter = (value: string) => {
    setStatusFilters((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery = !normalizedQuery
        ? true
        : item.communityName.toLowerCase().includes(normalizedQuery) ||
          item.author.toLowerCase().includes(normalizedQuery);
      if (!matchesQuery) return false;

      if (!activeStatusFilters.length) return true;
      const status = String(item.statusLabel || "").trim().toLowerCase();
      return status ? activeStatusFilters.includes(status) : false;
    });
  }, [activeStatusFilters, items, normalizedQuery]);

  const hasFilter = Boolean(normalizedQuery) || activeStatusFilters.length > 0;

  return (
    <div className="thread-feed">
      {hasStatusFilter ? (
        <div className={controlsClassName}>
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
            {resolvedStatusFilterLabel ? <span>{resolvedStatusFilterLabel}</span> : null}
            <div className="thread-type-dropdown" ref={statusMenuRef}>
              <button
                type="button"
                className="thread-type-dropdown-trigger"
                style={threadFilterTriggerStyle}
                onClick={() => setIsStatusMenuOpen((prev) => !prev)}
              >
                <span className="thread-type-dropdown-value">
                  {activeStatusFilters.length > 0
                    ? `${activeStatusFilters.length} selected`
                    : "All"}
                </span>
                <span
                  className={`thread-type-dropdown-caret${isStatusMenuOpen ? " is-open" : ""}`}
                  aria-hidden
                >
                  ▼
                </span>
              </button>
              {isStatusMenuOpen ? (
                <div className="thread-type-dropdown-menu">
                  {normalizedStatusOptions.map((option) => {
                    const isSelected = activeStatusFilters.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`thread-type-dropdown-item${isSelected ? " is-selected" : ""}`}
                        aria-pressed={isSelected}
                        onClick={() => toggleStatusFilter(option.value)}
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
            {statusFilterFooter ? (
              <div className="thread-feed-filter-extra">{statusFilterFooter}</div>
            ) : null}
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
              ? `/communities/${item.communitySlug}/threads/${item.id}`
              : "/communities";

            return (
              <ThreadFeedCard
                key={item.id}
                href={threadHref}
                badgeLabel={badgeLabel}
                statusLabel={item.statusLabel}
                title={item.title}
                body={item.body}
                author={item.author || "system"}
                authorAgentId={item.authorAgentId}
                createdAt={item.createdAt}
                isIssued={item.isIssued}
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
