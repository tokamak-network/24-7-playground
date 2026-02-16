"use client";

import { useCallback, useEffect, useState } from "react";

const OWNER_MESSAGE = "24-7-playground";
const TOKEN_KEY = "sns_owner_token";
const WALLET_KEY = "sns_owner_wallet";
const EVENT_NAME = "sns-owner-session";

type OwnerSession = {
  walletAddress: string;
  token: string;
};

function loadSession(): OwnerSession {
  if (typeof window === "undefined") {
    return { walletAddress: "", token: "" };
  }
  return {
    walletAddress: localStorage.getItem(WALLET_KEY) || "",
    token: localStorage.getItem(TOKEN_KEY) || "",
  };
}

function saveSession(session: OwnerSession) {
  localStorage.setItem(WALLET_KEY, session.walletAddress);
  localStorage.setItem(TOKEN_KEY, session.token);
  window.dispatchEvent(new Event(EVENT_NAME));
}

function clearSession() {
  localStorage.removeItem(WALLET_KEY);
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function useOwnerSession() {
  const [walletAddress, setWalletAddress] = useState("");
  const [connectedWallet, setConnectedWallet] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");

  const syncWithConnectedWallet = useCallback(async () => {
    if (typeof window === "undefined") return;

    const session = loadSession();
    const ethereum = (window as any).ethereum;
    const clearLocalSession = () => {
      clearSession();
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
    const session = loadSession();
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

    window.addEventListener(EVENT_NAME, handler);

    const ethereum = (window as any).ethereum;
    const accountHandler = () => {
      syncWithConnectedWallet();
    };
    if (ethereum?.on) {
      ethereum.on("accountsChanged", accountHandler);
    }

    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      if (ethereum?.removeListener) {
        ethereum.removeListener("accountsChanged", accountHandler);
      }
    };
  }, [refresh, syncWithConnectedWallet]);

  const signIn = useCallback(async () => {
    setStatus("");
    const ethereum = (window as any).ethereum;
    if (typeof window === "undefined" || !ethereum) {
      setStatus("MetaMask is required.");
      return;
    }
    try {
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const wallet = accounts?.[0];
      if (!wallet) {
        setStatus("No wallet selected.");
        return;
      }
      const signature = (await ethereum.request({
        method: "personal_sign",
        params: [OWNER_MESSAGE, wallet],
      })) as string;

      const res = await fetch("/api/auth/owner/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Owner sign-in failed.");
        return;
      }
      saveSession({
        walletAddress: data.walletAddress,
        token: data.token,
      });
      setStatus("Owner session active.");
    } catch (error) {
      setStatus("Owner sign-in failed.");
    }
  }, []);

  const signOut = useCallback(() => {
    clearSession();
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
