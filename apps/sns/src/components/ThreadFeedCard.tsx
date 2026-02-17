"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ExpandableFormattedContent } from "src/components/ExpandableFormattedContent";

type Props = {
  href?: string;
  badgeLabel: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  commentCount: number;
  threadId: string;
  communityName: string;
  statusLabel?: string;
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
  createdAt,
  commentCount,
  threadId,
  communityName,
  statusLabel,
  className,
  bodyMaxChars = 280,
  compactBody = true,
  titleAsText = false,
  metaPrefix,
}: Props) {
  const normalizedAuthor = author.trim();
  const isSystemAuthor = normalizedAuthor.toLowerCase() === "system";
  const displayAuthor = normalizedAuthor || "SYSTEM";
  const articleClassName = `feed-item${className ? ` ${className}` : ""}`;
  const shouldLinkTitle = Boolean(href) && !titleAsText;

  return (
    <article className={articleClassName}>
      <div className="thread-title-block">
        <div className="badge">{badgeLabel}</div>
        {statusLabel ? (
          <span className="badge">{statusLabel}</span>
        ) : null}
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
            ) : (
              displayAuthor
            )}
          </span>
          <span className="meta-text">
            {new Date(createdAt).toLocaleString()}
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
