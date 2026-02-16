"use client";

import { useEffect, useMemo, useState } from "react";
import { FormattedContent, type MentionLink } from "src/components/FormattedContent";

type Props = {
  content: string;
  className?: string;
  maxChars?: number;
  expandLabel?: string;
  collapseLabel?: string;
};

const MENTION_ID_PATTERN =
  /\b(c[a-z0-9]{24}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})\b/g;
const mentionLinkCache = new Map<string, MentionLink>();

function extractMentionIds(content: string) {
  const ids = new Set<string>();
  let match: RegExpExecArray | null;
  MENTION_ID_PATTERN.lastIndex = 0;
  while ((match = MENTION_ID_PATTERN.exec(content)) !== null) {
    ids.add(match[1]);
  }
  return Array.from(ids);
}

function truncateContent(input: string, maxChars: number) {
  const normalized = String(input || "").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }

  const slice = normalized.slice(0, maxChars);
  const lastBreak = Math.max(
    slice.lastIndexOf("\n"),
    slice.lastIndexOf(". "),
    slice.lastIndexOf(" "),
    slice.lastIndexOf("]")
  );
  const cutIndex = lastBreak > Math.floor(maxChars * 0.6) ? lastBreak : maxChars;
  return `${slice.slice(0, cutIndex).trimEnd()}\n\n...`;
}

export function ExpandableFormattedContent({
  content,
  className,
  maxChars = 420,
  expandLabel = "Read more",
  collapseLabel = "Show less",
}: Props) {
  const normalized = String(content || "");
  const [expanded, setExpanded] = useState(false);
  const [mentionLinks, setMentionLinks] = useState<Record<string, MentionLink>>({});

  const isLong = normalized.trim().length > maxChars;
  const mentionIds = useMemo(
    () => extractMentionIds(normalized),
    [normalized]
  );
  const preview = useMemo(
    () => truncateContent(normalized, maxChars),
    [normalized, maxChars]
  );

  useEffect(() => {
    if (mentionIds.length === 0) {
      setMentionLinks({});
      return;
    }

    const cachedLinks: Record<string, MentionLink> = {};
    const missingIds: string[] = [];

    for (const id of mentionIds) {
      const cached = mentionLinkCache.get(id);
      if (cached) {
        cachedLinks[id] = cached;
      } else {
        missingIds.push(id);
      }
    }

    if (missingIds.length === 0) {
      setMentionLinks(cachedLinks);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/mentions/resolve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: missingIds }),
        });
        if (!response.ok) {
          if (!cancelled) {
            setMentionLinks(cachedLinks);
          }
          return;
        }

        const data = await response.json();
        const resolved = data?.links && typeof data.links === "object"
          ? (data.links as Record<string, MentionLink>)
          : {};

        for (const [id, link] of Object.entries(resolved)) {
          if (link && typeof link.href === "string") {
            mentionLinkCache.set(id, link);
          }
        }

        if (cancelled) return;

        const merged: Record<string, MentionLink> = { ...cachedLinks };
        for (const id of mentionIds) {
          const next = mentionLinkCache.get(id);
          if (next) {
            merged[id] = next;
          }
        }
        setMentionLinks(merged);
      } catch {
        if (!cancelled) {
          setMentionLinks(cachedLinks);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [mentionIds]);

  return (
    <div className="expandable-content">
      <FormattedContent
        content={expanded || !isLong ? normalized : preview}
        className={className}
        mentionLinks={mentionLinks}
      />
      {isLong ? (
        <span
          role="button"
          tabIndex={0}
          className="expandable-toggle-text"
          onClick={() => setExpanded((value) => !value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setExpanded((value) => !value);
            }
          }}
        >
          {expanded ? collapseLabel : expandLabel}
        </span>
      ) : null}
    </div>
  );
}
