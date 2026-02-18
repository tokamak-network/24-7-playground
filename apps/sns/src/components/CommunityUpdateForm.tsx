"use client";

import { useEffect, useMemo, useState } from "react";
import { getAddress } from "ethers";
import { Button } from "src/components/ui";

type OwnedCommunity = {
  id: string;
  name: string;
  slug: string;
  status: string;
  description?: string | null;
  contracts: Array<{
    id: string;
    name: string;
    chain: string;
    address: string;
  }>;
};

type UpdatePurpose =
  | "UPDATE_DESCRIPTION"
  | "UPDATE_CONTRACT"
  | "REMOVE_CONTRACT"
  | "ADD_CONTRACT";

const PURPOSE_OPTIONS: Array<{ value: UpdatePurpose; label: string }> = [
  { value: "UPDATE_DESCRIPTION", label: "Service Description" },
  { value: "UPDATE_CONTRACT", label: "Update Existing Contract" },
  { value: "REMOVE_CONTRACT", label: "Remove Existing Contract" },
  { value: "ADD_CONTRACT", label: "Add New Contract" },
];

const FIXED_MESSAGE = "24-7-playground";

function shortenAddress(value: string) {
  if (value.length <= 14) {
    return value;
  }
  return `${value.slice(0, 10)}...`;
}

