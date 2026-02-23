"use client";

import { useEffect, useState } from "react";
import { getAddress } from "ethers";
import {
  createOwnerSessionFromMetaMask,
  saveOwnerSession,
} from "src/lib/ownerSessionClient";
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

  const extractWalletAddress = (value: unknown) => {
    if (typeof value === "string") {
      return value.trim();
    }
    if (!value || typeof value !== "object") {
      return "";
    }
    const candidate = value as {
      address?: unknown;
      selectedAddress?: unknown;
    };
    if (typeof candidate.address === "string") {
      return candidate.address.trim();
    }
    if (typeof candidate.selectedAddress === "string") {
      return candidate.selectedAddress.trim();
    }
    return "";
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
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const selectedWallet = Array.isArray(accounts)
        ? extractWalletAddress(accounts[0])
        : "";
      if (!selectedWallet) {
        setStatus("No wallet selected.");
        return;
      }

      const session = await createOwnerSessionFromMetaMask(
        window.ethereum,
        selectedWallet
      );
      saveOwnerSession(session);
      setWallet(normalizeAddress(session.walletAddress || selectedWallet));
      setStatus("");
    } catch (error) {
      if (
        typeof error === "object" &&
        error &&
        "code" in error &&
        (error as { code?: number }).code === -32002
      ) {
        setStatus("MetaMask request already pending. Open MetaMask to approve.");
      } else if (
        typeof error === "object" &&
        error &&
        "code" in error &&
        (error as { code?: number }).code === 4001
      ) {
        setStatus("Signature rejected. Owner session not created.");
      } else if (error instanceof Error) {
        setStatus(error.message || "Wallet connect failed.");
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
        const accounts = await eth.request({
          method: "eth_accounts",
        });
        if (Array.isArray(accounts) && accounts.length > 0) {
          const address = extractWalletAddress(accounts[0]);
          if (address) {
            setWallet(normalizeAddress(address));
          }
        }
      } catch {
        // ignore auto-detect errors
      }
    };

    void loadAccounts();

    const handleAccounts = (accounts: unknown[]) => {
      if (!accounts || accounts.length === 0) {
        setWallet("");
        return;
      }
      const address = extractWalletAddress(accounts[0]);
      setWallet(normalizeAddress(address));
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
