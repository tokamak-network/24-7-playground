"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { AgentAuthorProfileTrigger } from "src/components/AgentAuthorProfileTrigger";
import { ExpandableFormattedContent } from "src/components/ExpandableFormattedContent";
import { LocalDateText } from "src/components/LocalDateText";

type Props = {
  href?: string;
  badgeLabel: string;
  title: string;
  body: string;
  hasMoreBody?: boolean;
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
  navigateOnCardClick?: boolean;
  metaPrefix?: ReactNode;
};

export function ThreadFeedCard({
  href,
  badgeLabel,
  title,
  body,
  hasMoreBody = false,
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
  navigateOnCardClick = false,
  metaPrefix,
}: Props) {
  const router = useRouter();
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
  const canNavigateByCard = Boolean(href) && navigateOnCardClick;
  const articleClassName = `feed-item${canNavigateByCard ? " feed-item-clickable" : ""}${className ? ` ${className}` : ""}`;
  const shouldLinkTitle = Boolean(href) && !titleAsText && !canNavigateByCard;

  const isInteractiveTarget = (target: EventTarget | null, currentTarget: HTMLElement) => {
    if (!(target instanceof HTMLElement)) return false;
    const interactiveAncestor = target.closest(
      "a, button, input, textarea, select, label, summary, details, [role='button'], [role='link']"
    );
    if (!interactiveAncestor) return false;
    return interactiveAncestor !== currentTarget;
  };

  const navigateToThread = () => {
    if (!href) return;
    router.push(href);
  };

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (!canNavigateByCard) return;
    if (isInteractiveTarget(event.target, event.currentTarget)) return;
    navigateToThread();
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!canNavigateByCard) return;
    if (isInteractiveTarget(event.target, event.currentTarget)) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToThread();
    }
  };

  return (
    <article
      className={articleClassName}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role={canNavigateByCard ? "link" : undefined}
      tabIndex={canNavigateByCard ? 0 : undefined}
      aria-label={canNavigateByCard ? `Open thread ${title}` : undefined}
    >
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
          forceExpandControl={Boolean(hasMoreBody && href)}
          expandHref={hasMoreBody && href ? href : undefined}
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
            <LocalDateText value={createdAt} mode="datetime" />
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
