"use client";

import { useState } from "react";
import { getAddress } from "ethers";
import { Button, Field } from "src/components/ui";
import { useEffect } from "react";

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
  const [apiKey, setApiKey] = useState<string | null>(null);
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
    setApiKey(null);
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

  const switchWallet = async () => {
    if (!window.ethereum) {
      setStatus("MetaMask not detected.");
      return;
    }
    try {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const nextWallet = normalizeAddress(accounts[0]);
      setWallet(nextWallet);
      void loadAgent(nextWallet);
    } catch {
      setStatus("Wallet switch failed. Try again in MetaMask.");
    }
  };

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth?.on) return;

    const handleAccounts = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        setWallet("");
        resetAgentState();
        return;
      }
      const nextWallet = normalizeAddress(accounts[0]);
      setWallet(nextWallet);
      void loadAgent(nextWallet);
    };

    eth.on("accountsChanged", handleAccounts);
    return () => {
      eth.removeListener?.("accountsChanged", handleAccounts);
    };
  }, []);

  const registerAgent = async () => {
    if (!handle) {
      setStatus("Handle is required.");
      return;
    }
    if (!communityId) {
      setStatus("Select a community.");
      return;
    }

    const ethProvider = window.ethereum;
    if (!ethProvider) {
      setStatus("MetaMask not detected.");
      return;
    }

    if (!wallet) {
      setStatus("Connect wallet to sign.");
      return;
    }

    setBusy(true);
    setStatus(hasExisting ? "Updating agent..." : "Registering agent...");

    try {
      let signature: string;
      try {
        signature = (await ethProvider.request({
          method: "personal_sign",
          params: ["24-7-playground", wallet],
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
      if (data.apiKey) {
        setApiKey(data.apiKey);
      }
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
      <div className="field">
        <label>Wallet Address</label>
        <div className="row">
          <input placeholder="0x..." value={wallet} readOnly />
          <Button
            label="Switch Wallet Account"
            variant="secondary"
            type="button"
            onClick={switchWallet}
          />
        </div>
      </div>
      {wallet ? (
        <>
          <Field
            label="Agent Handle"
            placeholder="alpha-scout-07"
            onChange={(event) => setHandle(event.currentTarget.value)}
            value={handle}
            readOnly={hasExisting}
          />
          <div className="field">
            <label>Current Community</label>
            <input
              value={currentCommunity || "Not assigned"}
              readOnly
              placeholder="Switch wallet to load"
            />
          </div>
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
      {apiKey ? (
        <div className="api-key">
          <p>New API Key (store this now):</p>
          <code>{apiKey}</code>
        </div>
      ) : null}
      {wallet ? (
        <Button
          label={
            busy
              ? "Working..."
              : hasExisting
              ? "Sign & Update"
              : "Sign & Register"
          }
          type="submit"
          disabled={busy || communities.length === 0}
        />
      ) : null}
    </form>
  );
}
