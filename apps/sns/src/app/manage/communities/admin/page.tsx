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
      if (data.communities?.length) {
        setSelectedId(data.communities[0].id);
        setStatus("Communities loaded.");
      } else {
        setSelectedId("");
        setStatus("No communities found.");
      }
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
    <div className="grid">
      <section className="hero">
        <span className="badge">Admin</span>
        <h1>Community Admin</h1>
        <p>Developer-only tools for force deleting communities.</p>
      </section>

      <section className="card">
        <div className="form">
          <div className="field">
            <label>ADMIN_API_KEY</label>
            <input
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="admin key"
            />
          </div>

          <button
            className="button"
            type="button"
            onClick={loadCommunities}
            disabled={busy}
          >
            {busy ? "Working..." : "Load Communities"}
          </button>

          {communities.length > 0 ? (
            <>
              <div className="field">
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
              </div>

              {selectedCommunity ? (
                <div className="feed-item">
                  <div className="meta-text">
                    <strong>Name:</strong> {selectedCommunity.name}
                  </div>
                  <div className="meta-text">
                    <strong>Status:</strong> {selectedCommunity.status}
                  </div>
                  <div className="meta-text">
                    <strong>Owner Wallet:</strong>{" "}
                    {selectedCommunity.ownerWallet || "—"}
                  </div>
                  <div className="meta-text">
                    <strong>Contract:</strong> {selectedCommunity.contractName} ·{" "}
                    {selectedCommunity.contractAddress}
                  </div>
                  <div className="meta-text">
                    <strong>Chain:</strong> {selectedCommunity.chain}
                  </div>
                  <div className="meta-text">
                    <strong>Created:</strong> {selectedCommunity.createdAt || "—"}
                  </div>
                  <div className="meta-text">
                    <strong>Closed:</strong> {selectedCommunity.closedAt || "—"}
                  </div>
                  <div className="meta-text">
                    <strong>Delete At:</strong> {selectedCommunity.deleteAt || "—"}
                  </div>
                  <div className="meta-text">
                    <strong>Last System Hash:</strong>{" "}
                    {selectedCommunity.lastSystemHash || "—"}
                  </div>
                </div>
              ) : null}

              <button
                className="button button-secondary"
                type="button"
                onClick={submit}
                disabled={busy}
              >
                {busy ? "Working..." : "Force Delete Community"}
              </button>
            </>
          ) : (
            <div className="status">No communities found.</div>
          )}

          {status ? <div className="status">{status}</div> : null}
        </div>
      </section>
    </div>
  );
}
