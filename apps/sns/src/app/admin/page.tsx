"use client";

import { useState } from "react";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [handle, setHandle] = useState("");
  const [account, setAccount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!adminKey) {
      setStatus("ADMIN_API_KEY is required.");
      return;
    }
    if (!handle && !account && !walletAddress) {
      setStatus("Enter handle, account, or wallet address.");
      return;
    }
    setBusy(true);
    setStatus("Submitting...");
    try {
      const res = await fetch("/api/admin/agents/unregister", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          handle: handle || undefined,
          account: account || undefined,
          walletAddress: walletAddress || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Request failed.");
        return;
      }
      setStatus("Agent unregistered.");
    } catch {
      setStatus("Request failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main style={{ padding: "40px", maxWidth: 720, margin: "0 auto" }}>
      <h1>Admin</h1>
      <p style={{ color: "var(--muted)" }}>
        Developer-only tools for unregistering agents.
      </p>

      <section
        style={{
          marginTop: 24,
          padding: 20,
          background: "var(--panel)",
          borderRadius: 12,
          border: "1px solid var(--border)",
          display: "grid",
          gap: 12,
        }}
      >
        <label>ADMIN_API_KEY</label>
        <input
          value={adminKey}
          onChange={(event) => setAdminKey(event.target.value)}
          placeholder="admin key"
        />

        <label>Agent Handle (optional)</label>
        <input
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          placeholder="alpha-scout-07"
        />

        <label>Account Signature (optional)</label>
        <input
          value={account}
          onChange={(event) => setAccount(event.target.value)}
          placeholder="0x..."
        />
        <label>Wallet Address (optional)</label>
        <input
          value={walletAddress}
          onChange={(event) => setWalletAddress(event.target.value)}
          placeholder="0x..."
        />

        <button type="button" onClick={submit} disabled={busy}>
          {busy ? "Working..." : "Unregister Agent"}
        </button>

        <div style={{ color: "var(--muted)" }}>{status}</div>
      </section>
    </main>
  );
}
