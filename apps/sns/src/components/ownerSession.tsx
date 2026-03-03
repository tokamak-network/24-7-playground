"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearOwnerSession,
  createOwnerSessionFromMetaMask,
  getOwnerSessionEventName,
  loadOwnerSession,
  saveOwnerSession,
} from "src/lib/ownerSessionClient";

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

export function useOwnerSession() {
  const [walletAddress, setWalletAddress] = useState("");
  const [connectedWallet, setConnectedWallet] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  const ownerSessionEventName = getOwnerSessionEventName();

  const syncWithConnectedWallet = useCallback(async () => {
    if (typeof window === "undefined") {
      setSessionReady(true);
      return;
    }

    const session = loadOwnerSession();
    const ethereum = (window as any).ethereum;
    const clearLocalSession = () => {
      clearOwnerSession();
      setWalletAddress("");
      setToken("");
    };

    if (!session.token || !session.walletAddress) {
      setConnectedWallet("");
      setWalletAddress(session.walletAddress);
      setToken(session.token);
      setSessionReady(true);
      return;
    }

    if (!ethereum) {
      setConnectedWallet("");
      clearLocalSession();
      setSessionReady(true);
      return;
    }

    try {
      const accounts = (await ethereum.request({
        method: "eth_accounts",
      })) as unknown;
      const firstAccount = Array.isArray(accounts)
        ? extractWalletAddress(accounts[0])
        : "";
      const connectedWallet = firstAccount.toLowerCase();
      setConnectedWallet(connectedWallet);
      const sessionWallet = session.walletAddress.toLowerCase();

      if (!connectedWallet || connectedWallet !== sessionWallet) {
        clearLocalSession();
        setSessionReady(true);
        return;
      }

      setWalletAddress(session.walletAddress);
      setToken(session.token);
      setSessionReady(true);
    } catch {
      setConnectedWallet("");
      clearLocalSession();
      setSessionReady(true);
    }
  }, []);

  const refresh = useCallback(() => {
    const session = loadOwnerSession();
    setWalletAddress(session.walletAddress);
    setToken(session.token);
  }, []);

  useEffect(() => {
    refresh();
    syncWithConnectedWallet();

    const handler = () => {
      refresh();
      syncWithConnectedWallet();
    };

    window.addEventListener(ownerSessionEventName, handler);

    const ethereum = (window as any).ethereum;
    const accountHandler = () => {
      syncWithConnectedWallet();
    };
    if (ethereum?.on) {
      ethereum.on("accountsChanged", accountHandler);
    }

    return () => {
      window.removeEventListener(ownerSessionEventName, handler);
      if (ethereum?.removeListener) {
        ethereum.removeListener("accountsChanged", accountHandler);
      }
    };
  }, [ownerSessionEventName, refresh, syncWithConnectedWallet]);

  const signIn = useCallback(async () => {
    setStatus("");
    const ethereum = (window as any).ethereum;
    if (typeof window === "undefined" || !ethereum) {
      setStatus("MetaMask is required.");
      return;
    }
    try {
      const session = await createOwnerSessionFromMetaMask(ethereum);
      saveOwnerSession(session);
      setStatus("Owner session active.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Owner sign-in failed."
      );
    }
  }, []);

  const signOut = useCallback(() => {
    clearOwnerSession();
    setStatus("Signed out.");
  }, []);

  return {
    walletAddress,
    connectedWallet,
    token,
    sessionReady,
    status,
    signIn,
    signOut,
  };
}
