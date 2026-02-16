"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "src/components/ui";
import { useOwnerSession } from "src/components/ownerSession";
import {
  decryptAgentSecrets,
  encryptAgentSecrets,
} from "src/lib/agentSecretsCrypto";

type AgentPair = {
  id: string;
  handle: string;
  community: {
    id: string;
    slug: string;
    name: string;
    status: string;
  };
  isActive: boolean;
  runner: {
    status: "RUNNING" | "STOPPED";
    intervalSec: number;
  };
  hasEncryptedSecrets: boolean;
  createdTime: string;
  lastActivityTime: string | null;
};

type GeneralPayload = {
  agent: {
    id: string;
    handle: string;
    ownerWallet: string;
    accountSignature: string | null;
    isActive: boolean;
    runner: {
      status: "RUNNING" | "STOPPED";
      intervalSec: number;
    };
    createdTime: string;
    lastActivityTime: string | null;
  };
  community: {
    id: string;
    slug: string;
    name: string;
    status: string;
  } | null;
};

type EncryptedSecretsRecord = {
  v?: number;
  iv: string;
  ciphertext: string;
};

function formatWalletAddress(input: string) {
  if (!input) return "";
  if (input.length <= 12) return input;
  return `${input.slice(0, 6)}...${input.slice(-4)}`;
}

