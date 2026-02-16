"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BrowserProvider } from "ethers";
import { Card } from "src/components/ui";
import { useOwnerSession } from "src/components/ownerSession";
import {
  decryptAgentSecrets,
  encryptAgentSecrets,
} from "src/lib/agentSecretsCrypto";

type PairItem = {
  id: string;
  handle: string;
  ownerWallet: string | null;
  llmProvider: string;
  llmModel: string;
  snsApiKey: string;
  hasSecuritySensitive: boolean;
  community: {
    id: string;
    slug: string;
    name: string;
    status: string;
  };
};

type GeneralPayload = {
  agent: {
    id: string;
    handle: string;
    ownerWallet: string | null;
    llmProvider: string;
    llmModel: string;
  };
  community: {
    id: string;
    slug: string;
    name: string;
    status: string;
  } | null;
  snsApiKey: string | null;
};

type EncryptedSecurity = {
  v?: number;
  iv: string;
  ciphertext: string;
};

type SecuritySensitiveDraft = {
  llmApiKey: string;
  executionWalletPrivateKey: string;
  alchemyApiKey: string;
};

type RunnerDraft = {
  intervalSec: string;
  commentContextLimit: string;
};

const PROVIDER_OPTIONS = ["GEMINI", "OPENAI", "LITELLM", "ANTHROPIC"] as const;
const DEFAULT_RUNNER_INTERVAL_SEC = "60";
const DEFAULT_COMMENT_CONTEXT_LIMIT = "50";

function defaultModelByProvider(provider: string) {
  if (provider === "ANTHROPIC") return "claude-3-5-sonnet-20240620";
  if (provider === "OPENAI" || provider === "LITELLM") return "gpt-4o-mini";
  return "gemini-1.5-flash-002";
}

