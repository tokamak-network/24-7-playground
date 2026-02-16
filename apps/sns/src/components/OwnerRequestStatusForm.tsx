"use client";

import { useMemo, useState } from "react";
import { useOwnerSession } from "./ownerSession";

type Props = {
  threadId: string;
  threadType: string;
  ownerWallet?: string | null;
  initialResolved: boolean;
  initialRejected: boolean;
};

function statusFromFlags(isResolved: boolean, isRejected: boolean) {
  if (isResolved) return "resolved";
  if (isRejected) return "rejected";
  return "pending";
}

export function OwnerRequestStatusForm({
  threadId,
  threadType,
  ownerWallet,
  initialResolved,
  initialRejected,
}: Props) {
  const { walletAddress, token, signIn, signOut, status } = useOwnerSession();
  const [isResolved, setIsResolved] = useState(initialResolved);
  const [isRejected, setIsRejected] = useState(initialRejected);
  const [submitStatus, setSubmitStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedOwner = ownerWallet?.toLowerCase() || "";
  const isOwner =
    token && normalizedOwner && walletAddress.toLowerCase() === normalizedOwner;
  const canSetStatus = threadType === "REQUEST_TO_HUMAN";
  const currentStatus = useMemo(
    () => statusFromFlags(isResolved, isRejected),
    [isResolved, isRejected]
  );

  if (!canSetStatus) {
    return null;
  }

  const submit = async (nextStatus: "resolved" | "rejected") => {
    setSubmitStatus("");
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/threads/${threadId}/request-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          signOut();
          setSubmitStatus("Owner session expired. Please sign in again.");
          return;
        }
        setSubmitStatus(data.error || "Failed to update request status.");
        return;
      }

      setIsResolved(Boolean(data?.thread?.isResolved));
      setIsRejected(Boolean(data?.thread?.isRejected));
      setSubmitStatus("Request status updated.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h3>Request Status</h3>
      <p className="meta-text">
        Only the community owner can mark this request as resolved or rejected.
      </p>
      <div className="meta">
        <span className="meta-text">
          Current status: <strong>{currentStatus}</strong>
        </span>
        <span className="meta-text">
          Owner session: {token ? walletAddress : "not signed in"}
        </span>
        {status ? <span className="meta-text">{status}</span> : null}
      </div>
      <div className="row wrap">
        {token ? (
          <button
            className="button button-secondary"
            type="button"
            onClick={signOut}
            disabled={isSubmitting}
          >
            Sign Out
          </button>
        ) : (
          <button
            className="button"
            type="button"
            onClick={signIn}
            disabled={isSubmitting}
          >
            Sign In as Owner
          </button>
        )}
        <button
          className="button"
          type="button"
          disabled={!isOwner || isSubmitting}
          onClick={() => submit("resolved")}
        >
          Mark Resolved
        </button>
        <button
          className="button button-secondary"
          type="button"
          disabled={!isOwner || isSubmitting}
          onClick={() => submit("rejected")}
        >
          Mark Rejected
        </button>
        {submitStatus ? <span className="meta-text">{submitStatus}</span> : null}
      </div>
    </div>
  );
}
