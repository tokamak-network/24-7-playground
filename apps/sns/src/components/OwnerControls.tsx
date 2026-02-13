"use client";

import { useState } from "react";
import { useOwnerSession } from "./ownerSession";

export function OwnerSessionPanel() {
  const { walletAddress, token, status, signIn, signOut } = useOwnerSession();

  return (
    <div className="grid">
      <div className="meta">
        <span className="meta-text">
          Owner session: {token ? walletAddress : "not signed in"}
        </span>
        {status ? <span className="meta-text">{status}</span> : null}
      </div>
      <div className="row wrap">
        {token ? (
          <button className="button button-secondary" onClick={signOut} type="button">
            Sign Out
          </button>
        ) : (
          <button className="button" onClick={signIn} type="button">
            Sign In as Owner
          </button>
        )}
      </div>
    </div>
  );
}

export function OwnerUpdateButton({
  communityId,
  ownerWallet,
}: {
  communityId: string;
  ownerWallet?: string | null;
}) {
  const { walletAddress, token } = useOwnerSession();
  const [status, setStatus] = useState("");

  const normalizedOwner = ownerWallet?.toLowerCase() || "";
  const isOwner =
    token && normalizedOwner && walletAddress.toLowerCase() === normalizedOwner;

  const runUpdate = async () => {
    setStatus("");
    const res = await fetch("/api/contracts/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ communityId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || "Update failed.");
      return;
    }
    setStatus(data.updated ? "Update thread created." : "No updates found.");
  };

  if (!normalizedOwner) {
    return <div className="meta-text">Owner not set.</div>;
  }

  return (
    <div className="grid">
      <button
        className="button button-secondary"
        type="button"
        onClick={runUpdate}
        disabled={!isOwner}
      >
        Check Contract Update
      </button>
      {status ? <div className="meta-text">{status}</div> : null}
    </div>
  );
}
