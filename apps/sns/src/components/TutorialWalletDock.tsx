"use client";

import { getAddress } from "ethers";
import { useEffect, useState } from "react";
import { clearOwnerSession, saveOwnerSession } from "src/lib/ownerSessionClient";

function extractWalletAddress(value: unknown): string {
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
}

function normalizeAddress(value: string): string {
  try {
    return getAddress(value);
  } catch {
    return value;
  }
}

export function TutorialWalletDock() {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const applyConnectedWallet = (address: string) => {
    const normalized = normalizeAddress(address);
    setWallet(normalized);
    saveOwnerSession({
      walletAddress: normalized.toLowerCase(),
      token: `tutorial-session-${Date.now()}`,
    });
  };

  const connectWallet = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum?.request) {
      setStatus("MetaMask not detected.");
      return;
    }
    if (busy) return;

    setBusy(true);
    setStatus("");
    try {
      await ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as unknown;
      const address = Array.isArray(accounts)
        ? extractWalletAddress(accounts[0])
        : extractWalletAddress(accounts);
      if (!address) {
        setStatus("No wallet selected.");
        return;
      }
      applyConnectedWallet(address);
    } catch (error) {
      if (
        typeof error === "object" &&
        error &&
        "code" in error &&
        (error as { code?: number }).code === 4001
      ) {
        setStatus("Wallet request rejected.");
      } else {
        setStatus("Wallet connect failed.");
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum?.request) {
      return;
    }

    const syncAccounts = async () => {
      try {
        const accounts = (await ethereum.request({
          method: "eth_accounts",
        })) as unknown;
        const address = Array.isArray(accounts)
          ? extractWalletAddress(accounts[0])
          : extractWalletAddress(accounts);
        if (!address) {
          setWallet("");
          clearOwnerSession();
          return;
        }
        applyConnectedWallet(address);
      } catch {
        // Ignore passive wallet sync errors.
      }
    };

    void syncAccounts();
    const onAccountsChanged = (accounts: unknown[]) => {
      const address = Array.isArray(accounts)
        ? extractWalletAddress(accounts[0])
        : "";
      if (!address) {
        setWallet("");
        clearOwnerSession();
        return;
      }
      applyConnectedWallet(address);
    };
    ethereum.on?.("accountsChanged", onAccountsChanged);
    return () => {
      ethereum.removeListener?.("accountsChanged", onAccountsChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayWallet = wallet
    ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
    : "Not connected";

  return (
    <div className="wallet-dock">
      <div className="wallet-dock-row">
        <div className="wallet-dock-actions" data-tour="wallet-connect-area">
          <div className="wallet-dock-address">
            <span className="wallet-dock-address-main">
              <span className="wallet-metamask-icon" aria-hidden="true">
                <img
                  className="wallet-metamask-icon-image"
                  src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                  alt=""
                />
              </span>
              <span>{displayWallet}</span>
            </span>
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
              data-tour="wallet-connect"
              onClick={connectWallet}
              disabled={busy}
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
