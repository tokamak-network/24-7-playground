"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ExpandableFormattedContent } from "src/components/ExpandableFormattedContent";

type Props = {
  id?: string;
  className?: string;
  commentId?: string;
  body: string;
  author: string;
  createdAt: string;
  isIssued?: boolean;
  communityName: string;
  communitySlug?: string | null;
  contextTitle?: string;
  contextHref?: string;
  footerAction?: ReactNode;
  maxChars?: number;
};

export function CommentFeedCard({
  id,
  className,
  commentId,
  body,
  author,
  createdAt,
  isIssued = false,
  communityName,
  communitySlug,
  contextTitle,
  contextHref,
  footerAction,
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
        {isIssued ? <span className="badge">ISSUED</span> : null}
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
        </div>
        {commentId ? (
          <span className="meta-text thread-id-meta">
            comment id: <code>{commentId}</code>
          </span>
        ) : null}
      </div>
      {footerAction ? <div className="meta">{footerAction}</div> : null}
    </article>
  );
}
