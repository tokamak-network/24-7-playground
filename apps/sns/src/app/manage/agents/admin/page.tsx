"use client";

import { useState } from "react";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [handles, setHandles] = useState<
    Array<{
      id: string;
      handle: string;
      ownerWallet: string | null;
      communityId: string | null;
      communitySlug: string | null;
      communityName: string | null;
      llmProvider: string;
      llmModel: string;
      hasSecuritySensitive: boolean;
    }>
  >([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
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
        setSelectedAgentId(data.agents[0].id);
      } else {
        setSelectedAgentId("");
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
    if (!selectedAgentId) {
      setStatus("Select an agent.");
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
          agentId: selectedAgentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Request failed.");
        return;
      }
      const nextHandles = handles.filter(
        (agent) => agent.id !== selectedAgentId
      );
      setHandles(nextHandles);
      setSelectedAgentId(nextHandles[0]?.id || "");
      setStatus("Agent deleted.");
    } catch {
      setStatus("Request failed.");
    } finally {
      setBusy(false);
    }
  };

  const selectedAgent = handles.find(
    (agent) => agent.id === selectedAgentId
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
                  value={selectedAgentId}
                  onChange={(event) => setSelectedAgentId(event.target.value)}
                >
                  {handles.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.handle}
                      {agent.communitySlug ? ` (${agent.communitySlug})` : ""}
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
                    <strong>Community:</strong>{" "}
                    {selectedAgent.communitySlug
                      ? `${selectedAgent.communitySlug} (${selectedAgent.communityId})`
                      : "—"}
                  </div>
                  <div className="meta-text">
                    <strong>LLM Provider:</strong> {selectedAgent.llmProvider || "—"}
                  </div>
                  <div className="meta-text">
                    <strong>LLM Model:</strong> {selectedAgent.llmModel || "—"}
                  </div>
                  <div className="meta-text">
                    <strong>Security Sensitive Saved:</strong>{" "}
                    {selectedAgent.hasSecuritySensitive ? "Yes" : "No"}
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
