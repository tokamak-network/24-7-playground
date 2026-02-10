"use client";

import { useState } from "react";

export default function CommunityAdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [communities, setCommunities] = useState<
    Array<{
      id: string;
      slug: string;
      name: string;
      status: string;
      ownerWallet: string | null;
      createdAt: string | null;
      closedAt: string | null;
      deleteAt: string | null;
      lastSystemHash: string | null;
      contractName: string;
      contractAddress: string;
      chain: string;
    }>
  >([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const loadCommunities = async () => {
    if (!adminKey) {
      setStatus("ADMIN_API_KEY is required.");
      return;
    }
    setBusy(true);
    setStatus("Loading communities...");
    try {
      const res = await fetch("/api/admin/communities/list", {
        method: "GET",
        headers: {
          "x-admin-key": adminKey,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Request failed.");
        return;
      }
      setCommunities(data.communities || []);
      setSelectedId(data.communities?.[0]?.id || "");
      setStatus("Communities loaded.");
    } catch {
      setStatus("Request failed.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!adminKey) {
      setStatus("ADMIN_API_KEY is required.");
      return;
    }
    if (!selectedId) {
      setStatus("Select a community.");
      return;
    }
    setBusy(true);
    setStatus("Deleting community...");
    try {
      const res = await fetch("/api/admin/communities/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          communityId: selectedId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Request failed.");
        return;
      }
      const next = communities.filter((community) => community.id !== selectedId);
      setCommunities(next);
      setSelectedId(next[0]?.id || "");
      setStatus("Community force-deleted.");
    } catch {
      setStatus("Request failed.");
    } finally {
      setBusy(false);
    }
  };

  const selectedCommunity = communities.find(
    (community) => community.id === selectedId
  );

  return (
    <main style={{ padding: "40px", maxWidth: 720, margin: "0 auto" }}>
      <h1>Community Admin</h1>
      <p style={{ color: "var(--muted)" }}>
        Developer-only tools for force deleting communities.
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

        <button type="button" onClick={loadCommunities} disabled={busy}>
          {busy ? "Working..." : "Load Communities"}
        </button>

        {communities.length > 0 ? (
          <>
            <label>Community</label>
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.slug}
                </option>
              ))}
            </select>

            {selectedCommunity ? (
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "rgba(0,0,0,0.15)",
                  display: "grid",
                  gap: 6,
                }}
              >
                <div>
                  <strong>Name:</strong> {selectedCommunity.name}
                </div>
                <div>
                  <strong>Status:</strong> {selectedCommunity.status}
                </div>
                <div>
                  <strong>Owner Wallet:</strong>{" "}
                  {selectedCommunity.ownerWallet || "—"}
                </div>
                <div>
                  <strong>Contract:</strong>{" "}
                  {selectedCommunity.contractName} ·{" "}
                  {selectedCommunity.contractAddress}
                </div>
                <div>
                  <strong>Chain:</strong> {selectedCommunity.chain}
                </div>
                <div>
                  <strong>Created:</strong>{" "}
                  {selectedCommunity.createdAt || "—"}
                </div>
                <div>
                  <strong>Closed:</strong>{" "}
                  {selectedCommunity.closedAt || "—"}
                </div>
                <div>
                  <strong>Delete At:</strong>{" "}
                  {selectedCommunity.deleteAt || "—"}
                </div>
                <div>
                  <strong>Last System Hash:</strong>{" "}
                  {selectedCommunity.lastSystemHash || "—"}
                </div>
              </div>
            ) : null}

            <button type="button" onClick={submit} disabled={busy}>
              {busy ? "Working..." : "Force Delete Community"}
            </button>
          </>
        ) : null}

        <div style={{ color: "var(--muted)" }}>{status}</div>
      </section>
    </main>
  );
}
