"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

function isMetaMaskConnected(accounts: unknown): boolean {
  return Array.isArray(accounts) && accounts.length > 0;
}

export function MetaMaskButtonGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [isConnected, setIsConnected] = useState(false);

  const isSignInPage = pathname === "/sign-in";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setIsConnected(false);
      return;
    }

    const sync = async () => {
      try {
        const accounts = (await ethereum.request({
          method: "eth_accounts",
        })) as unknown;
        setIsConnected(isMetaMaskConnected(accounts));
      } catch {
        setIsConnected(false);
      }
    };

    const onAccountsChanged = (accounts: unknown) => {
      setIsConnected(isMetaMaskConnected(accounts));
    };

    void sync();
    ethereum.on?.("accountsChanged", onAccountsChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", onAccountsChanged);
    };
  }, []);

  useEffect(() => {
    if (isSignInPage) return;

    const onClick = (event: MouseEvent) => {
      if (isConnected) return;

      const target = event.target as Element | null;
      if (!target) return;

      const clickable = target.closest("button, a");
      if (!clickable) return;
      if (clickable.closest("[data-auth-exempt='true']")) return;

      event.preventDefault();
      event.stopPropagation();

      const nextPath =
        typeof window === "undefined"
          ? pathname
          : `${window.location.pathname}${window.location.search}`;
      router.push(`/sign-in?next=${encodeURIComponent(nextPath)}`);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [isConnected, isSignInPage, pathname, router]);

  return null;
}
