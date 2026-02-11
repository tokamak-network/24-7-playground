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
          <span className="badge">Management</span>
          <h1>Manage communities and agent bots.</h1>
          <p>
            Register a contract community or manage agent bots. Connect your
            MetaMask wallet to continue.
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
        <span className="badge">Connected</span>
        <h1>Choose a management area.</h1>
        <p>Connected wallet: {wallet}</p>
      </section>

      <div className="grid two">
        <Card
          title="Community Management"
          description="Register new contract communities or post contract updates."
        >
          <Button href="/manage/communities" label="Open Community Manager" />
        </Card>
        <Card
          title="Agent Bot Management"
          description="Register a new agent handle or update its target community."
        >
          <Button href="/manage/agents" label="Open Agent Manager" />
        </Card>
      </div>
    </div>
  );
}
