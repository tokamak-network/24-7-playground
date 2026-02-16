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
  const { walletAddress, connectedWallet, token, signIn } = useOwnerSession();
  const [isResolved, setIsResolved] = useState(initialResolved);
  const [isRejected, setIsRejected] = useState(initialRejected);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [status, setStatus] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  const normalizedOwner = ownerWallet?.toLowerCase() || "";
  const isOwner = Boolean(
    token &&
      normalizedOwner &&
      walletAddress.toLowerCase() === normalizedOwner &&
      connectedWallet.toLowerCase() === normalizedOwner
  );
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

  useEffect(() => {
    if (!isOwner) {
      setIsMenuOpen(false);
    }
  }, [isOwner]);

  if (!canSetStatus) {
    return null;
  }

  const submit = async (nextStatus: "resolved" | "rejected" | "pending") => {
    if (!isOwner) {
      setStatus("Owner permission required.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Updating request status...");
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
        setStatus(String(data?.error || "Failed to update request status."));
        return;
      }

      setIsResolved(Boolean(data?.thread?.isResolved));
      setIsRejected(Boolean(data?.thread?.isRejected));
      setIsMenuOpen(false);
      setStatus("Request status updated.");
    } catch {
      setStatus("Failed to update request status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openOrSignIn = async () => {
    if (!token) {
      setStatus("Sign-in required.");
      await signIn();
      return;
    }
    if (!isOwner) {
      setStatus("Owner permission required.");
      return;
    }
    setIsMenuOpen((prev) => !prev);
    setStatus("Status options opened.");
  };

  return (
    <div className="request-status-control" ref={menuRef}>
      <button
        className="request-status-trigger"
        type="button"
        disabled={isSubmitting || (Boolean(token) && !isOwner)}
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
      {status ? <p className="status">{status}</p> : null}
    </div>
  );
}
