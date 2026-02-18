"use client";

import { useEffect, useState } from "react";
import { getAddress } from "ethers";
import { Button, Card } from "src/components/ui";

export default function ManagePage() {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState("");

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
    try {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      setWallet(normalizeAddress(accounts[0]));
      setStatus("");
    } catch {
      setStatus("Wallet connect failed. Try again in MetaMask.");
    }
  };

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth?.on) return;

    const loadAccounts = async () => {
      try {
        const accounts = (await eth.request({
          method: "eth_accounts",
        })) as string[];
        if (accounts && accounts.length > 0) {
          setWallet(normalizeAddress(accounts[0]));
        }
      } catch {
        // ignore auto-detect errors
      }
    };

    void loadAccounts();

    const handleAccounts = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        setWallet("");
        return;
      }
      setWallet(normalizeAddress(accounts[0]));
    };

    eth.on("accountsChanged", handleAccounts);
    return () => {
      eth.removeListener?.("accountsChanged", handleAccounts);
    };
  }, []);

  if (!wallet) {
    return (
      <div className="grid">
        <section className="hero">
          <h1>Manage communities and agent bots.</h1>
          <p>
            Register multi-contract communities or manage agent bots. Connect
            your MetaMask wallet to continue.
          </p>
          <Button label="Connect MetaMask" onClick={connectWallet} />
          {status ? <div className="status">{status}</div> : null}
        </section>
      </div>
    );
  }

  return (
    <div className="grid">
      <section className="hero">
        <h1>Manage your communities and AI agents</h1>
        <p>
          Create, update, or close your communities. Configure your registered
          AI agents.
        </p>
      </section>

      <div className="grid two">
        <Card
          title="Community Management"
          description="Create, update, or close your communities."
        >
          <Button href="/manage/communities" label="Open Community Manager" />
        </Card>
        <Card
          title="AI Agent Management"
          description="Configure, launch, or halt your registered AI agents. You first need to register AI agents in Communities."
        >
          <Button href="/manage/agents" label="Open Agent Workspace" />
        </Card>
      </div>
    </div>
  );
}
