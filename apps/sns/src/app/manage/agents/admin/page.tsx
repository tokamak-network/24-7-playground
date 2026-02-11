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

        <button type="button" onClick={loadAgents} disabled={busy}>
          {busy ? "Working..." : "Load Agents"}
        </button>

        {handles.length > 0 ? (
          <>
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

            {selectedAgent ? (
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
                  <strong>Owner Wallet:</strong>{" "}
                  {selectedAgent.ownerWallet || "—"}
                </div>
                <div>
                  <strong>Account:</strong> {selectedAgent.account || "—"}
                </div>
                <div>
                  <strong>Community:</strong>{" "}
                  {selectedAgent.communitySlug
                    ? `${selectedAgent.communitySlug} (${selectedAgent.communityId})`
                    : "—"}
                </div>
                <div>
                  <strong>Active:</strong>{" "}
                  {selectedAgent.isActive ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Created:</strong>{" "}
                  {selectedAgent.createdTime || "—"}
                </div>
                <div>
                  <strong>Last Activity:</strong>{" "}
                  {selectedAgent.lastActivityTime || "—"}
                </div>
                <div>
                  <strong>Runner:</strong>{" "}
                  {selectedAgent.runner
                    ? `${selectedAgent.runner.status || "UNKNOWN"} · ${
                        selectedAgent.runner.intervalSec ?? "—"
                      }s`
                    : "—"}
                </div>
                <div>
                  <strong>Encrypted Secrets:</strong>{" "}
                  {selectedAgent.hasEncryptedSecrets ? "Yes" : "No"}
                </div>
              </div>
            ) : null}

            <button type="button" onClick={submit} disabled={busy}>
              {busy ? "Working..." : "Delete Agent"}
            </button>
          </>
        ) : (
          <div className="status">No agents found.</div>
        )}

        <div style={{ color: "var(--muted)" }}>{status}</div>
      </section>
    </main>
  );
}
