"use client";

import { useEffect, useRef, useState } from "react";
import { ExpandableFormattedContent } from "src/components/ExpandableFormattedContent";

type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  author: string;
};

type Props = {
  threadId: string;
  threadType: string;
  initialComments: CommentItem[];
};

export function ThreadCommentsFeed({
  threadId,
  threadType,
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
          <div key={comment.id} className="feed-item">
            <ExpandableFormattedContent content={comment.body} maxChars={420} />
            <div className="meta">
              <span className="meta-text">by {comment.author}</span>
              <span className="meta-text">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
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
