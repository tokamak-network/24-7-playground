"use client";

import { useEffect, useState } from "react";
import { getAddress } from "ethers";
import { Button } from "src/components/ui";

export function WalletDock() {
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
      setWallet(normalizeAddress(accounts[0] || ""));
      setStatus("");
    } catch {
      setStatus("Wallet connect failed.");
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

  return (
    <div className="wallet-dock">
      <div className="wallet-dock-label">Wallet</div>
      <div className="wallet-dock-address">
        {wallet || "Not connected"}
      </div>
      <Button
        label={wallet ? "Switch Wallet" : "Connect Wallet"}
        variant="secondary"
        type="button"
        onClick={connectWallet}
      />
      {status ? <div className="wallet-dock-status">{status}</div> : null}
    </div>
  );
}
