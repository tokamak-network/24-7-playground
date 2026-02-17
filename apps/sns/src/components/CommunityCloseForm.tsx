"use client";

import { useEffect, useState } from "react";
import { getAddress } from "ethers";
import { Button } from "src/components/ui";

type OwnedCommunity = {
  id: string;
  name: string;
  slug: string;
  status: string;
  chain: string;
  address: string;
  deleteAt?: string | null;
};

const FIXED_MESSAGE = "24-7-playground";

export function CommunityCloseForm() {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [communities, setCommunities] = useState<OwnedCommunity[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);

  const normalizeAddress = (value: string) => {
    try {
      return getAddress(value);
    } catch {
      return value;
    }
  };

  const normalizeConfirmName = (value: string) => {
    return value.trim().replace(/\s+/g, " ").toLowerCase();
  };

  const loadWallet = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setStatus("MetaMask not detected.");
      return;
    }
    try {
      const accounts = (await ethereum.request({
        method: "eth_accounts",
      })) as string[];
      if (accounts && accounts.length > 0) {
        const next = normalizeAddress(accounts[0]);
        setWallet(next);
        setStatus("");
      }
    } catch {
      setStatus("Failed to read wallet.");
    }
  };

  const fetchOwned = async (walletAddress: string) => {
    if (!walletAddress) return;
    setBusy(true);
    setStatus("Loading owned communities...");
    try {
      const res = await fetch(
        `/api/communities/owned?walletAddress=${encodeURIComponent(
          walletAddress
        )}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load communities");
      }
      const active = (data.communities || []).filter(
        (c: OwnedCommunity) => c.status !== "CLOSED"
      );
      setCommunities(active);
      if (active.length === 0) {
        setSelectedId("");
        setStatus("No active communities owned by this wallet.");
      } else {
        setSelectedId(active[0]?.id || "");
        setStatus("");
      }
    } catch (error) {
      setCommunities([]);
      setSelectedId("");
      setStatus(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum?.on) {
      void loadWallet();
      return;
    }

    const handleAccounts = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        setWallet("");
        return;
      }
      setWallet(normalizeAddress(accounts[0]));
    };

    void loadWallet();
    ethereum.on("accountsChanged", handleAccounts);
    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccounts);
    };
  }, []);

  useEffect(() => {
    if (!wallet) return;
    void fetchOwned(wallet);
  }, [wallet]);

  const closeCommunity = async () => {
    if (!wallet) {
      setStatus("Connect wallet first.");
      return;
    }
    const target = communities.find((c) => c.id === selectedId);
    if (!target) {
      setStatus("Select a community.");
      return;
    }
    const confirm = window.prompt(
      `Closing this community will revoke all API keys immediately and delete the community after 14 days.\n\nType the community name to confirm:\n${target.name}`
    );
    if (!confirm) {
      setStatus("Close cancelled.");
      return;
    }
    if (normalizeConfirmName(confirm) !== normalizeConfirmName(target.name)) {
      setStatus("Community name did not match.");
      return;
    }

    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setStatus("MetaMask not detected.");
      return;
    }
    setBusy(true);
    setStatus("Closing community...");
    try {
      const signature = (await ethereum.request({
        method: "personal_sign",
        params: [FIXED_MESSAGE, wallet],
      })) as string;
      const res = await fetch("/api/communities/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityId: selectedId,
          signature,
          confirmName: confirm.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Close failed");
      }
      setStatus("Community closed. Deletion scheduled.");
      const remaining = communities.filter((c) => c.id !== selectedId);
      setCommunities(remaining);
      setSelectedId(remaining[0]?.id || "");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form">
      <div className="field">
        <label>Owned Communities</label>
        {wallet ? (
          communities.length > 0 ? (
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.currentTarget.value)}
            >
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name} ({community.slug}) · {community.chain} ·{" "}
                  {community.address.slice(0, 10)}…
                </option>
              ))}
            </select>
          ) : (
            <div className="status">No active communities found.</div>
          )
        ) : (
          <div className="status">Connect MetaMask to load communities.</div>
        )}
      </div>
      <div className="status">
        Closing a community revokes API keys immediately and schedules deletion
        in 14 days.
      </div>
      {status ? <div className="status">{status}</div> : null}
      {selectedId ? (
        <Button
          label={busy ? "Working..." : "Close Community"}
          type="button"
          onClick={closeCommunity}
          variant="secondary"
        />
      ) : null}
    </div>
  );
}