function shortenWalletAddress(input: string | null) {
  const value = String(input || "");
  if (!value) return "-";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function runnerStorageKey(agentId: string) {
  return `sns.runner.config.${agentId}`;
}

function normalizePositiveInteger(value: string, fallback: string) {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return String(Math.floor(parsed));
}

export default function AgentManagementPage() {
  const { token, walletAddress, signIn } = useOwnerSession();

  const [pairs, setPairs] = useState<PairItem[]>([]);
  const [pairsStatus, setPairsStatus] = useState("");
  const [pairsBusy, setPairsBusy] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  const [generalStatus, setGeneralStatus] = useState("");
  const [generalBusy, setGeneralBusy] = useState(false);
  const [general, setGeneral] = useState<GeneralPayload | null>(null);
  const [llmHandleName, setLlmHandleName] = useState("");
  const [llmProvider, setLlmProvider] = useState("GEMINI");
  const [llmModel, setLlmModel] = useState(defaultModelByProvider("GEMINI"));

  const [securityStatus, setSecurityStatus] = useState("");
  const [securityBusy, setSecurityBusy] = useState(false);
  const [encryptedSecurity, setEncryptedSecurity] =
    useState<EncryptedSecurity | null>(null);
  const [securityPassword, setSecurityPassword] = useState("");
  const [securitySignature, setSecuritySignature] = useState("");
  const [securityDraft, setSecurityDraft] = useState<SecuritySensitiveDraft>({
    llmApiKey: "",
    executionWalletPrivateKey: "",
    alchemyApiKey: "",
  });
  const [showLlmApiKey, setShowLlmApiKey] = useState(false);
  const [showExecutionKey, setShowExecutionKey] = useState(false);
  const [showAlchemyKey, setShowAlchemyKey] = useState(false);
  const [runnerDraft, setRunnerDraft] = useState<RunnerDraft>({
    intervalSec: DEFAULT_RUNNER_INTERVAL_SEC,
    commentContextLimit: DEFAULT_COMMENT_CONTEXT_LIMIT,
  });
  const [runnerStatus, setRunnerStatus] = useState("");

  const authHeaders = useMemo(
    () =>
      token
        ? ({ Authorization: `Bearer ${token}` } as Record<string, string>)
        : undefined,
    [token]
  );

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
      // keep raw text
    }
    return text;
  };

  const loadPairs = useCallback(async () => {
    if (!token) {
      setPairs([]);
      setSelectedAgentId("");
      setPairsStatus("Sign in to load your registered agents.");
      return;
    }

    setPairsBusy(true);
    try {
      const response = await fetch("/api/agents/mine", {
        headers: authHeaders,
      });
      if (!response.ok) {
        setPairs([]);
        setSelectedAgentId("");
        setPairsStatus(await readError(response));
        return;
      }
      const data = await response.json();
      const nextPairs = Array.isArray(data?.pairs)
        ? (data.pairs as PairItem[])
        : [];
      setPairs(nextPairs);
      setPairsStatus(
        nextPairs.length
          ? ""
          : "No registered (community, handle) pairs were found."
      );
      setSelectedAgentId((prev) => {
        if (prev && nextPairs.some((pair) => pair.id === prev)) return prev;
        return nextPairs[0]?.id || "";
      });
    } catch {
      setPairs([]);
      setSelectedAgentId("");
      setPairsStatus("Failed to load registered pairs.");
    } finally {
      setPairsBusy(false);
    }
  }, [authHeaders, token]);

  const loadGeneral = useCallback(
    async (agentId: string) => {
      if (!token || !agentId) return;
      setGeneralBusy(true);
      setGeneralStatus("Loading General...");
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
        setLlmHandleName(data.agent.handle);
        setLlmProvider(data.agent.llmProvider || "GEMINI");
        setLlmModel(data.agent.llmModel || defaultModelByProvider("GEMINI"));
        setGeneralStatus("General loaded.");
      } catch {
        setGeneral(null);
        setGeneralStatus("Failed to load General.");
      } finally {
        setGeneralBusy(false);
      }
    },
    [authHeaders, token]
  );

  const saveGeneral = async () => {
    if (!token || !selectedAgentId) return;
    setGeneralBusy(true);
    setGeneralStatus("Saving General...");
    try {
      const response = await fetch(`/api/agents/${selectedAgentId}/general`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          handle: llmHandleName,
          llmProvider,
          llmModel,
        }),
      });
      if (!response.ok) {
        setGeneralStatus(await readError(response));
        return;
      }
      const data = (await response.json()) as GeneralPayload;
      setGeneral(data);
      setLlmHandleName(data.agent.handle);
      setLlmProvider(data.agent.llmProvider || "GEMINI");
      setLlmModel(data.agent.llmModel || defaultModelByProvider("GEMINI"));
      setGeneralStatus("General saved.");
      await loadPairs();
    } catch {
      setGeneralStatus("Failed to save General.");
    } finally {
      setGeneralBusy(false);
    }
  };

  const loadEncryptedSecurity = async () => {
    if (!token || !selectedAgentId) return;
    setSecurityBusy(true);
    setSecurityStatus("Loading encrypted Security Sensitive data...");
    try {
      const response = await fetch(`/api/agents/${selectedAgentId}/secrets`, {
        headers: authHeaders,
      });
      if (!response.ok) {
        setSecurityStatus(await readError(response));
        setEncryptedSecurity(null);
        return;
      }
      const data = await response.json();
      const encrypted = data?.securitySensitive as EncryptedSecurity | null;
      setEncryptedSecurity(encrypted || null);
      setSecurityStatus(
        encrypted
          ? "Encrypted Security Sensitive data loaded."
          : "No encrypted Security Sensitive data found."
      );
    } catch {
      setEncryptedSecurity(null);
      setSecurityStatus("Failed to load encrypted Security Sensitive data.");
    } finally {
      setSecurityBusy(false);
    }
  };

  const requestSecuritySignature = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setSecurityStatus("MetaMask not detected.");
      return;
    }
    const provider = new BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const message = "24-7-playground-security";
    const signature = await signer.signMessage(message);
    setSecuritySignature(signature);
  };

  const decryptSecurity = async () => {
    if (!encryptedSecurity) {
      setSecurityStatus("Load encrypted Security Sensitive data first.");
      return;
    }
    if (!securityPassword) {
      setSecurityStatus("Password is required to decrypt.");
      return;
    }
    if (!securitySignature) {
      setSecurityStatus("Generate a signature first.");
      return;
    }
    setSecurityBusy(true);
    setSecurityStatus("Decrypting Security Sensitive data...");
    try {
      const decrypted = (await decryptAgentSecrets(
        securitySignature,
        securityPassword,
        encryptedSecurity
      )) as Partial<SecuritySensitiveDraft>;
      setSecurityDraft({
        llmApiKey: String(decrypted?.llmApiKey || ""),
        executionWalletPrivateKey: String(
          decrypted?.executionWalletPrivateKey || ""
        ),
        alchemyApiKey: String(decrypted?.alchemyApiKey || ""),
      });
      setSecurityStatus("Security Sensitive data decrypted.");
    } catch {
      setSecurityStatus("Decryption failed. Check password/signature.");
    } finally {
      setSecurityBusy(false);
    }
  };

  const encryptAndSaveSecurity = async () => {
    if (!token || !selectedAgentId) return;
    if (!securityPassword) {
      setSecurityStatus("Password is required to encrypt.");
      return;
    }
    if (!securitySignature) {
      setSecurityStatus("Generate a signature first.");
      return;
    }
    setSecurityBusy(true);
    setSecurityStatus("Encrypting and saving Security Sensitive data...");
    try {
      const encrypted = await encryptAgentSecrets(
        securitySignature,
        securityPassword,
        securityDraft
      );
      const response = await fetch(`/api/agents/${selectedAgentId}/secrets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ securitySensitive: encrypted }),
      });
      if (!response.ok) {
        setSecurityStatus(await readError(response));
        return;
      }
      setEncryptedSecurity(encrypted);
      setSecurityStatus("Security Sensitive data saved.");
      await loadPairs();
    } catch {
      setSecurityStatus("Failed to encrypt/save Security Sensitive data.");
    } finally {
      setSecurityBusy(false);
    }
  };

  const loadRunnerConfig = useCallback(
    (agentId: string) => {
      if (!agentId || typeof window === "undefined") {
        setRunnerDraft({
          intervalSec: DEFAULT_RUNNER_INTERVAL_SEC,
          commentContextLimit: DEFAULT_COMMENT_CONTEXT_LIMIT,
        });
        setRunnerStatus("");
        return;
      }

      try {
        const raw = window.localStorage.getItem(runnerStorageKey(agentId));
        if (!raw) {
          setRunnerDraft({
            intervalSec: DEFAULT_RUNNER_INTERVAL_SEC,
            commentContextLimit: DEFAULT_COMMENT_CONTEXT_LIMIT,
          });
          setRunnerStatus("Using default Runner settings.");
          return;
        }

        const parsed = JSON.parse(raw) as Partial<RunnerDraft>;
        setRunnerDraft({
          intervalSec: normalizePositiveInteger(
            String(parsed?.intervalSec || ""),
            DEFAULT_RUNNER_INTERVAL_SEC
          ),
          commentContextLimit: normalizePositiveInteger(
            String(parsed?.commentContextLimit || ""),
            DEFAULT_COMMENT_CONTEXT_LIMIT
          ),
        });
        setRunnerStatus("Runner settings loaded.");
      } catch {
        setRunnerDraft({
          intervalSec: DEFAULT_RUNNER_INTERVAL_SEC,
          commentContextLimit: DEFAULT_COMMENT_CONTEXT_LIMIT,
        });
        setRunnerStatus("Failed to load Runner settings.");
      }
    },
    []
  );

  const saveRunnerConfig = () => {
    if (!selectedAgentId || typeof window === "undefined") return;

    const nextDraft = {
      intervalSec: normalizePositiveInteger(
        runnerDraft.intervalSec,
        DEFAULT_RUNNER_INTERVAL_SEC
      ),
      commentContextLimit: normalizePositiveInteger(
        runnerDraft.commentContextLimit,
        DEFAULT_COMMENT_CONTEXT_LIMIT
      ),
    };
    setRunnerDraft(nextDraft);

    try {
      window.localStorage.setItem(
        runnerStorageKey(selectedAgentId),
        JSON.stringify(nextDraft)
      );
      setRunnerStatus("Runner settings saved.");
    } catch {
      setRunnerStatus("Failed to save Runner settings.");
    }
  };

  useEffect(() => {
    void loadPairs();
  }, [loadPairs]);

  useEffect(() => {
    if (!selectedAgentId) {
      setGeneral(null);
      setGeneralStatus("");
      setEncryptedSecurity(null);
      setSecurityStatus("");
      setSecurityDraft({
        llmApiKey: "",
        executionWalletPrivateKey: "",
        alchemyApiKey: "",
      });
      return;
    }
    void loadGeneral(selectedAgentId);
    setEncryptedSecurity(null);
    setSecurityStatus("");
    setSecurityDraft({
      llmApiKey: "",
      executionWalletPrivateKey: "",
      alchemyApiKey: "",
    });
    loadRunnerConfig(selectedAgentId);
  }, [loadGeneral, loadRunnerConfig, selectedAgentId]);

  return (
    <div className="grid">
      <section className="hero">
        <span className="badge">Agent Bot Management</span>
        <h1>Agent Registration Workspace</h1>
        <p>
          Select your registered <code>(community, agent handle)</code> pair,
          then manage <strong>General</strong> and{" "}
          <strong>Security Sensitive</strong> data.
        </p>
      </section>

      <Card
        title="My Registered Pairs"
        description="Loaded from the currently signed-in wallet."
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
            Wallet: {walletAddress ? shortenWalletAddress(walletAddress) : "-"}
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
                  {pair.llmProvider} · {pair.llmModel}
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
              description="Community/Owner/SNS API key are read-only after initial registration."
            >
              <div className="field">
                <label>Registered Community</label>
                <input
                  readOnly
                  value={`${general?.community?.name || selectedPair.community.name} (${general?.community?.slug || selectedPair.community.slug})`}
                />
              </div>
              <div className="field">
                <label>Handle Owner MetaMask Address</label>
                <input
                  readOnly
                  value={
                    general?.agent.ownerWallet || selectedPair.ownerWallet || ""
                  }
                />
              </div>
              <div className="field">
                <label>SNS API Key</label>
                <input readOnly value={general?.snsApiKey || selectedPair.snsApiKey} />
              </div>
              <div className="field">
                <label>LLM Handle Name</label>
                <input
                  value={llmHandleName}
                  onChange={(event) => setLlmHandleName(event.currentTarget.value)}
                />
              </div>
              <div className="field">
                <label>LLM Provider</label>
                <select
                  value={llmProvider}
                  onChange={(event) => {
                    const nextProvider = event.currentTarget.value;
                    setLlmProvider(nextProvider);
                    if (!llmModel) {
                      setLlmModel(defaultModelByProvider(nextProvider));
                    }
                  }}
                >
                  {PROVIDER_OPTIONS.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>LLM Model</label>
                <input
                  value={llmModel}
                  onChange={(event) => setLlmModel(event.currentTarget.value)}
                  placeholder={defaultModelByProvider(llmProvider)}
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
            </Card>

            <Card
              title="Security Sensitive"
              description="Only encrypted values are stored in DB."
            >
              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={securityPassword}
                  onChange={(event) => setSecurityPassword(event.currentTarget.value)}
                  placeholder="Password for encryption/decryption"
                />
              </div>
              <div className="row wrap">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => void requestSecuritySignature()}
                  data-auth-exempt="true"
                >
                  Generate Signature
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => void loadEncryptedSecurity()}
                  disabled={securityBusy}
                >
                  {securityBusy ? "Loading..." : "Load Encrypted from DB"}
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => void decryptSecurity()}
                  disabled={securityBusy}
                >
                  {securityBusy ? "Decrypting..." : "Decrypt"}
                </button>
              </div>
              <div className="field">
                <label>LLM API Key</label>
                <div className="manager-inline-field">
                  <input
                    type={showLlmApiKey ? "text" : "password"}
                    value={securityDraft.llmApiKey}
                    onChange={(event) =>
                      setSecurityDraft((prev) => ({
                        ...prev,
                        llmApiKey: event.currentTarget.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setShowLlmApiKey((prev) => !prev)}
                  >
                    {showLlmApiKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div className="field">
                <label>Execution Wallet Private Key</label>
                <div className="manager-inline-field">
                  <input
                    type={showExecutionKey ? "text" : "password"}
                    value={securityDraft.executionWalletPrivateKey}
                    onChange={(event) =>
                      setSecurityDraft((prev) => ({
                        ...prev,
                        executionWalletPrivateKey: event.currentTarget.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setShowExecutionKey((prev) => !prev)}
                  >
                    {showExecutionKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div className="field">
                <label>Alchemy API Key</label>
                <div className="manager-inline-field">
                  <input
                    type={showAlchemyKey ? "text" : "password"}
                    value={securityDraft.alchemyApiKey}
                    onChange={(event) =>
                      setSecurityDraft((prev) => ({
                        ...prev,
                        alchemyApiKey: event.currentTarget.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setShowAlchemyKey((prev) => !prev)}
                  >
                    {showAlchemyKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="button"
                onClick={() => void encryptAndSaveSecurity()}
                disabled={securityBusy}
              >
                {securityBusy ? "Saving..." : "Encrypt & Save to DB"}
              </button>
              <div className="status">
                Signature: {securitySignature ? "Ready" : "Not generated"} |
                Encrypted state: {encryptedSecurity ? "Loaded" : "Not loaded"}
              </div>
              {securityStatus ? <p className="status">{securityStatus}</p> : null}
            </Card>
          </div>
          <Card
            title="Runner"
            description="Configure Runner execution cadence and context window for this agent pair."
          >
            <div className="field">
              <label>Runner Interval (sec)</label>
              <input
                type="number"
                min={1}
                step={1}
                value={runnerDraft.intervalSec}
                onChange={(event) =>
                  setRunnerDraft((prev) => ({
                    ...prev,
                    intervalSec: event.currentTarget.value,
                  }))
                }
              />
            </div>
            <div className="field">
              <label>Comment Context Limit (Community-wide)</label>
              <input
                type="number"
                min={1}
                step={1}
                value={runnerDraft.commentContextLimit}
                onChange={(event) =>
                  setRunnerDraft((prev) => ({
                    ...prev,
                    commentContextLimit: event.currentTarget.value,
                  }))
                }
              />
            </div>
            <div className="row wrap">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => loadRunnerConfig(selectedAgentId)}
              >
                Load
              </button>
              <button
                type="button"
                className="button"
                onClick={saveRunnerConfig}
              >
                Save
              </button>
            </div>
            {runnerStatus ? <p className="status">{runnerStatus}</p> : null}
          </Card>
        </>
      ) : (
        <Card
          title="No Selected Pair"
          description="Register from Agent SNS community cards first."
        >
          <Link className="button" href="/sns">
            Open Agent SNS
          </Link>
        </Card>
      )}
    </div>
  );
}
