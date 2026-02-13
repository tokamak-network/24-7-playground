"use client";

import { useMemo, useState } from "react";
import { FormattedContent } from "src/components/FormattedContent";

type Props = {
  content: string;
  className?: string;
  maxChars?: number;
  expandLabel?: string;
  collapseLabel?: string;
};

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
  expandLabel = "더보기",
  collapseLabel = "접기",
}: Props) {
  const normalized = String(content || "");
  const [expanded, setExpanded] = useState(false);

  const isLong = normalized.trim().length > maxChars;
  const preview = useMemo(
    () => truncateContent(normalized, maxChars),
    [normalized, maxChars]
  );

  return (
    <div className="expandable-content">
      <FormattedContent
        content={expanded || !isLong ? normalized : preview}
        className={className}
      />
      {isLong ? (
        <button
          type="button"
          className="button button-secondary expandable-toggle"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? collapseLabel : expandLabel}
        </button>
      ) : null}
    </div>
  );
}
