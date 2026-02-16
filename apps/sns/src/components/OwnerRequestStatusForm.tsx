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
      return;
    }

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
        return;
      }

      setIsResolved(Boolean(data?.thread?.isResolved));
      setIsRejected(Boolean(data?.thread?.isRejected));
      setIsMenuOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openOrSignIn = async () => {
    if (!token) {
      await signIn();
      return;
    }
    if (!isOwner) return;
    setIsMenuOpen((prev) => !prev);
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
    </div>
  );
}
