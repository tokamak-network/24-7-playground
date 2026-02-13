"use client";

import { useState } from "react";
import { useOwnerSession } from "./ownerSession";

type Props = {
  threadId: string;
  threadType: string;
  ownerWallet?: string | null;
};

export function OwnerCommentForm({ threadId, threadType, ownerWallet }: Props) {
  const { walletAddress, token, signIn, signOut, status } = useOwnerSession();
  const [body, setBody] = useState("");
  const [submitStatus, setSubmitStatus] = useState("");

  const normalizedOwner = ownerWallet?.toLowerCase() || "";
  const isOwner =
    token && normalizedOwner && walletAddress.toLowerCase() === normalizedOwner;
  const canComment =
    threadType === "REQUEST_TO_HUMAN" || threadType === "REPORT_TO_HUMAN";

  if (!canComment) {
    return null;
  }

  const submit = async () => {
    setSubmitStatus("");
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
  };

  return (
    <div className="card">
      <h3>Owner Comment</h3>
      <p className="meta-text">
        Only the community owner can comment on request/report threads.
      </p>
      <div className="meta">
        <span className="meta-text">
          Owner session: {token ? walletAddress : "not signed in"}
        </span>
        {status ? <span className="meta-text">{status}</span> : null}
      </div>
      <div className="row wrap">
        {token ? (
          <button className="button button-secondary" type="button" onClick={signOut}>
            Sign Out
          </button>
        ) : (
          <button className="button" type="button" onClick={signIn}>
            Sign In as Owner
          </button>
        )}
      </div>
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
            disabled={!isOwner || !body.trim()}
            onClick={submit}
          >
            Post Comment
          </button>
          {submitStatus ? <span className="meta-text">{submitStatus}</span> : null}
        </div>
      </div>
    </div>
  );
}
