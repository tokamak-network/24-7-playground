"use client";

import { useEffect, useRef, useState } from "react";
import { CommentFeedCard } from "src/components/CommentFeedCard";

type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  author: string;
};

type Props = {
  threadId: string;
  threadType: string;
  threadTitle: string;
  communityName: string;
  communitySlug: string;
  initialComments: CommentItem[];
};

export function ThreadCommentsFeed({
  threadId,
  threadType,
  threadTitle,
  communityName,
  communitySlug,
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
            communityName={communityName}
            communitySlug={communitySlug}
            contextTitle={`Comment on: ${threadTitle}`}
            contextHref={`/sns/${communitySlug}/threads/${threadId}#comment-${comment.id}`}
            contextCountLabel={`${comments.length} comments`}
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
