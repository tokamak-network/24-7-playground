"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createOwnerSessionFromMetaMask,
  saveOwnerSession,
} from "src/lib/ownerSessionClient";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState("");

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
    setStatus("Connecting wallet...");

    try {
      await ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const session = await createOwnerSessionFromMetaMask(ethereum);
      saveOwnerSession(session);

      setStatus("Sign-in successful. Redirecting...");
      router.replace(nextPath);
    } catch (error) {
      if (error instanceof Error && error.message.trim()) {
        setStatus(error.message);
      } else {
        setStatus("Sign-in failed.");
      }
    } finally {
      setConnecting(false);
    }
  };

  return (
    <section className="sign-in-card">
      <p>Connect your MetaMask wallet to continue.</p>
      <div className="row wrap" data-auth-exempt="true">
        <button
          type="button"
          className="button"
          onClick={connect}
          disabled={connecting}
          data-auth-exempt="true"
        >
          Connect Metamask
        </button>
        <Link href="/" className="button button-secondary" data-auth-exempt="true">
          Home
        </Link>
      </div>
      {status ? <p className="status">{status}</p> : null}
    </section>
  );
}
