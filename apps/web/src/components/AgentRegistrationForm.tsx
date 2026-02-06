"use client";

import { useState } from "react";
import { SiweMessage } from "siwe";
import { getAddress } from "ethers";
import { Button, Field } from "@abtp/sns";

export function AgentRegistrationForm() {
  const [handle, setHandle] = useState("");
  const [wallet, setWallet] = useState("");
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

  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus("MetaMask not detected.");
      return;
    }
    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];
    setWallet(normalizeAddress(accounts[0]));
  };

  const registerAgent = async () => {
    if (!handle) {
      setStatus("Handle is required.");
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
    setStatus("Registering agent...");

    try {
      const registerRes = await fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });

      if (!registerRes.ok) {
        const errText = await registerRes.text();
        throw new Error(errText || "Registration failed");
      }

      const { agent, claim } = await registerRes.json();
      const chainIdHex = (await ethProvider.request({
        method: "eth_chainId",
      })) as string;
      const chainId = Number.parseInt(chainIdHex, 16) || 1;

      const message = new SiweMessage({
        domain: window.location.host.split(":")[0],
        address: normalizeAddress(wallet),
        statement: "Claim agent ownership for Agentic Beta Testing.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce: claim.nonce,
      }).prepareMessage();

      let signature: string;
      try {
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

      const claimRes = await fetch("/api/agents/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, message, signature }),
      });

      if (!claimRes.ok) {
        const errText = await claimRes.text();
        throw new Error(errText || "Claim failed");
      }

      const claimData = await claimRes.json();
      if (claimData.apiKey) {
        setApiKey(claimData.apiKey);
      }
      setStatus("Agent verified successfully.");
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

  const toggleActive = async (nextActive: boolean) => {
    if (!apiKey) {
      setStatus("API key required to toggle agent state.");
      return;
    }

    setStatus(nextActive ? "Reactivating agent..." : "Deactivating agent...");

    const res = await fetch("/api/agents/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-agent-key": apiKey,
      },
      body: JSON.stringify({ isActive: nextActive }),
    });

    if (!res.ok) {
      const errText = await res.text();
      setStatus(errText || "Toggle failed");
      return;
    }

    setStatus(nextActive ? "Agent reactivated." : "Agent deactivated.");
  };

  return (
    <form
      className="form"
      onSubmit={(event) => {
        event.preventDefault();
        void registerAgent();
      }}
    >
      <Field
        label="Agent Handle"
        placeholder="alpha-scout-07"
        onChange={(event) => setHandle(event.currentTarget.value)}
      />
      <div className="field">
        <label>Wallet Signature</label>
        <div className="row">
          <input placeholder="0x..." value={wallet} readOnly />
          <Button
            label="Connect & Sign"
            variant="secondary"
            type="button"
            onClick={connectWallet}
          />
        </div>
      </div>
      <div className="status">{status}</div>
      {apiKey ? (
        <div className="api-key">
          <p>API Key (store this now):</p>
          <code>{apiKey}</code>
          <div className="row">
            <Button
              label="Deactivate"
              variant="secondary"
              type="button"
              onClick={() => toggleActive(false)}
            />
            <Button
              label="Reactivate"
              variant="secondary"
              type="button"
              onClick={() => toggleActive(true)}
            />
          </div>
        </div>
      ) : null}
      <Button label={busy ? "Working..." : "Register & Verify"} type="submit" />
    </form>
  );
}
