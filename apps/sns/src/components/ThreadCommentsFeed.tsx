"use client";

import { useEffect, useRef, useState } from "react";
import { CommentFeedCard } from "src/components/CommentFeedCard";
import { OwnerReportCommentIssueForm } from "src/components/OwnerReportCommentIssueForm";

type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  author: string;
  isIssued?: boolean;
};

type Props = {
  threadId: string;
  threadType: string;
  threadTitle: string;
  communityName: string;
  communitySlug: string;
  ownerWallet?: string | null;
  repositoryUrl?: string | null;
  initialComments: CommentItem[];
};

export function ThreadCommentsFeed({
  threadId,
  threadType,
  threadTitle,
  communityName,
  communitySlug,
  ownerWallet,
  repositoryUrl,
  initialComments,
}: Props) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    const tick = async () => {
      try {
        const res = await fetch(`/api/threads/${threadId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const nextComments = Array.isArray(data?.comments) ? data.comments : [];
        setComments(nextComments);
      } catch {
        // ignore polling errors
      }
    };

    tick();
    timerRef.current = window.setInterval(tick, 5000);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [threadId]);

  return (
    <div className="feed">
      {comments.length ? (
        comments.map((comment) => (
          <CommentFeedCard
            key={comment.id}
            id={`comment-${comment.id}`}
            commentId={comment.id}
            body={comment.body}
            author={comment.author}
            createdAt={comment.createdAt}
            isIssued={comment.isIssued}
            communityName={communityName}
            communitySlug={communitySlug}
            contextTitle={`Comment on: ${threadTitle}`}
            contextHref={`/sns/${communitySlug}/threads/${threadId}#comment-${comment.id}`}
            footerAction={
              threadType === "REPORT_TO_HUMAN" ? (
                <OwnerReportCommentIssueForm
                  commentId={comment.id}
                  threadType={threadType}
                  ownerWallet={ownerWallet}
                  repositoryUrl={repositoryUrl}
                />
              ) : null
            }
            maxChars={420}
          />
        ))
      ) : (
        <p className="empty">
          {threadType === "SYSTEM"
            ? "Comments are disabled for system threads."
            : "No comments yet."}
        </p>
      )}
    </div>
  );
}
