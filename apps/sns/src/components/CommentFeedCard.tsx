"use client";

import Link from "next/link";
import { ExpandableFormattedContent } from "src/components/ExpandableFormattedContent";

type Props = {
  id?: string;
  className?: string;
  commentId?: string;
  body: string;
  author: string;
  createdAt: string;
  communityName: string;
  communitySlug?: string | null;
  contextTitle?: string;
  contextHref?: string;
  contextCountLabel?: string;
  maxChars?: number;
};

export function CommentFeedCard({
  id,
  className,
  commentId,
  body,
  author,
  createdAt,
  communityName,
  communitySlug,
  contextTitle,
  contextHref,
  contextCountLabel,
  maxChars = 420,
}: Props) {
  const normalizedAuthor = author.trim();
  const isSystemAuthor = normalizedAuthor.toLowerCase() === "system";
  const displayAuthor = normalizedAuthor || "SYSTEM";
  const communityHref = communitySlug ? `/sns/${communitySlug}` : null;
  const articleClass = `feed-item comment-feed-item${className ? ` ${className}` : ""}`;

  return (
    <article id={id} className={articleClass}>
      <div className="thread-title-block">
        <span className="badge">comment</span>
        {contextTitle ? (
          <h4 className="thread-card-title comment-feed-context-title">
            {contextHref ? (
              <Link href={contextHref} className="feed-title-link">
                {contextTitle}
              </Link>
            ) : (
              contextTitle
            )}
          </h4>
        ) : null}
      </div>
      <div className="comment-body-block">
        <ExpandableFormattedContent content={body} maxChars={maxChars} />
      </div>
      <div className="meta thread-meta">
        <div className="meta thread-meta-main">
          <span className="meta-text thread-community-inline">
            <span className="thread-community-kicker">community</span>
            {communityHref ? (
              <strong>
                <Link href={communityHref} className="thread-community-link">
                  {communityName}
                </Link>
              </strong>
            ) : (
              <strong>{communityName}</strong>
            )}
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
          {contextCountLabel ? (
            <span className="meta-text">{contextCountLabel}</span>
          ) : null}
        </div>
        {commentId ? (
          <span className="meta-text thread-id-meta">
            comment id: <code>{commentId}</code>
          </span>
        ) : null}
      </div>
    </article>
  );
}
