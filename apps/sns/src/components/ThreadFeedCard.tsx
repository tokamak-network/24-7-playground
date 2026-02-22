"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AgentAuthorProfileTrigger } from "src/components/AgentAuthorProfileTrigger";
import { ExpandableFormattedContent } from "src/components/ExpandableFormattedContent";
import { formatUtcDateTime } from "src/lib/dateDisplay";

type Props = {
  href?: string;
  badgeLabel: string;
  title: string;
  body: string;
  author: string;
  authorAgentId?: string | null;
  createdAt: string;
  commentCount: number;
  threadId: string;
  communityName: string;
  statusLabel?: string;
  isIssued?: boolean;
  className?: string;
  bodyMaxChars?: number;
  compactBody?: boolean;
  titleAsText?: boolean;
  metaPrefix?: ReactNode;
};

export function ThreadFeedCard({
  href,
  badgeLabel,
  title,
  body,
  author,
  authorAgentId,
  createdAt,
  commentCount,
  threadId,
  communityName,
  statusLabel,
  isIssued = false,
  className,
  bodyMaxChars = 280,
  compactBody = true,
  titleAsText = false,
  metaPrefix,
}: Props) {
  const normalizedAuthor = author.trim();
  const isSystemAuthor = normalizedAuthor.toLowerCase() === "system";
  const canOpenAuthorProfile = Boolean(authorAgentId && !isSystemAuthor);
  const displayAuthor = normalizedAuthor || "SYSTEM";
  const normalizedBadgeLabel = badgeLabel.trim().toLowerCase();
  const resolvedStatusLabel =
    statusLabel ||
    (normalizedBadgeLabel === "report"
      ? isIssued
        ? "ISSUED"
        : "NOT ISSUED"
      : undefined);
  const articleClassName = `feed-item${className ? ` ${className}` : ""}`;
  const shouldLinkTitle = Boolean(href) && !titleAsText;

  return (
    <article className={articleClassName}>
      <div className="thread-title-block">
        <span className="badge">thread</span>
        <div className="badge">{badgeLabel}</div>
        {resolvedStatusLabel ? <span className="badge">{resolvedStatusLabel}</span> : null}
        <h4 className="thread-card-title">
          {shouldLinkTitle ? (
            <Link href={href as string} className="feed-title-link">
              {title}
            </Link>
          ) : (
            title
          )}
        </h4>
      </div>
      <div className="thread-body-block">
        <ExpandableFormattedContent
          content={body}
          className={compactBody ? "is-compact" : undefined}
          maxChars={bodyMaxChars}
        />
      </div>
      <div className="meta thread-meta">
        <div className="meta thread-meta-main">
          {metaPrefix ? metaPrefix : null}
          <span className="meta-text thread-community-inline">
            <span className="thread-community-kicker">community</span>
            <strong>{communityName}</strong>
          </span>
          <span className="meta-text">
            by{" "}
            {isSystemAuthor ? (
              <strong>SYSTEM</strong>
            ) : canOpenAuthorProfile ? (
              <AgentAuthorProfileTrigger
                agentId={String(authorAgentId)}
                authorLabel={displayAuthor}
              />
            ) : (
              displayAuthor
            )}
          </span>
          <span className="meta-text">
            {formatUtcDateTime(createdAt)}
          </span>
          <span className="meta-text">{commentCount} comments</span>
        </div>
        <span className="meta-text thread-id-meta">
          thread id: <code>{threadId}</code>
        </span>
      </div>
    </article>
  );
}
