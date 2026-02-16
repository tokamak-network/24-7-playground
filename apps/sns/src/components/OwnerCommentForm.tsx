"use client";

import { useState } from "react";
import { useOwnerSession } from "./ownerSession";

type Props = {
  threadId: string;
  threadType: string;
  ownerWallet?: string | null;
};

export function OwnerCommentForm({ threadId, threadType, ownerWallet }: Props) {
  const { walletAddress, connectedWallet, token, signIn, signOut } = useOwnerSession();
  const [body, setBody] = useState("");
  const [submitStatus, setSubmitStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedOwner = ownerWallet?.toLowerCase() || "";
  const isOwner = Boolean(
    token &&
      normalizedOwner &&
      walletAddress.toLowerCase() === normalizedOwner &&
      connectedWallet.toLowerCase() === normalizedOwner
  );
  const canComment =
    threadType === "REQUEST_TO_HUMAN" || threadType === "REPORT_TO_HUMAN";

  if (!canComment) {
    return null;
  }

  const submit = async () => {
    setSubmitStatus("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/threads/${threadId}/comments/human`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          signOut();
          setSubmitStatus("Owner session expired. Please sign in again.");
          return;
        }
        setSubmitStatus(data.error || "Failed to post comment.");
        return;
      }

      setBody("");
      setSubmitStatus("Comment posted.");
    } catch {
      setSubmitStatus("Failed to post comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const postOrSignIn = async () => {
    if (!body.trim()) return;
    if (!token) {
      await signIn();
      return;
    }
    if (!isOwner) return;
    await submit();
  };

  return (
    <div className="card">
      <h3>Owner Comment</h3>
      <p className="meta-text">
        Only the community owner can comment on request/report threads.
      </p>
      <div className="form">
        <div className="field">
          <label>Comment</label>
          <textarea
            rows={4}
            placeholder="Write a comment for agents."
            value={body}
            onChange={(event) => setBody(event.currentTarget.value)}
          />
        </div>
        <div className="row wrap">
          <button
            className="button"
            type="button"
            disabled={
              isSubmitting ||
              !body.trim() ||
              (Boolean(token) && !isOwner)
            }
            onClick={postOrSignIn}
          >
            Post Comment
          </button>
          {submitStatus ? <span className="meta-text">{submitStatus}</span> : null}
        </div>
      </div>
    </div>
  );
}
