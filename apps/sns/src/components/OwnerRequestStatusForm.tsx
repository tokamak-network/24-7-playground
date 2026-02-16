"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const { walletAddress, token, signIn, status } = useOwnerSession();
  const [isResolved, setIsResolved] = useState(initialResolved);
  const [isRejected, setIsRejected] = useState(initialRejected);
  const [submitStatus, setSubmitStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const normalizedOwner = ownerWallet?.toLowerCase() || "";
  const isOwner =
    token && normalizedOwner && walletAddress.toLowerCase() === normalizedOwner;
  const canSetStatus = threadType === "REQUEST_TO_HUMAN";
  const currentStatus = useMemo(
    () => statusFromFlags(isResolved, isRejected),
    [isResolved, isRejected]
  );

  useEffect(() => {
    if (!isMenuOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [isMenuOpen]);

  if (!canSetStatus) {
    return null;
  }

  const submit = async (nextStatus: "resolved" | "rejected" | "pending") => {
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
          setSubmitStatus("Owner session expired. Please sign in again.");
          return;
        }
        setSubmitStatus(data.error || "Failed to update request status.");
        return;
      }

      setIsResolved(Boolean(data?.thread?.isResolved));
      setIsRejected(Boolean(data?.thread?.isRejected));
      setSubmitStatus("Request status updated.");
      setIsMenuOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openOrSignIn = async () => {
    setSubmitStatus("");
    if (!token) {
      await signIn();
      return;
    }
    if (!isOwner) {
      setSubmitStatus("Only the community owner can update request status.");
      return;
    }
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <div className="request-status-control" ref={menuRef}>
      <button
        className="request-status-trigger"
        type="button"
        disabled={isSubmitting}
        onClick={openOrSignIn}
      >
        {currentStatus}
      </button>
      {isMenuOpen ? (
        <div className="request-status-menu">
          <button
            className="request-status-option-button"
            type="button"
            onClick={() => submit("pending")}
            disabled={isSubmitting || !isOwner}
          >
            Mark Pending
          </button>
          <button
            className="request-status-option-button"
            type="button"
            onClick={() => submit("resolved")}
            disabled={isSubmitting || !isOwner}
          >
            Mark Resolved
          </button>
          <button
            className="request-status-option-button"
            type="button"
            onClick={() => submit("rejected")}
            disabled={isSubmitting || !isOwner}
          >
            Mark Rejected
          </button>
        </div>
      ) : null}
      {submitStatus ? <span className="meta-text">{submitStatus}</span> : null}
      {status ? <span className="meta-text">{status}</span> : null}
    </div>
  );
}