export function CommunityUpdateForm() {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [communities, setCommunities] = useState<OwnedCommunity[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [purpose, setPurpose] = useState<UpdatePurpose>("UPDATE_DESCRIPTION");
  const [selectedContractId, setSelectedContractId] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [updateName, setUpdateName] = useState("");
  const [updateAddress, setUpdateAddress] = useState("");
  const [addName, setAddName] = useState("");
  const [addAddress, setAddAddress] = useState("");
  const [busy, setBusy] = useState(false);

  const normalizeAddress = (value: string) => {
    try {
      return getAddress(value);
    } catch {
      return value;
    }
  };

  const selectedCommunity = useMemo(
    () => communities.find((community) => community.id === selectedId) || null,
    [communities, selectedId]
  );

  const selectedContract = useMemo(
    () =>
      selectedCommunity?.contracts.find(
        (contract) => contract.id === selectedContractId
      ) || null,
    [selectedCommunity, selectedContractId]
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

  useEffect(() => {
    if (!selectedCommunity) {
      setSelectedContractId("");
      return;
    }

    if (purpose === "UPDATE_DESCRIPTION") {
      setDescriptionDraft(selectedCommunity.description || "");
      return;
    }

    if (purpose === "UPDATE_CONTRACT" || purpose === "REMOVE_CONTRACT") {
      const firstContractId = selectedCommunity.contracts[0]?.id || "";
      const contractExists = selectedCommunity.contracts.some(
        (contract) => contract.id === selectedContractId
      );
      if (!contractExists) {
        setSelectedContractId(firstContractId);
      }
    }
  }, [selectedCommunity, purpose, selectedContractId]);

  useEffect(() => {
    if (purpose !== "UPDATE_CONTRACT" || !selectedContract) {
      return;
    }

    setUpdateName(selectedContract.name);
    setUpdateAddress(selectedContract.address);
  }, [purpose, selectedContract]);

  const submit = async () => {
    if (!wallet) {
      setStatus("Connect wallet first.");
      return;
    }
    if (!selectedCommunity) {
      setStatus("Select a community.");
      return;
    }

    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setStatus("MetaMask not detected.");
      return;
    }

    const payload: Record<string, unknown> = {
      communityId: selectedCommunity.id,
      action: purpose,
    };

    if (purpose === "UPDATE_DESCRIPTION") {
      payload.description = descriptionDraft;
    }

    if (purpose === "UPDATE_CONTRACT") {
      if (!selectedContractId) {
        setStatus("Select a contract to update.");
        return;
      }
      if (!updateAddress.trim()) {
        setStatus("Contract address is required.");
        return;
      }
      payload.contractId = selectedContractId;
      payload.name = updateName.trim();
      payload.address = updateAddress.trim();
    }

    if (purpose === "REMOVE_CONTRACT") {
      if (!selectedContractId) {
        setStatus("Select a contract to remove.");
        return;
      }
      payload.contractId = selectedContractId;
    }

    if (purpose === "ADD_CONTRACT") {
      if (!addAddress.trim()) {
        setStatus("Contract address is required.");
        return;
      }
      payload.name = addName.trim();
      payload.address = addAddress.trim();
      payload.chain = "Sepolia";
    }

    setBusy(true);
    setStatus("Applying community update...");

    try {
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const walletAddress = accounts?.[0];
      if (!walletAddress) {
        setStatus("No wallet selected.");
        setBusy(false);
        return;
      }

      const signature = (await ethereum.request({
        method: "personal_sign",
        params: [FIXED_MESSAGE, walletAddress],
      })) as string;

      const res = await fetch("/api/contracts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, signature }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Update failed");
      }

      if (!data.updated) {
        setStatus(data.message || "No change applied.");
        return;
      }

      const actionLabel = PURPOSE_OPTIONS.find(
        (option) => option.value === purpose
      )?.label;
      const changedCount = Number(data.changedContractCount || 0);

      setStatus(
        `${actionLabel || "Update"} applied. SYSTEM thread was updated in-place and a SYSTEM comment was added${changedCount > 0 ? ` (${changedCount} contract change)` : ""}.`
      );

      await fetchOwned(normalizeAddress(walletAddress));

      if (purpose === "ADD_CONTRACT") {
        setAddName("");
        setAddAddress("");
      }
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
                  {community.slug} · {community.contracts.length} contract
                  {community.contracts.length === 1 ? "" : "s"}
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

      {selectedCommunity ? (
        <>
          <div className="field">
            <label>Update Purpose</label>
            <select
              value={purpose}
              onChange={(event) =>
                setPurpose(event.currentTarget.value as UpdatePurpose)
              }
            >
              {PURPOSE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {purpose === "UPDATE_DESCRIPTION" ? (
            <div className="field">
              <label>Service Description</label>
              <textarea
                placeholder="Describe your service"
                value={descriptionDraft}
                onChange={(event) => setDescriptionDraft(event.currentTarget.value)}
              />
            </div>
          ) : null}

          {purpose === "UPDATE_CONTRACT" || purpose === "REMOVE_CONTRACT" ? (
            <div className="field">
              <label>Existing Contract</label>
              <select
                value={selectedContractId}
                onChange={(event) =>
                  setSelectedContractId(event.currentTarget.value)
                }
              >
                {selectedCommunity.contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.name} · {shortenAddress(contract.address)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {purpose === "UPDATE_CONTRACT" ? (
            <div className="field">
              <label>Updated Contract Name</label>
              <input
                value={updateName}
                onChange={(event) => setUpdateName(event.currentTarget.value)}
                placeholder="Contract name"
              />
              <input
                value={updateAddress}
                onChange={(event) => setUpdateAddress(event.currentTarget.value)}
                placeholder="Contract address (0x...)"
              />
            </div>
          ) : null}

          {purpose === "ADD_CONTRACT" ? (
            <div className="field">
              <label>New Contract</label>
              <input
                value={addName}
                onChange={(event) => setAddName(event.currentTarget.value)}
                placeholder="Contract name (optional)"
              />
              <input
                value={addAddress}
                onChange={(event) => setAddAddress(event.currentTarget.value)}
                placeholder="Contract address (0x...)"
              />
            </div>
          ) : null}

          {status ? <div className="status">{status}</div> : null}

          <Button
            label={busy ? "Working..." : "Apply Update"}
            type="button"
            onClick={submit}
            variant="secondary"
            disabled={busy}
          />
        </>
      ) : null}
    </div>
  );
}
