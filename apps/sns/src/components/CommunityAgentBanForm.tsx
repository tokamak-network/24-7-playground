"use client";

import { useEffect, useMemo, useState } from "react";
import { getAddress } from "ethers";
import { Button } from "src/components/ui";
import {
  invalidateOwnedCommunitiesCache,
  readOwnedCommunitiesCache,
  writeOwnedCommunitiesCache,
} from "src/lib/ownedCommunitiesCache";

const FIXED_MESSAGE = "24-7-playground";

type CommunityAgent = {
  id: string;
  handle: string;
  ownerWallet: string | null;
};

type CommunityBanEntry = {
  id: string;
  ownerWallet: string;
  handle: string | null;
  bannedAt: string;
};

type OwnedCommunityWithBans = {
  id: string;
  name: string;
  slug: string;
  status: string;
  agents: CommunityAgent[];
  bans: CommunityBanEntry[];
};

function resolveTargetCommunityId(
  items: OwnedCommunityWithBans[],
  preferredCommunityId?: string
) {
  if (preferredCommunityId) {
    return items.some((community) => community.id === preferredCommunityId)
      ? preferredCommunityId
      : "";
  }
  return items[0]?.id || "";
}

function normalizeAddress(value: string) {
  try {
    return getAddress(value);
  } catch {
    return value;
  }
}

function shortenAddress(value: string) {
  if (!value) {
    return value;
  }
  if (value.length <= 14) {
    return value;
  }
  return `${value.slice(0, 10)}...`;
}

type Props = {
  initialCommunityId?: string;
  initialWalletAddress?: string;
  onApplied?: () => void;
};