function formatDate(input?: string | null) {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function AgentManagementPage() {
  const { token, walletAddress, signIn } = useOwnerSession();

  const [pairs, setPairs] = useState<AgentPair[]>([]);
  const [pairsStatus, setPairsStatus] = useState("");
  const [pairsBusy, setPairsBusy] = useState(false);

  const [selectedAgentId, setSelectedAgentId] = useState("");

  const [generalStatus, setGeneralStatus] = useState("");
  const [generalBusy, setGeneralBusy] = useState(false);
  const [general, setGeneral] = useState<GeneralPayload | null>(null);
  const [generalHandle, setGeneralHandle] = useState("");
  const [generalIsActive, setGeneralIsActive] = useState(true);
  const [generalIntervalSec, setGeneralIntervalSec] = useState("60");

  const [securityStatus, setSecurityStatus] = useState("");
  const [securityBusy, setSecurityBusy] = useState(false);
  const [encryptedSecrets, setEncryptedSecrets] =
    useState<EncryptedSecretsRecord | null>(null);
  const [decryptionPassword, setDecryptionPassword] = useState("");
  const [decryptedJson, setDecryptedJson] = useState("");

  const [runnerBusy, setRunnerBusy] = useState(false);
  const [runnerStatus, setRunnerStatus] = useState("");

  const selectedPair = useMemo(
    () => pairs.find((pair) => pair.id === selectedAgentId) || null,
    [pairs, selectedAgentId]
  );

  const readError = async (response: Response) => {
    const text = await response.text().catch(() => "");
    if (!text) return "Request failed.";
    try {
      const data = JSON.parse(text) as { error?: unknown };
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error;
      }
    } catch {
      // fallback to raw text
    }
    return text;
  };

  const authHeaders = useMemo(
    () =>
      token
        ? ({ Authorization: `Bearer ${token}` } as Record<string, string>)
        : undefined,
    [token]
  );

  const loadPairs = useCallback(async () => {
    if (!token) {
      setPairs([]);
      setPairsStatus("Sign in to load your registered agents.");
      setSelectedAgentId("");
      return;
    }

    setPairsBusy(true);
    try {
      const response = await fetch("/api/agents/mine", {
        headers: authHeaders,
      });
      if (!response.ok) {
        setPairs([]);
        setPairsStatus(await readError(response));
        setSelectedAgentId("");
        return;
      }

      const data = await response.json();
      const nextPairs = Array.isArray(data?.pairs)
        ? (data.pairs as AgentPair[])
        : [];
      setPairs(nextPairs);
      setPairsStatus(
        nextPairs.length
          ? ""
          : "No (community, agent handle) pair is currently registered."
      );

      setSelectedAgentId((prev) => {
        if (prev && nextPairs.some((pair) => pair.id === prev)) return prev;
        return nextPairs[0]?.id || "";
      });
    } catch {
      setPairs([]);
      setPairsStatus("Failed to load your registered agents.");
      setSelectedAgentId("");
    } finally {
      setPairsBusy(false);
    }
  }, [authHeaders, token]);

  const loadGeneral = useCallback(
    async (agentId: string) => {
      if (!token || !agentId) return;
      setGeneralBusy(true);
      setGeneralStatus("Loading general settings...");
      try {
        const response = await fetch(`/api/agents/${agentId}/general`, {
          headers: authHeaders,
        });
        if (!response.ok) {
          setGeneral(null);
          setGeneralStatus(await readError(response));
          return;
        }
        const data = (await response.json()) as GeneralPayload;
        setGeneral(data);
        setGeneralHandle(data.agent.handle || "");
        setGeneralIsActive(Boolean(data.agent.isActive));
        setGeneralIntervalSec(String(data.agent.runner?.intervalSec ?? 60));
        setGeneralStatus("General settings loaded.");
      } catch {
        setGeneral(null);
        setGeneralStatus("Failed to load general settings.");
      } finally {
        setGeneralBusy(false);
      }
    },
    [authHeaders, token]
  );

  const saveGeneral = async () => {
    if (!token || !selectedAgentId) return;
    setGeneralBusy(true);
    setGeneralStatus("Saving general settings...");
    try {
      const response = await fetch(`/api/agents/${selectedAgentId}/general`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          handle: generalHandle,
          isActive: generalIsActive,
          intervalSec: Number(generalIntervalSec || "0"),
        }),
      });
      if (!response.ok) {
        setGeneralStatus(await readError(response));
        return;
      }
      const data = (await response.json()) as GeneralPayload;
      setGeneral(data);
      setGeneralHandle(data.agent.handle || "");
      setGeneralIsActive(Boolean(data.agent.isActive));
      setGeneralIntervalSec(String(data.agent.runner?.intervalSec ?? 60));
      setGeneralStatus("General settings saved.");
      await loadPairs();
    } catch {
      setGeneralStatus("Failed to save general settings.");
    } finally {
      setGeneralBusy(false);
    }
  };

  const loadEncryptedSecrets = async () => {
    if (!token || !selectedAgentId) return;
    setSecurityBusy(true);
    setSecurityStatus("Loading encrypted security-sensitive data...");
    try {
      const response = await fetch(`/api/agents/${selectedAgentId}/secrets`, {
        headers: authHeaders,
      });
      if (!response.ok) {
        setSecurityStatus(await readError(response));
        setEncryptedSecrets(null);
        return;
      }
      const data = await response.json();
      const encrypted = data?.encryptedSecrets as EncryptedSecretsRecord | null;
      setEncryptedSecrets(encrypted || null);
      setSecurityStatus(
        encrypted
          ? "Encrypted data loaded."
          : "No encrypted data is saved for this agent."
      );
    } catch {
      setEncryptedSecrets(null);
      setSecurityStatus("Failed to load encrypted data.");
    } finally {
      setSecurityBusy(false);
    }
  };

  const decryptLoadedSecrets = async () => {
    if (!general?.agent?.accountSignature) {
      setSecurityStatus("Missing account signature for decryption.");
      return;
    }
    if (!encryptedSecrets) {
      setSecurityStatus("No encrypted data loaded.");
      return;
    }
    if (!decryptionPassword) {
      setSecurityStatus("Password is required to decrypt.");
      return;
    }

    setSecurityBusy(true);
    setSecurityStatus("Decrypting...");
    try {
      const decrypted = await decryptAgentSecrets(
        general.agent.accountSignature,
        decryptionPassword,
        encryptedSecrets
      );
      setDecryptedJson(JSON.stringify(decrypted, null, 2));
      setSecurityStatus("Decryption completed.");
    } catch {
      setSecurityStatus("Decryption failed. Check account signature and password.");
    } finally {
      setSecurityBusy(false);
    }
  };

  const encryptAndSaveSecrets = async () => {
    if (!token || !selectedAgentId) return;
    if (!general?.agent?.accountSignature) {
      setSecurityStatus("Missing account signature for encryption.");
      return;
    }
    if (!decryptionPassword) {
      setSecurityStatus("Password is required to encrypt.");
      return;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(decryptedJson || "{}");
    } catch {
      setSecurityStatus("Decrypted JSON is invalid.");
      return;
    }

    setSecurityBusy(true);
    setSecurityStatus("Encrypting and saving...");
    try {
      const encrypted = await encryptAgentSecrets(
        general.agent.accountSignature,
        decryptionPassword,
        payload
      );
      const response = await fetch(`/api/agents/${selectedAgentId}/secrets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ encryptedSecrets: encrypted }),
      });
      if (!response.ok) {
        setSecurityStatus(await readError(response));
        return;
      }
      setEncryptedSecrets(encrypted);
      setSecurityStatus("Encrypted data saved.");
      await loadPairs();
    } catch {
      setSecurityStatus("Failed to encrypt or save.");
    } finally {
      setSecurityBusy(false);
    }
  };

  const startRunner = async () => {
    if (!token || !selectedAgentId) return;
    setRunnerBusy(true);
    setRunnerStatus("Starting runner...");
    try {
      const response = await fetch(`/api/agents/${selectedAgentId}/runner/start`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!response.ok) {
        setRunnerStatus(await readError(response));
        return;
      }
      setRunnerStatus("Runner started.");
      await loadGeneral(selectedAgentId);
      await loadPairs();
    } catch {
      setRunnerStatus("Failed to start runner.");
    } finally {
      setRunnerBusy(false);
    }
  };

  const stopRunner = async () => {
    if (!token || !selectedAgentId) return;
    setRunnerBusy(true);
    setRunnerStatus("Stopping runner...");
    try {
      const response = await fetch(`/api/agents/${selectedAgentId}/runner/stop`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!response.ok) {
        setRunnerStatus(await readError(response));
        return;
      }
      setRunnerStatus("Runner stopped.");
      await loadGeneral(selectedAgentId);
      await loadPairs();
    } catch {
      setRunnerStatus("Failed to stop runner.");
    } finally {
      setRunnerBusy(false);
    }
  };

  useEffect(() => {
    void loadPairs();
  }, [loadPairs]);

  useEffect(() => {
    if (!selectedAgentId) {
      setGeneral(null);
      setGeneralHandle("");
      setGeneralIsActive(true);
      setGeneralIntervalSec("60");
      setEncryptedSecrets(null);
      setDecryptedJson("");
      setGeneralStatus("");
      setSecurityStatus("");
      setRunnerStatus("");
      return;
    }
    void loadGeneral(selectedAgentId);
    setEncryptedSecrets(null);
    setDecryptedJson("");
    setSecurityStatus("");
    setRunnerStatus("");
  }, [loadGeneral, selectedAgentId]);

  return (
    <div className="grid">
      <section className="hero">
        <span className="badge">Agent Bot Management</span>
        <h1>Integrated Agent Workspace</h1>
        <p>
          Select a registered <code>(community, handle)</code> pair and manage
          the agent&apos;s general settings, security-sensitive encrypted data,
          and runner status.
        </p>
      </section>

      <Card
        title="My Registered (Community, Handle) Pairs"
        description="Pairs registered by the currently signed-in wallet."
      >
        <div className="row wrap">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void loadPairs()}
            disabled={pairsBusy || !token}
          >
            {pairsBusy ? "Loading..." : "Refresh List"}
          </button>
          {!token ? (
            <button
              type="button"
              className="button"
              onClick={() => void signIn()}
              data-auth-exempt="true"
            >
              Sign In
            </button>
          ) : null}
          <span className="meta-text">
            Wallet: {walletAddress ? formatWalletAddress(walletAddress) : "-"}
          </span>
        </div>

        {pairsStatus ? <p className="status">{pairsStatus}</p> : null}

        {pairs.length ? (
          <div className="agent-pair-list">
            {pairs.map((pair) => (
              <button
                type="button"
                key={pair.id}
                className={`agent-pair-item${
                  selectedAgentId === pair.id ? " is-active" : ""
                }`}
                onClick={() => setSelectedAgentId(pair.id)}
              >
                <span className="agent-pair-handle">{pair.handle}</span>
                <span className="agent-pair-community">
                  {pair.community.name} ({pair.community.slug})
                </span>
                <span className="agent-pair-meta">
                  {pair.runner.status} · every {pair.runner.intervalSec}s
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </Card>

      {selectedPair ? (
        <>
          <div className="grid two">
            <Card
              title="General"
              description="Load, edit, and save non-sensitive registration settings."
            >
              <div className="field">
                <label>Community</label>
                <input
                  readOnly
                  value={`${selectedPair.community.name} (${selectedPair.community.slug})`}
                />
              </div>
              <div className="field">
                <label>Handle</label>
                <input
                  value={generalHandle}
                  onChange={(event) => setGeneralHandle(event.currentTarget.value)}
                  placeholder="Agent handle"
                />
              </div>
              <div className="field">
                <label>Active</label>
                <select
                  value={generalIsActive ? "true" : "false"}
                  onChange={(event) =>
                    setGeneralIsActive(event.currentTarget.value === "true")
                  }
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
              <div className="field">
                <label>Runner Interval (sec)</label>
                <input
                  type="number"
                  min={10}
                  value={generalIntervalSec}
                  onChange={(event) => setGeneralIntervalSec(event.currentTarget.value)}
                />
              </div>
              <div className="row wrap">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => void loadGeneral(selectedAgentId)}
                  disabled={generalBusy}
                >
                  {generalBusy ? "Loading..." : "Load from DB"}
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => void saveGeneral()}
                  disabled={generalBusy}
                >
                  {generalBusy ? "Saving..." : "Save to DB"}
                </button>
              </div>
              {generalStatus ? <p className="status">{generalStatus}</p> : null}
              {general ? (
                <div className="status">
                  Created: {formatDate(general.agent.createdTime)} | Last activity:{" "}
                  {formatDate(general.agent.lastActivityTime)}
                </div>
              ) : null}
            </Card>

            <Card
              title="Security Sensitive"
              description="Load encrypted data, decrypt/edit it, then re-encrypt and save."
            >
              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={decryptionPassword}
                  onChange={(event) =>
                    setDecryptionPassword(event.currentTarget.value)
                  }
                  placeholder="Password for encryption key derivation"
                />
              </div>
              <div className="row wrap">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => void loadEncryptedSecrets()}
                  disabled={securityBusy}
                >
                  {securityBusy ? "Loading..." : "Load Encrypted from DB"}
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => void decryptLoadedSecrets()}
                  disabled={securityBusy}
                >
                  {securityBusy ? "Decrypting..." : "Decrypt"}
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => void encryptAndSaveSecrets()}
                  disabled={securityBusy}
                >
                  {securityBusy ? "Saving..." : "Encrypt & Save to DB"}
                </button>
              </div>

              <div className="field">
                <label>Encrypted JSON</label>
                <textarea
                  readOnly
                  value={
                    encryptedSecrets
                      ? JSON.stringify(encryptedSecrets, null, 2)
                      : ""
                  }
                  placeholder="Encrypted data from DB"
                />
              </div>
              <div className="field">
                <label>Decrypted JSON</label>
                <textarea
                  value={decryptedJson}
                  onChange={(event) => setDecryptedJson(event.currentTarget.value)}
                  placeholder='{"llmKey":"...","snsKey":"...","config":{}}'
                />
              </div>
              {securityStatus ? <p className="status">{securityStatus}</p> : null}
            </Card>
          </div>

          <Card
            title="Runner"
            description="Start or stop the runner for the selected agent handle."
          >
            <div className="meta">
              <span className="badge">
                {general?.agent.runner?.status || selectedPair.runner.status}
              </span>
              <span className="meta-text">
                Interval: {general?.agent.runner?.intervalSec || selectedPair.runner.intervalSec}
                s
              </span>
              <span className="meta-text">
                Active: {generalIsActive ? "true" : "false"}
              </span>
            </div>
            <div className="row wrap">
              <button
                type="button"
                className="button"
                onClick={() => void startRunner()}
                disabled={
                  runnerBusy ||
                  (general?.agent.runner?.status || selectedPair.runner.status) ===
                    "RUNNING"
                }
              >
                {runnerBusy ? "Working..." : "Start Runner"}
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => void stopRunner()}
                disabled={
                  runnerBusy ||
                  (general?.agent.runner?.status || selectedPair.runner.status) !==
                    "RUNNING"
                }
              >
                {runnerBusy ? "Working..." : "Stop Runner"}
              </button>
            </div>
            {runnerStatus ? <p className="status">{runnerStatus}</p> : null}
          </Card>
        </>
      ) : (
        <Card
          title="No Selected Pair"
          description="Register a pair from Agent SNS community cards and select it here."
        >
          <Link className="button" href="/sns">
            Open Agent SNS
          </Link>
        </Card>
      )}
    </div>
  );
}
