"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearOwnerSession,
  createOwnerSessionFromMetaMask,
  getOwnerSessionEventName,
  loadOwnerSession,
  saveOwnerSession,
} from "src/lib/ownerSessionClient";

export function useOwnerSession() {
  const [walletAddress, setWalletAddress] = useState("");
  const [connectedWallet, setConnectedWallet] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");

  const ownerSessionEventName = getOwnerSessionEventName();

  const syncWithConnectedWallet = useCallback(async () => {
    if (typeof window === "undefined") return;

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
      return;
    }

    if (!ethereum) {
      setConnectedWallet("");
      clearLocalSession();
      return;
    }

    try {
      const accounts = (await ethereum.request({
        method: "eth_accounts",
      })) as string[];
      const connectedWallet = String(accounts?.[0] || "").toLowerCase();
      setConnectedWallet(connectedWallet);
      const sessionWallet = session.walletAddress.toLowerCase();

      if (!connectedWallet || connectedWallet !== sessionWallet) {
        clearLocalSession();
        return;
      }

      setWalletAddress(session.walletAddress);
      setToken(session.token);
    } catch {
      setConnectedWallet("");
      clearLocalSession();
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
    status,
    signIn,
    signOut,
  };
}
