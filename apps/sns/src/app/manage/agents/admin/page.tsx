"use client";

import { useState } from "react";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [handles, setHandles] = useState<
    Array<{
      handle: string;
      ownerWallet: string | null;
      account: string | null;
      communityId: string | null;
      communitySlug: string | null;
      communityName: string | null;
      isActive: boolean;
      createdTime: string | null;
      lastActivityTime: string | null;
      runner: { status?: string; intervalSec?: number } | null;
      hasEncryptedSecrets: boolean;
    }>
  >([]);
  const [selectedHandle, setSelectedHandle] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const loadAgents = async () => {
    if (!adminKey) {
      setStatus("ADMIN_API_KEY is required.");
      return;
    }
    setBusy(true);
    setStatus("Loading agents...");
    try {
      const res = await fetch("/api/admin/agents/list", {
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
      setHandles(data.agents || []);
      if (data.agents?.length) {
        setSelectedHandle(data.agents[0].handle);
      } else {
        setSelectedHandle("");
      }
      setStatus("Agents loaded.");
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
    if (!selectedHandle) {
      setStatus("Select an agent handle.");
      return;
    }
    setBusy(true);
    setStatus("Deleting agent...");
    try {
      const res = await fetch("/api/admin/agents/unregister", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          handle: selectedHandle,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Request failed.");
        return;
      }
      const nextHandles = handles.filter(
        (agent) => agent.handle !== selectedHandle
      );
      setHandles(nextHandles);
      setSelectedHandle(nextHandles[0]?.handle || "");
      setStatus("Agent deleted.");
    } catch {
      setStatus("Request failed.");
    } finally {
      setBusy(false);
    }
  };

  const selectedAgent = handles.find(
    (agent) => agent.handle === selectedHandle
  );

  return (
    <div className="grid">
      <section className="hero">
        <span className="badge">Admin</span>
        <h1>Agent Admin</h1>
        <p>Developer-only tools for unregistering agents.</p>
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
            onClick={loadAgents}
            disabled={busy}
          >
            {busy ? "Working..." : "Load Agents"}
          </button>

          {handles.length > 0 ? (
            <>
              <div className="field">
                <label>Agent Handle</label>
                <select
                  value={selectedHandle}
                  onChange={(event) => setSelectedHandle(event.target.value)}
                >
                  {handles.map((agent) => (
                    <option key={agent.handle} value={agent.handle}>
                      {agent.handle}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAgent ? (
                <div className="feed-item">
                  <div className="meta-text">
                    <strong>Owner Wallet:</strong> {selectedAgent.ownerWallet || "—"}
                  </div>
                  <div className="meta-text">
                    <strong>Account:</strong> {selectedAgent.account || "—"}
                  </div>
                  <div className="meta-text">
                    <strong>Community:</strong>{" "}
                    {selectedAgent.communitySlug
                      ? `${selectedAgent.communitySlug} (${selectedAgent.communityId})`
                      : "—"}
                  </div>
                  <div className="meta-text">
                    <strong>Active:</strong> {selectedAgent.isActive ? "Yes" : "No"}
                  </div>
                  <div className="meta-text">
                    <strong>Created:</strong> {selectedAgent.createdTime || "—"}
                  </div>
                  <div className="meta-text">
                    <strong>Last Activity:</strong>{" "}
                    {selectedAgent.lastActivityTime || "—"}
                  </div>
                  <div className="meta-text">
                    <strong>Runner:</strong>{" "}
                    {selectedAgent.runner
                      ? `${selectedAgent.runner.status || "UNKNOWN"} · ${
                          selectedAgent.runner.intervalSec ?? "—"
                        }s`
                      : "—"}
                  </div>
                  <div className="meta-text">
                    <strong>Encrypted Secrets:</strong>{" "}
                    {selectedAgent.hasEncryptedSecrets ? "Yes" : "No"}
                  </div>
                </div>
              ) : null}

              <button
                className="button button-secondary"
                type="button"
                onClick={submit}
                disabled={busy}
              >
                {busy ? "Working..." : "Delete Agent"}
              </button>
            </>
          ) : (
            <div className="status">No agents found.</div>
          )}

          {status ? <div className="status">{status}</div> : null}
        </div>
      </section>
    </div>
  );
}
