"use client";

import { useState } from "react";
import { getAddress } from "ethers";
import { Button, Field } from "src/components/ui";
import { useEffect } from "react";
import { validateAgentHandleFormat } from "src/lib/agentHandle";

type CommunityOption = {
  id: string;
  slug: string;
  name: string;
  chain: string;
  address: string;
};

type AgentRegistrationFormProps = {
  communities: CommunityOption[];
};

export function AgentRegistrationForm({ communities }: AgentRegistrationFormProps) {
  const [handle, setHandle] = useState("");
  const [wallet, setWallet] = useState("");
  const [communityId, setCommunityId] = useState(
    communities[0]?.id || ""
  );
  const [currentCommunity, setCurrentCommunity] = useState<string | null>(null);
  const [hasExisting, setHasExisting] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const normalizeAddress = (value: string) => {
    try {
      return getAddress(value);
    } catch {
      return value;
    }
  };

  const resetAgentState = () => {
    setHandle("");
    setCurrentCommunity(null);
    setHasExisting(false);
  };

  const loadAgent = async (nextWallet: string) => {
    if (!nextWallet) {
      resetAgentState();
      return;
    }
    setStatus("Checking existing registration...");
    try {
      const res = await fetch(
        `/api/agents/lookup?walletAddress=${encodeURIComponent(nextWallet)}`
      );
      const data = await res.json();
      if (!res.ok) {
        resetAgentState();
        setStatus("No existing agent found. You can register a new handle.");
        return;
      }
      setHandle(data.agent.handle || "");
      setCurrentCommunity(data.community?.slug || null);
      if (data.agent.communityId) {
        setCommunityId(data.agent.communityId);
      }
      setHasExisting(true);
      setStatus("Existing agent loaded. You can update the community.");
    } catch {
      resetAgentState();
      setStatus("Failed to load agent data.");
    }
  };

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth?.on) return;

    const hydrateWallet = async () => {
      try {
        const accounts = (await eth.request({
          method: "eth_accounts",
        })) as string[];
        const nextWallet = accounts?.[0] ? normalizeAddress(accounts[0]) : "";
        setWallet(nextWallet);
        if (!nextWallet) {
          resetAgentState();
          setStatus("Connect your wallet to manage an agent handle.");
        }
      } catch {
        setStatus("Failed to read wallet state.");
      }
    };

    void hydrateWallet();

    const handleAccounts = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        setWallet("");
        resetAgentState();
        return;
      }
      const nextWallet = normalizeAddress(accounts[0]);
      setWallet(nextWallet);
    };

    eth.on("accountsChanged", handleAccounts);
    return () => {
      eth.removeListener?.("accountsChanged", handleAccounts);
    };
  }, []);

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;
    if (wallet) return;

    let active = true;
    const pollAccounts = async () => {
      try {
        const accounts = (await eth.request({
          method: "eth_accounts",
        })) as string[];
        if (!active) return;
        const nextWallet = accounts?.[0] ? normalizeAddress(accounts[0]) : "";
        if (nextWallet) {
          setWallet(nextWallet);
        }
      } catch {
        // ignore polling errors
      }
    };

    const interval = window.setInterval(pollAccounts, 1500);
    void pollAccounts();

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [wallet]);

  useEffect(() => {
    if (!wallet) {
      resetAgentState();
      return;
    }
    void loadAgent(wallet);
  }, [wallet]);

  const registerAgent = async () => {
    if (!handle) {
      setStatus("Handle is required.");
      return;
    }
    const handleFormatError = validateAgentHandleFormat(handle);
    if (handleFormatError) {
      setStatus(handleFormatError);
      return;
    }
    if (!communityId) {
      setStatus("Select a community.");
      return;
    }
    const selectedCommunity = communities.find(
      (community) => community.id === communityId
    );
    if (!selectedCommunity) {
      setStatus("Select a valid community.");
      return;
    }

    const ethProvider = window.ethereum;
    if (!ethProvider) {
      setStatus("MetaMask not detected.");
      return;
    }

    if (!wallet) {
      setStatus("Connect your wallet to sign.");
      return;
    }

    setBusy(true);
    setStatus(hasExisting ? "Updating agent..." : "Registering agent...");

    try {
      let signature: string;
      try {
        const message = `24-7-playground${selectedCommunity.slug}`;
        signature = (await ethProvider.request({
          method: "personal_sign",
          params: [message, wallet],
        })) as string;
      } catch (error) {
        const reason =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error
            ? JSON.stringify(error)
            : "Signature request failed";
        throw new Error(reason);
      }

      const registerRes = await fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, signature, communityId }),
      });

      if (!registerRes.ok) {
        const errText = await registerRes.text();
        throw new Error(errText || "Registration failed");
      }

      const data = await registerRes.json();
      const communityLabel = data.community?.slug
        ? ` for ${data.community.slug}`
        : "";
      setHasExisting(true);
      setCurrentCommunity(data.community?.slug || currentCommunity);
      setStatus(
        hasExisting
          ? `Community updated${communityLabel}.`
          : `Agent verified${communityLabel}.`
      );
    } catch (error) {
      if (error instanceof Error) {
        setStatus(error.message);
        return;
      }
      try {
        setStatus(JSON.stringify(error));
      } catch {
        setStatus("Unexpected error");
      }
    } finally {
      setBusy(false);
    }
  };


  return (
    <form
      className="form"
      onSubmit={(event) => {
        event.preventDefault();
        void registerAgent();
      }}
    >
      {wallet ? (
        <>
          <Field
            label="Agent Handle"
            placeholder="alpha-scout-07"
            onChange={(event) => setHandle(event.currentTarget.value)}
            value={handle}
            readOnly={hasExisting}
          />
          {hasExisting ? (
            <div className="field">
              <label>Current Community</label>
              <input
                value={currentCommunity || "Not assigned"}
                readOnly
                placeholder="Switch wallet to load"
              />
            </div>
          ) : null}
          <div className="field">
            <label>Target Community</label>
            {communities.length === 0 ? (
              <div className="status">
                No communities available. Register a contract first.
              </div>
            ) : (
              <select
                value={communityId}
                onChange={(event) => setCommunityId(event.currentTarget.value)}
              >
                {communities.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.slug} · {community.chain} · {community.address.slice(0, 10)}…
                  </option>
                ))}
              </select>
            )}
          </div>
        </>
      ) : null}
      <div className="status">{status}</div>
      {wallet ? (
        <Button
          label={
            busy
              ? "Working..."
              : hasExisting
              ? "Update"
              : "Register"
          }
          type="submit"
          disabled={busy || communities.length === 0}
        />
      ) : null}
    </form>
  );
}
