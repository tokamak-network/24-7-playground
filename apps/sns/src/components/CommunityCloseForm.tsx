"use client";

import { useEffect, useMemo, useState } from "react";
import { getAddress } from "ethers";
import { Button } from "src/components/ui";
import {
  invalidateOwnedCommunitiesCache,
  readOwnedCommunitiesCache,
  writeOwnedCommunitiesCache,
} from "src/lib/ownedCommunitiesCache";

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

function resolveTargetCommunityId(
  items: OwnedCommunity[],
  preferredCommunityId?: string
) {
  if (preferredCommunityId) {
    return items.some((community) => community.id === preferredCommunityId)
      ? preferredCommunityId
      : "";
  }
  return items[0]?.id || "";
}

type Props = {
  initialCommunityId?: string;
  initialWalletAddress?: string;
  onClosed?: (payload: { communityId: string; deleteAt: string | null }) => void;
};

export function CommunityCloseForm({
  initialCommunityId,
  initialWalletAddress,
  onClosed,
}: Props = {}) {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [communities, setCommunities] = useState<OwnedCommunity[]>([]);
  const [busy, setBusy] = useState(false);
  const [isLoadingOwned, setIsLoadingOwned] = useState(false);
  const targetCommunityId = useMemo(
    () => resolveTargetCommunityId(communities, initialCommunityId),
    [communities, initialCommunityId]
  );
  const targetCommunity = useMemo(
    () => communities.find((community) => community.id === targetCommunityId) || null,
    [communities, targetCommunityId]
  );

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
    const normalizedWallet = walletAddress.toLowerCase();
    const cached = readOwnedCommunitiesCache<OwnedCommunity[]>("owned", normalizedWallet);
    if (cached) {
      setCommunities(cached);
      if (cached.length === 0) {
        setStatus("No active communities owned by this wallet.");
      } else {
        const targetCommunityId = resolveTargetCommunityId(cached, initialCommunityId);
        setStatus(
          targetCommunityId
            ? ""
            : "The selected community could not be loaded for this wallet."
        );
      }
      return;
    }

    setIsLoadingOwned(true);
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
      const active: OwnedCommunity[] = (data.communities || []).filter(
        (c: OwnedCommunity) => c.status !== "CLOSED"
      );
      writeOwnedCommunitiesCache("owned", normalizedWallet, active);
      setCommunities(active);
      if (active.length === 0) {
        setStatus("No active communities owned by this wallet.");
      } else {
        const targetCommunityId = resolveTargetCommunityId(active, initialCommunityId);
        setStatus(
          targetCommunityId
            ? ""
            : "The selected community could not be loaded for this wallet."
        );
      }
    } catch (error) {
      setCommunities([]);
      setStatus(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setIsLoadingOwned(false);
    }
  };

  useEffect(() => {
    if (!wallet && initialWalletAddress) {
      setWallet(normalizeAddress(initialWalletAddress));
    }
  }, [initialWalletAddress, wallet]);

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
    if (!targetCommunity) {
      setStatus("The selected community could not be loaded.");
      return;
    }
    const confirm = window.prompt(
      `Closing this community will revoke all API keys immediately and delete the community after 14 days.\n\nType the community name to confirm:\n${targetCommunity.name}`
    );
    if (confirm === null || !confirm.trim()) {
      setStatus("Community name confirmation is required.");
      return;
    }
    if (
      normalizeConfirmName(confirm) !== normalizeConfirmName(targetCommunity.name)
    ) {
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
          communityId: targetCommunityId,
          signature,
          confirmName: confirm.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Close failed");
      }
      setStatus("Community closed. Deletion scheduled.");
      invalidateOwnedCommunitiesCache(wallet);
      if (onClosed) {
        onClosed({
          communityId: targetCommunityId,
          deleteAt: typeof data?.deleteAt === "string" ? data.deleteAt : null,
        });
        return;
      }
      setCommunities((prev) => prev.filter((community) => community.id !== targetCommunityId));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form">
      <div className="field">
        <label>Target Community</label>
        {wallet ? (
          targetCommunity ? (
            <input
              readOnly
              value={`${targetCommunity.name} (${targetCommunity.slug})`}
            />
          ) : (
            <div>The selected community could not be loaded for this wallet.</div>
          )
        ) : (
          <div>Connect MetaMask to load community data.</div>
        )}
      </div>
      <div className="status">
        Closing a community revokes API keys immediately and schedules deletion
        in 14 days.
      </div>
      <div className="row wrap">
        <Button
          label={isLoadingOwned ? "Loading..." : busy ? "Closing..." : "Close Community"}
          type="button"
          onClick={() => void closeCommunity()}
          disabled={isLoadingOwned || busy || !wallet || !targetCommunity}
        />
      </div>
      {status ? <div className="status">{status}</div> : null}
    </div>
  );
}
