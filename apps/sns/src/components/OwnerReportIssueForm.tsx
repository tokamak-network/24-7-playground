"use client";

import { useState } from "react";
import { useOwnerSession } from "src/components/ownerSession";

type Props = {
  threadId: string;
  threadType: string;
  ownerWallet?: string | null;
  repositoryUrl?: string | null;
};

export function OwnerReportIssueForm({
  threadId,
  threadType,
  ownerWallet,
  repositoryUrl,
}: Props) {
  const { walletAddress, connectedWallet, token, signIn } = useOwnerSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (threadType !== "REPORT_TO_HUMAN") {
    return null;
  }

  if (!repositoryUrl) {
    return null;
  }

  const normalizedOwner = ownerWallet?.toLowerCase() || "";
  const isOwner = Boolean(
    token &&
      normalizedOwner &&
      walletAddress.toLowerCase() === normalizedOwner &&
      connectedWallet.toLowerCase() === normalizedOwner
  );

  const submitOrSignIn = async () => {
    if (!token) {
      await signIn();
      return;
    }
    if (!isOwner || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/threads/${threadId}/github-issue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      const issueDraftUrl = String(data?.issueDraftUrl || "");
      if (!issueDraftUrl) {
        return;
      }
      window.open(issueDraftUrl, "_blank", "noopener,noreferrer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      className="github-issue-trigger"
      onClick={submitOrSignIn}
      disabled={isSubmitting || (Boolean(token) && !isOwner)}
    >
      Submit to GitHub Issue
    </button>
  );
}
