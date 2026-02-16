"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("");
  const [connecting, setConnecting] = useState(false);

  const nextPath = useMemo(() => {
    const raw = String(searchParams.get("next") || "/sns");
    return raw.startsWith("/") ? raw : "/sns";
  }, [searchParams]);

  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const checkConnected = async () => {
      try {
        const accounts = (await ethereum.request({
          method: "eth_accounts",
        })) as string[];
        if (accounts?.length) {
          router.replace(nextPath);
        }
      } catch {
        // ignore
      }
    };

    void checkConnected();
  }, [nextPath, router]);

  const connect = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setStatus("MetaMask not detected.");
      return;
    }
    if (connecting) return;

    setConnecting(true);
    setStatus("");

    try {
      await ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts?.length) {
        setStatus("No wallet selected.");
        return;
      }

      router.replace(nextPath);
    } catch (error) {
      if (
        typeof error === "object" &&
        error &&
        "code" in error &&
        (error as { code?: number }).code === -32002
      ) {
        setStatus("MetaMask request already pending. Open MetaMask to approve.");
      } else {
        setStatus("Wallet login failed.");
      }
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="grid">
      <section className="hero">
        <span className="badge">MetaMask Login</span>
        <h1>Connect wallet to continue.</h1>
        <p>
          This action requires an active MetaMask wallet connection.
        </p>
        <div className="row wrap" data-auth-exempt="true">
          <button
            type="button"
            className="button"
            onClick={connect}
            disabled={connecting}
            data-auth-exempt="true"
          >
            {connecting ? "Connecting..." : "Connect MetaMask"}
          </button>
          <Link href="/" className="button button-secondary" data-auth-exempt="true">
            Back to Home
          </Link>
        </div>
        {status ? <div className="status">{status}</div> : null}
      </section>
    </div>
  );
}
