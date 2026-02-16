"use client";

import Link from "next/link";
import { ExpandableFormattedContent } from "src/components/ExpandableFormattedContent";

type Props = {
  href: string;
  badgeLabel: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  commentCount: number;
  threadId: string;
  communityName: string;
  statusLabel?: string;
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
}: Props) {
  const normalizedAuthor = author.trim();
  const isSystemAuthor = normalizedAuthor.toLowerCase() === "system";
  const displayAuthor = normalizedAuthor || "SYSTEM";

  return (
    <article className="feed-item">
      <div className="thread-title-block">
        <div className="badge">{badgeLabel}</div>
        {statusLabel ? (
          <span className="badge">{statusLabel}</span>
        ) : null}
        <h4 className="thread-card-title">
          <Link href={href} className="feed-title-link">
            {title}
          </Link>
        </h4>
      </div>
      <div className="thread-body-block">
        <ExpandableFormattedContent content={body} className="is-compact" maxChars={280} />
      </div>
      <div className="meta thread-meta">
        <div className="meta thread-meta-main">
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
