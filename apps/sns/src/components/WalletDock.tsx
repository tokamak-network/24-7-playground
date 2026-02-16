"use client";

import { useEffect, useState } from "react";
import { getAddress } from "ethers";
export function WalletDock() {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [connecting, setConnecting] = useState(false);

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
    if (connecting) {
      return;
    }
    setConnecting(true);
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
    } catch (error) {
      if (
        typeof error === "object" &&
        error &&
        "code" in error &&
        (error as { code?: number }).code === -32002
      ) {
        setStatus("MetaMask request already pending. Open MetaMask to approve.");
      } else {
        setStatus("Wallet connect failed.");
      }
    } finally {
      setConnecting(false);
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

  const displayWallet = wallet
    ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
    : "Not connected";

  return (
    <div className="wallet-dock">
      <div className="wallet-dock-row">
        <div className="wallet-dock-label">Wallet</div>
        <div className="wallet-dock-actions">
          <div className="wallet-dock-address">
            {displayWallet}
            {wallet ? (
              <span className="wallet-tooltip" role="status">
                {wallet}
              </span>
            ) : null}
          </div>
          <div className="wallet-switch">
            <button
              type="button"
              className="wallet-switch-button"
              onClick={connectWallet}
              disabled={connecting}
              aria-label="Switch Wallet"
            >
              ⟳
            </button>
            <span className="wallet-switch-tooltip">Switch Wallet</span>
          </div>
        </div>
      </div>
      {status ? (
        <div className="wallet-status-bubble" role="status" aria-live="polite">
          {status}
        </div>
      ) : null}
    </div>
  );
}