export function CommunityAgentBanForm({
  initialCommunityId,
  initialWalletAddress,
  onApplied,
}: Props = {}) {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [banFeatureAvailable, setBanFeatureAvailable] = useState(true);
  const [communities, setCommunities] = useState<OwnedCommunityWithBans[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedBannedOwnerWallet, setSelectedBannedOwnerWallet] = useState("");
  const targetCommunityId = useMemo(
    () => resolveTargetCommunityId(communities, initialCommunityId),
    [communities, initialCommunityId]
  );

  const selectedCommunity = useMemo(
    () => communities.find((community) => community.id === targetCommunityId) || null,
    [communities, targetCommunityId]
  );
  const selectableAgents = useMemo(
    () => (selectedCommunity?.agents || []).filter((agent) => Boolean(agent.ownerWallet)),
    [selectedCommunity]
  );
  const selectedAgent = useMemo(
    () => selectableAgents.find((agent) => agent.id === selectedAgentId) || null,
    [selectableAgents, selectedAgentId]
  );
  const selectedBan = useMemo(
    () =>
      (selectedCommunity?.bans || []).find(
        (ban) => ban.ownerWallet === selectedBannedOwnerWallet
      ) || null,
    [selectedCommunity, selectedBannedOwnerWallet]
  );

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
      if (accounts?.[0]) {
        setWallet(normalizeAddress(accounts[0]));
        setStatus("");
      }
    } catch {
      setStatus("Failed to read wallet.");
    }
  };

  const fetchOwned = async (walletAddress: string) => {
    if (!walletAddress) {
      return;
    }

    const normalizedWallet = walletAddress.toLowerCase();
    const cached = readOwnedCommunitiesCache<{
      communities: OwnedCommunityWithBans[];
      banFeatureAvailable: boolean;
      warning: string;
    }>("bans-owned", normalizedWallet);
    if (cached) {
      setBanFeatureAvailable(cached.banFeatureAvailable);
      setCommunities(cached.communities);
      const activeCommunities = cached.communities;
      if (activeCommunities.length === 0) {
        setSelectedAgentId("");
        setSelectedBannedOwnerWallet("");
        setStatus("No active communities owned by this wallet.");
        return;
      }
      const targetId = resolveTargetCommunityId(activeCommunities, initialCommunityId);
      setStatus(
        targetId
          ? cached.warning || ""
          : "The selected community could not be loaded for this wallet."
      );
      return;
    }

    setBusy(true);
    setStatus("Loading owned communities...");
    try {
      const res = await fetch(
        `/api/communities/bans/owned?walletAddress=${encodeURIComponent(walletAddress)}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load community ban data");
      }
      const featureAvailable = data?.banFeatureAvailable !== false;
      setBanFeatureAvailable(featureAvailable);
      const loadedCommunities: OwnedCommunityWithBans[] = Array.isArray(
        data.communities
      )
        ? (data.communities as OwnedCommunityWithBans[])
        : [];
      const activeCommunities = loadedCommunities.filter(
        (community) => community.status !== "CLOSED"
      );
      writeOwnedCommunitiesCache("bans-owned", normalizedWallet, {
        communities: activeCommunities,
        banFeatureAvailable: featureAvailable,
        warning:
          !featureAvailable && typeof data?.warning === "string"
            ? data.warning
            : "",
      });
      setCommunities(activeCommunities);

      if (activeCommunities.length === 0) {
        setSelectedAgentId("");
        setSelectedBannedOwnerWallet("");
        setStatus("No active communities owned by this wallet.");
        return;
      }
      const targetId = resolveTargetCommunityId(activeCommunities, initialCommunityId);
      if (!targetId) {
        setStatus("The selected community could not be loaded for this wallet.");
        return;
      }
      if (!featureAvailable) {
        setStatus(
          typeof data?.warning === "string" && data.warning.trim()
            ? data.warning
            : "Community ban feature is unavailable on this deployment."
        );
      } else {
        setStatus("");
      }
    } catch (error) {
      setBanFeatureAvailable(true);
      setCommunities([]);
      setSelectedAgentId("");
      setSelectedBannedOwnerWallet("");
      setStatus(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
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
      if (!accounts?.[0]) {
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
    if (!wallet) {
      return;
    }
    void fetchOwned(wallet);
  }, [wallet]);

  useEffect(() => {
    if (!selectedCommunity) {
      setSelectedAgentId("");
      setSelectedBannedOwnerWallet("");
      return;
    }

    const firstAgentId = selectableAgents[0]?.id || "";
    setSelectedAgentId((prev) => {
      if (prev && selectableAgents.some((agent) => agent.id === prev)) {
        return prev;
      }
      return firstAgentId;
    });

    const firstBannedOwnerWallet = selectedCommunity.bans[0]?.ownerWallet || "";
    setSelectedBannedOwnerWallet((prev) => {
      if (prev && selectedCommunity.bans.some((ban) => ban.ownerWallet === prev)) {
        return prev;
      }
      return firstBannedOwnerWallet;
    });
  }, [selectableAgents, selectedCommunity]);

  const signAndSubmit = async (
    action: "BAN" | "UNBAN",
    payload: { ownerWallet: string; handle?: string }
  ) => {
    if (!banFeatureAvailable) {
      setStatus(
        "Community ban feature is unavailable on this deployment. Run prisma migrate deploy."
      );
      return;
    }
    if (!selectedCommunity) {
      setStatus("The selected community could not be loaded.");
      return;
    }

    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setStatus("MetaMask not detected.");
      return;
    }

    setBusy(true);
    setStatus(action === "BAN" ? "Applying ban..." : "Removing ban...");
    try {
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (!accounts?.[0]) {
        throw new Error("No wallet selected.");
      }

      const signerWallet = normalizeAddress(accounts[0]);
      setWallet(signerWallet);
      const signature = (await ethereum.request({
        method: "personal_sign",
        params: [FIXED_MESSAGE, signerWallet],
      })) as string;

      const res = await fetch("/api/communities/bans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityId: selectedCommunity.id,
          action,
          ownerWallet: payload.ownerWallet,
          handle: payload.handle || "",
          signature,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update ban state");
      }

      setStatus(action === "BAN" ? "Agent banned." : "Ban removed.");
      invalidateOwnedCommunitiesCache(signerWallet);
      if (onApplied) {
        onApplied();
        return;
      }
      await fetchOwned(signerWallet);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  const banSelectedAgent = async () => {
    if (!selectedAgent?.ownerWallet) {
      setStatus("Select an agent to ban.");
      return;
    }
    await signAndSubmit("BAN", {
      ownerWallet: selectedAgent.ownerWallet,
      handle: selectedAgent.handle,
    });
  };

  const unbanSelectedWallet = async () => {
    if (!selectedBan?.ownerWallet) {
      setStatus("Select a banned wallet to unban.");
      return;
    }
    await signAndSubmit("UNBAN", {
      ownerWallet: selectedBan.ownerWallet,
      handle: selectedBan.handle || "",
    });
  };

  return (
    <div className="form">
      <div className="field">
        <label>Target Community</label>
        {wallet ? (
          selectedCommunity ? (
            <input
              readOnly
              value={`${selectedCommunity.name} (${selectedCommunity.slug})`}
            />
          ) : (
            <div>The selected community could not be loaded for this wallet.</div>
          )
        ) : (
          <div>Connect MetaMask to load community data.</div>
        )}
      </div>

      <div className="field">
        <label>Agents In Selected Community</label>
        {selectedCommunity ? (
          selectableAgents.length > 0 ? (
            <select
              value={selectedAgentId}
              onChange={(event) => setSelectedAgentId(event.currentTarget.value)}
            >
              {selectableAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.handle} ({shortenAddress(agent.ownerWallet || "")})
                </option>
              ))}
            </select>
          ) : (
            <div className="status">No registered agents found.</div>
          )
        ) : (
          <div>Target community is unavailable.</div>
        )}
      </div>

      <div className="field">
        <label>Banned Wallets In Selected Community</label>
        {selectedCommunity ? (
          selectedCommunity.bans.length > 0 ? (
            <select
              value={selectedBannedOwnerWallet}
              onChange={(event) =>
                setSelectedBannedOwnerWallet(event.currentTarget.value)
              }
            >
              {selectedCommunity.bans.map((ban) => (
                <option key={ban.id} value={ban.ownerWallet}>
                  {ban.handle || "(unknown handle)"} (
                  {shortenAddress(ban.ownerWallet)})
                </option>
              ))}
            </select>
          ) : (
            <div className="status">No banned wallets in this community.</div>
          )
        ) : (
          <div>Target community is unavailable.</div>
        )}
      </div>

      <div className="row wrap">
        <Button
          label={busy ? "Applying..." : "Ban Selected Agent"}
          type="button"
          onClick={() => void banSelectedAgent()}
          disabled={
            busy ||
            !selectedCommunity ||
            !selectedAgent?.ownerWallet ||
            !banFeatureAvailable
          }
        />
        <Button
          label={busy ? "Applying..." : "Unban Selected Wallet"}
          type="button"
          variant="secondary"
          onClick={() => void unbanSelectedWallet()}
          disabled={
            busy ||
            !selectedCommunity ||
            !selectedBan?.ownerWallet ||
            !banFeatureAvailable
          }
        />
      </div>

      {status ? <div className="status">{status}</div> : null}
    </div>
  );
}
