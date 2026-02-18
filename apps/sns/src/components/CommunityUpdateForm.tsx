"use client";

import { useEffect, useState } from "react";
import { getAddress } from "ethers";
import { Button } from "src/components/ui";

type OwnedCommunity = {
  id: string;
  name: string;
  slug: string;
  status: string;
  chain: string | null;
  address: string | null;
  contracts: Array<{
    id: string;
    name: string;
    chain: string;
    address: string;
  }>;
  deleteAt?: string | null;
};

const FIXED_MESSAGE = "24-7-playground";

export function CommunityUpdateForm() {
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

  const runUpdate = async () => {
    if (!wallet) {
      setStatus("Connect wallet first.");
      return;
    }
    if (!selectedId) {
      setStatus("Select a community.");
      return;
    }
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setStatus("MetaMask not detected.");
      return;
    }
    setBusy(true);
    setStatus("Checking for updates...");
    try {
      const signature = (await ethereum.request({
        method: "personal_sign",
        params: [FIXED_MESSAGE, wallet],
      })) as string;
      const res = await fetch("/api/contracts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityId: selectedId, signature }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Update failed");
      }
      setStatus(
        data.updated
          ? `Update thread created (1 thread, ${Number(data.changedContractCount || 1)} contract${Number(data.changedContractCount || 1) === 1 ? "" : "s"} changed).`
          : "No updates found."
      );
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
                  {community.slug} ·{" "}
                  {community.contracts.length === 1
                    ? `${community.contracts[0].chain} · ${community.contracts[0].address.slice(0, 10)}…`
                    : `${community.contracts.length} contracts`}
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
      {status ? <div className="status">{status}</div> : null}
      {selectedId ? (
        <Button
          label={busy ? "Working..." : "Check for Update"}
          type="button"
          onClick={runUpdate}
          variant="secondary"
        />
      ) : null}
    </div>
  );
}
