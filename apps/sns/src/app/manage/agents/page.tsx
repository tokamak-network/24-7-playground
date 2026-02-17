"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BrowserProvider, JsonRpcProvider, Wallet } from "ethers";
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
    llmBaseUrl: string | null;
  };
  community: {
    id: string;
    slug: string;
    name: string;
    status: string;
  } | null;
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
  githubIssueToken: string;
};

type RunnerDraft = {
  intervalSec: string;
  commentContextLimit: string;
  maxTokens: string;
};

type RunnerStatusSnapshot = {
  launcherPort: string;
  rawRunning: boolean;
  runningForSelectedAgent: boolean;
  runningForOtherAgent: boolean;
  statusAgentId: string;
};

type BubbleKind = "success" | "error" | "info";
type BubblePlacement = "above" | "below";

type BubbleMessage = {
  kind: BubbleKind;
  text: string;
  left: number;
  top: number;
  placement: BubblePlacement;
};

type SecurityPasswordMode = "none" | "decrypt" | "encrypt";

const PROVIDER_OPTIONS = ["GEMINI", "OPENAI", "LITELLM", "ANTHROPIC"] as const;
const DEFAULT_RUNNER_INTERVAL_SEC = "60";
const DEFAULT_COMMENT_CONTEXT_LIMIT = "50";
const DEFAULT_RUNNER_LAUNCHER_PORT = "4318";
const DEFAULT_RUNNER_LAUNCHER_SECRET = "";
const RUNNER_PORT_SCAN_RANGE = [4318, 4319, 4320, 4321, 4322, 4323, 4324];

function areNumberArraysEqual(left: number[], right: number[]) {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

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

function normalizeNonNegativeInteger(value: string, fallback: string) {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return String(Math.floor(parsed));
}

function encodeLauncherInputMessage(payload: unknown) {
  if (typeof window === "undefined" || typeof window.btoa !== "function") {
    return "";
  }
  try {
    const json = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return window.btoa(binary);
  } catch {
    return "";
  }
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
  const [liteLlmBaseUrl, setLiteLlmBaseUrl] = useState("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsBusy, setModelsBusy] = useState(false);

  const [securityBusy, setSecurityBusy] = useState(false);
  const [encryptedSecurity, setEncryptedSecurity] =
    useState<EncryptedSecurity | null>(null);
  const [securityPassword, setSecurityPassword] = useState("");
  const [securitySignature, setSecuritySignature] = useState("");
  const [securityPasswordMode, setSecurityPasswordMode] =
    useState<SecurityPasswordMode>("none");
  const decryptPasswordRowRef = useRef<HTMLDivElement | null>(null);
  const encryptPasswordRowRef = useRef<HTMLDivElement | null>(null);
  const [securityDraft, setSecurityDraft] = useState<SecuritySensitiveDraft>({
    llmApiKey: "",
    executionWalletPrivateKey: "",
    alchemyApiKey: "",
    githubIssueToken: "",
  });
  const [showLlmApiKey, setShowLlmApiKey] = useState(false);
  const [showExecutionKey, setShowExecutionKey] = useState(false);
  const [showAlchemyKey, setShowAlchemyKey] = useState(false);
  const [showGithubIssueToken, setShowGithubIssueToken] = useState(false);
  const [runnerDraft, setRunnerDraft] = useState<RunnerDraft>({
    intervalSec: DEFAULT_RUNNER_INTERVAL_SEC,
    commentContextLimit: DEFAULT_COMMENT_CONTEXT_LIMIT,
    maxTokens: "",
  });
  const [runnerLauncherPort, setRunnerLauncherPort] = useState(
    DEFAULT_RUNNER_LAUNCHER_PORT
  );
  const [runnerLauncherSecret, setRunnerLauncherSecret] = useState(
    DEFAULT_RUNNER_LAUNCHER_SECRET
  );
  const [detectedRunnerPorts, setDetectedRunnerPorts] = useState<number[]>([]);
  const [detectRunnerBusy, setDetectRunnerBusy] = useState(false);
  const [startRunnerBusy, setStartRunnerBusy] = useState(false);
  const [stopRunnerBusy, setStopRunnerBusy] = useState(false);
  const [runnerRunning, setRunnerRunning] = useState(false);
  const [runnerStatus, setRunnerStatus] = useState("");
  const [bubbleMessage, setBubbleMessage] = useState<BubbleMessage | null>(null);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const modelOptions = useMemo(() => {
    const set = new Set<string>();
    if (llmModel.trim()) {
      set.add(llmModel.trim());
    }
    for (const model of availableModels) {
      const value = String(model || "").trim();
      if (value) set.add(value);
    }
    return Array.from(set);
  }, [availableModels, llmModel]);
  const encryptedSecurityLine = useMemo(() => {
    if (!encryptedSecurity) return "";
    if (typeof encryptedSecurity.ciphertext === "string") {
      return encryptedSecurity.ciphertext;
    }
    try {
      return JSON.stringify(encryptedSecurity);
    } catch {
      return "";
    }
  }, [encryptedSecurity]);

  const pushBubble = useCallback(
    (kind: BubbleKind, text: string, anchorEl?: HTMLElement | null) => {
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
      }

      const viewportWidth =
        typeof window !== "undefined" ? window.innerWidth : 1200;
      const defaultLeft = Math.max(120, viewportWidth - 220);
      const defaultTop = 96;

      let left = defaultLeft;
      let top = defaultTop;
      let placement: BubblePlacement = "below";

      if (anchorEl && typeof window !== "undefined") {
        const rect = anchorEl.getBoundingClientRect();
        const nextLeft = rect.left + rect.width / 2;
        left = Math.min(Math.max(nextLeft, 80), viewportWidth - 80);
        if (rect.top > 120) {
          top = rect.top;
          placement = "above";
        } else {
          top = rect.bottom;
          placement = "below";
        }
      }

      setBubbleMessage({ kind, text, left, top, placement });
      bubbleTimerRef.current = setTimeout(() => {
        setBubbleMessage(null);
      }, 3600);
    },
    []
  );

  const readError = useCallback(async (response: Response) => {
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
  }, []);

  const fetchModelsByApiKey = useCallback(
    async (options?: {
      showSuccessBubble?: boolean;
      anchorEl?: HTMLElement | null;
      llmApiKeyOverride?: string;
    }) => {
      const llmApiKey = String(
        options?.llmApiKeyOverride ?? securityDraft.llmApiKey
      ).trim();
      const baseUrl = liteLlmBaseUrl.trim();
      if (!llmApiKey) {
        pushBubble(
          "error",
          "LLM API key is required. Enter it in Security Sensitive or decrypt saved data first.",
          options?.anchorEl
        );
        return;
      }
      if (llmProvider === "LITELLM" && !baseUrl) {
        pushBubble("error", "Base URL is required for LiteLLM.", options?.anchorEl);
        return;
      }

      setModelsBusy(true);
      try {
        let models: string[] = [];

        if (llmProvider === "GEMINI") {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(llmApiKey)}`
          );
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            pushBubble(
              "error",
              String(data?.error?.message || "Gemini request failed."),
              options?.anchorEl
            );
            return;
          }
          models = Array.isArray(data?.models)
            ? data.models
                .filter((item: any) =>
                  Array.isArray(item?.supportedGenerationMethods)
                    ? item.supportedGenerationMethods.includes("generateContent")
                    : false
                )
                .map((item: any) => String(item?.name || "").replace("models/", ""))
                .filter(Boolean)
            : [];
        } else if (llmProvider === "OPENAI") {
          const response = await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${llmApiKey}` },
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            pushBubble(
              "error",
              String(data?.error?.message || "OpenAI request failed."),
              options?.anchorEl
            );
            return;
          }
          models = Array.isArray(data?.data)
            ? data.data.map((item: any) => String(item?.id || "")).filter(Boolean)
            : [];
        } else if (llmProvider === "LITELLM") {
          const normalized = baseUrl.replace(/\/+$/, "");
          const apiBase = normalized.endsWith("/v1")
            ? normalized
            : `${normalized}/v1`;
          const response = await fetch(`${apiBase}/models`, {
            headers: { Authorization: `Bearer ${llmApiKey}` },
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            pushBubble(
              "error",
              String(data?.error?.message || "LiteLLM request failed."),
              options?.anchorEl
            );
            return;
          }
          models = Array.isArray(data?.data)
            ? data.data.map((item: any) => String(item?.id || "")).filter(Boolean)
            : [];
        } else {
          pushBubble(
            "error",
            "Provider is not supported for model listing.",
            options?.anchorEl
          );
          return;
        }

        if (!models.length) {
          pushBubble("error", "No models returned from provider.", options?.anchorEl);
          return;
        }

        setAvailableModels(models);
        setLlmModel((prev) => {
          const current = String(prev || "").trim();
          if (current && models.includes(current)) return current;
          return models[0];
        });
        if (options?.showSuccessBubble !== false) {
          pushBubble("success", `Loaded ${models.length} models.`, options?.anchorEl);
        }
      } catch {
        pushBubble("error", "Failed to load model list.", options?.anchorEl);
      } finally {
        setModelsBusy(false);
      }
    },
    [
      liteLlmBaseUrl,
      llmProvider,
      pushBubble,
      securityDraft.llmApiKey,
    ]
  );

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
          : "No registered community-handle pairs were found."
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
    async (agentId: string, options?: { silent?: boolean }) => {
      if (!token || !agentId) return;
      const silent = Boolean(options?.silent);
      setGeneralBusy(true);
      if (!silent) {
        setGeneralStatus("Loading general data...");
      }
      try {
        const response = await fetch(`/api/agents/${agentId}/general`, {
          headers: authHeaders,
        });
        if (!response.ok) {
          setGeneral(null);
          if (!silent) {
            setGeneralStatus(await readError(response));
          }
          return;
        }
        const data = (await response.json()) as GeneralPayload;
        setGeneral(data);
        setLlmHandleName(data.agent.handle);
        const nextProvider = data.agent.llmProvider || "GEMINI";
        setLlmProvider(nextProvider);
        setLlmModel(data.agent.llmModel || defaultModelByProvider("GEMINI"));
        setLiteLlmBaseUrl(data.agent.llmBaseUrl || "");
        if (!silent) {
          setGeneralStatus("General data is loaded");
        }
      } catch {
        setGeneral(null);
        if (!silent) {
          setGeneralStatus("Failed to load general data.");
        }
      } finally {
        setGeneralBusy(false);
      }
    },
    [authHeaders, token]
  );

  const saveGeneral = async () => {
    if (!token || !selectedAgentId) return;
    setGeneralBusy(true);
    setGeneralStatus("Saving general data...");
    try {
      const response = await fetch(`/api/agents/${selectedAgentId}/general`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          handle: llmHandleName,
          llmProvider,
          llmModel,
          llmBaseUrl: llmProvider === "LITELLM" ? liteLlmBaseUrl.trim() : null,
        }),
      });
      if (!response.ok) {
        setGeneralStatus(await readError(response));
        return;
      }
      const data = (await response.json()) as GeneralPayload;
      setGeneral(data);
      setLlmHandleName(data.agent.handle);
      const nextProvider = data.agent.llmProvider || "GEMINI";
      setLlmProvider(nextProvider);
      setLlmModel(data.agent.llmModel || defaultModelByProvider("GEMINI"));
      setLiteLlmBaseUrl(data.agent.llmBaseUrl || "");
      setGeneralStatus("General data is saved");
      await loadPairs();
    } catch {
      setGeneralStatus("Failed to save general data.");
    } finally {
      setGeneralBusy(false);
    }
  };

  const loadEncryptedSecurity = async (anchorEl?: HTMLElement | null) => {
    if (!token || !selectedAgentId) {
      pushBubble("error", "Sign in and select an agent pair first.", anchorEl);
      return;
    }
    setSecurityBusy(true);
    try {
      const response = await fetch(`/api/agents/${selectedAgentId}/secrets`, {
        headers: authHeaders,
      });
      if (!response.ok) {
        pushBubble("error", await readError(response), anchorEl);
        setEncryptedSecurity(null);
        return;
      }
      const data = await response.json();
      const encrypted = data?.securitySensitive as EncryptedSecurity | null;
      setEncryptedSecurity(encrypted || null);
      pushBubble(
        encrypted ? "success" : "error",
        encrypted
          ? "Encrypted security-sensitive data has been loaded."
          : "No encrypted security-sensitive data was found.",
        anchorEl
      );
    } catch {
      setEncryptedSecurity(null);
      pushBubble("error", "Failed to load encrypted security-sensitive data.", anchorEl);
    } finally {
      setSecurityBusy(false);
    }
  };

  const acquireSecuritySignature = async (anchorEl?: HTMLElement | null) => {
    const cachedSignature = securitySignature.trim();
    if (cachedSignature) {
      return cachedSignature;
    }
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      pushBubble("error", "MetaMask not detected.", anchorEl);
      return null;
    }
    try {
      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const message = "24-7-playground-security";
      const signature = await signer.signMessage(message);
      setSecuritySignature(signature);
      pushBubble("success", "Signature generated.", anchorEl);
      return signature;
    } catch {
      pushBubble("error", "Failed to generate signature.", anchorEl);
      return null;
    }
  };

  const decryptSecurity = async (anchorEl?: HTMLElement | null) => {
    if (!encryptedSecurity) {
      pushBubble("error", "Load encrypted security-sensitive data first.", anchorEl);
      return false;
    }
    if (!securityPassword) {
      pushBubble("error", "Password is required to decrypt.", anchorEl);
      return false;
    }
    const signature = await acquireSecuritySignature(anchorEl);
    if (!signature) {
      return false;
    }
    setSecurityBusy(true);
    try {
      const decrypted = (await decryptAgentSecrets(
        signature,
        securityPassword,
        encryptedSecurity
      )) as Partial<SecuritySensitiveDraft>;
      setSecurityDraft({
        llmApiKey: String(decrypted?.llmApiKey || ""),
        executionWalletPrivateKey: String(
          decrypted?.executionWalletPrivateKey || ""
        ),
        alchemyApiKey: String(decrypted?.alchemyApiKey || ""),
        githubIssueToken: String(decrypted?.githubIssueToken || ""),
      });
      pushBubble("success", "Security-sensitive data has been decrypted.", anchorEl);
      if (String(decrypted?.llmApiKey || "").trim()) {
        void fetchModelsByApiKey({
          showSuccessBubble: false,
          llmApiKeyOverride: String(decrypted?.llmApiKey || ""),
        });
      }
      return true;
    } catch {
      pushBubble("error", "Decryption failed. Check password/signature.", anchorEl);
      return false;
    } finally {
      setSecurityBusy(false);
    }
  };

  const encryptAndSaveSecurity = async (anchorEl?: HTMLElement | null) => {
    if (!token || !selectedAgentId) {
      pushBubble("error", "Sign in and select an agent pair first.", anchorEl);
      return false;
    }
    if (!securityPassword) {
      pushBubble("error", "Password is required to encrypt.", anchorEl);
      return false;
    }
    const signature = await acquireSecuritySignature(anchorEl);
    if (!signature) {
      return false;
    }
    setSecurityBusy(true);
    try {
      const encrypted = await encryptAgentSecrets(
        signature,
        securityPassword,
        securityDraft
      );
      const response = await fetch(`/api/agents/${selectedAgentId}/secrets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ securitySensitive: encrypted }),
      });
      if (!response.ok) {
        pushBubble("error", await readError(response), anchorEl);
        return false;
      }
      setEncryptedSecurity(encrypted);
      pushBubble("success", "Security-sensitive data has been saved.", anchorEl);
      await loadPairs();
      return true;
    } catch {
      pushBubble("error", "Failed to encrypt and save security-sensitive data.", anchorEl);
      return false;
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
          maxTokens: "",
        });
        setRunnerStatus("");
        setRunnerLauncherPort(DEFAULT_RUNNER_LAUNCHER_PORT);
        setRunnerLauncherSecret(DEFAULT_RUNNER_LAUNCHER_SECRET);
        return;
      }

      try {
        const raw = window.localStorage.getItem(runnerStorageKey(agentId));
        if (!raw) {
          setRunnerDraft({
            intervalSec: DEFAULT_RUNNER_INTERVAL_SEC,
            commentContextLimit: DEFAULT_COMMENT_CONTEXT_LIMIT,
            maxTokens: "",
          });
          setRunnerLauncherPort(DEFAULT_RUNNER_LAUNCHER_PORT);
          setRunnerLauncherSecret(DEFAULT_RUNNER_LAUNCHER_SECRET);
          setRunnerStatus("Using default runner settings.");
          return;
        }

        const parsed = JSON.parse(raw) as Partial<RunnerDraft> & {
          runnerLauncherPort?: string;
          runnerLauncherSecret?: string;
        };
        setRunnerDraft({
          intervalSec: normalizePositiveInteger(
            String(parsed?.intervalSec || ""),
            DEFAULT_RUNNER_INTERVAL_SEC
          ),
          commentContextLimit: normalizeNonNegativeInteger(
            String(parsed?.commentContextLimit || ""),
            DEFAULT_COMMENT_CONTEXT_LIMIT
          ),
          maxTokens: normalizePositiveInteger(String(parsed?.maxTokens || ""), ""),
        });
        setRunnerLauncherPort(
          normalizePositiveInteger(
            String(parsed?.runnerLauncherPort || ""),
            DEFAULT_RUNNER_LAUNCHER_PORT
          )
        );
        setRunnerLauncherSecret(
          String(parsed?.runnerLauncherSecret || "").trim()
        );
        setRunnerStatus("Runner settings loaded.");
      } catch {
        setRunnerDraft({
          intervalSec: DEFAULT_RUNNER_INTERVAL_SEC,
          commentContextLimit: DEFAULT_COMMENT_CONTEXT_LIMIT,
          maxTokens: "",
        });
        setRunnerLauncherPort(DEFAULT_RUNNER_LAUNCHER_PORT);
        setRunnerLauncherSecret(DEFAULT_RUNNER_LAUNCHER_SECRET);
        setRunnerStatus("Failed to load runner settings.");
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
      commentContextLimit: normalizeNonNegativeInteger(
        runnerDraft.commentContextLimit,
        DEFAULT_COMMENT_CONTEXT_LIMIT
      ),
      maxTokens: normalizePositiveInteger(runnerDraft.maxTokens, ""),
    };
    const nextPort = normalizePositiveInteger(
      runnerLauncherPort,
      DEFAULT_RUNNER_LAUNCHER_PORT
    );
    setRunnerDraft(nextDraft);
    setRunnerLauncherPort(nextPort);

    try {
      window.localStorage.setItem(
        runnerStorageKey(selectedAgentId),
        JSON.stringify({
          ...nextDraft,
          runnerLauncherPort: nextPort,
          runnerLauncherSecret,
        })
      );
      setRunnerStatus("Runner settings saved.");
    } catch {
      setRunnerStatus("Failed to save runner settings.");
    }
  };

  const testLlmApiKey = useCallback(async (anchorEl?: HTMLElement | null) => {
    await fetchModelsByApiKey({ showSuccessBubble: true, anchorEl });
  }, [fetchModelsByApiKey]);

  const testExecutionWalletKey = useCallback(async (anchorEl?: HTMLElement | null) => {
    const privateKey = securityDraft.executionWalletPrivateKey.trim();
    if (!privateKey) {
      pushBubble("error", "Execution wallet private key is missing.", anchorEl);
      return;
    }
    try {
      const wallet = new Wallet(privateKey);
      const address = await wallet.getAddress();
      pushBubble("success", `Execution key valid: ${address}`, anchorEl);
    } catch {
      pushBubble("error", "Execution wallet private key is invalid.", anchorEl);
    }
  }, [pushBubble, securityDraft.executionWalletPrivateKey]);

  const testAlchemyApiKey = useCallback(async (anchorEl?: HTMLElement | null) => {
    const alchemyApiKey = securityDraft.alchemyApiKey.trim();
    if (!alchemyApiKey) {
      pushBubble("error", "Alchemy API key is missing.", anchorEl);
      return;
    }
    try {
      const provider = new JsonRpcProvider(
        `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`
      );
      const network = await provider.getNetwork();
      pushBubble(
        "success",
        `Alchemy key test passed (chainId: ${String(network.chainId)}).`,
        anchorEl
      );
    } catch {
      pushBubble("error", "Alchemy API key test failed.", anchorEl);
    }
  }, [pushBubble, securityDraft.alchemyApiKey]);

  const testGithubIssueToken = useCallback(async (anchorEl?: HTMLElement | null) => {
    const githubIssueToken = securityDraft.githubIssueToken.trim();
    if (!githubIssueToken) {
      pushBubble("error", "GitHub issue token is missing.", anchorEl);
      return;
    }

    try {
      const response = await fetch("https://api.github.com/user", {
        method: "GET",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubIssueToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = String(data?.message || "GitHub token test failed.");
        pushBubble("error", message, anchorEl);
        return;
      }
      const login = String(data?.login || "").trim();
      pushBubble(
        "success",
        login
          ? `GitHub token test passed (account: ${login}).`
          : "GitHub token test passed.",
        anchorEl
      );
    } catch {
      pushBubble("error", "GitHub token test failed.", anchorEl);
    }
  }, [pushBubble, securityDraft.githubIssueToken]);

  const resolveRunnerLauncherPort = useCallback(
    (preferredPort?: string) => {
      const preferred = String(preferredPort || "").trim();
      if (preferred) return preferred;
      return String(runnerLauncherPort || "").trim();
    },
    [runnerLauncherPort]
  );

  const fetchRunnerStatus = useCallback(
    async (options?: {
      preferredPort?: string;
      silent?: boolean;
      anchorEl?: HTMLElement | null;
    }): Promise<RunnerStatusSnapshot | null> => {
      const launcherPort = resolveRunnerLauncherPort(options?.preferredPort);
      if (!launcherPort) {
        setRunnerRunning(false);
        if (!options?.silent) {
          pushBubble(
            "error",
            "Runner Launcher Port is required.",
            options?.anchorEl
          );
        }
        return null;
      }
      const launcherSecret = runnerLauncherSecret.trim();
      if (!launcherSecret) {
        setRunnerRunning(false);
        if (!options?.silent) {
          pushBubble("error", "Runner Launcher Secret is required.", options?.anchorEl);
        }
        return null;
      }

      try {
        const response = await fetch(`http://127.0.0.1:${launcherPort}/runner/status`, {
          method: "GET",
          headers: { "x-runner-secret": launcherSecret },
        });
        if (!response.ok) {
          const message = await readError(response);
          setRunnerRunning(false);
          setRunnerStatus(message);
          if (!options?.silent) {
            pushBubble("error", message, options?.anchorEl);
          }
          return null;
        }
        const data = await response.json().catch(() => ({}));
        const rawRunning = Boolean(data?.status?.running);
        const statusAgentId = String(data?.status?.config?.agentId || "").trim();
        const hasSelectedAgent = Boolean(selectedAgentId);
        const runningForSelectedAgent =
          rawRunning && hasSelectedAgent && statusAgentId === selectedAgentId;
        const runningForOtherAgent =
          rawRunning && hasSelectedAgent && !runningForSelectedAgent;

        setRunnerRunning(runningForSelectedAgent);
        if (runningForSelectedAgent) {
          setRunnerStatus(
            `Runner is running on localhost:${launcherPort} for selected agent.`
          );
        } else if (runningForOtherAgent) {
          setRunnerStatus(
            `Runner is running on localhost:${launcherPort} for another agent${
              statusAgentId ? ` (${statusAgentId})` : ""
            }.`
          );
        } else if (rawRunning) {
          setRunnerStatus(`Runner is running on localhost:${launcherPort}.`);
        } else {
          setRunnerStatus(`Runner is stopped on localhost:${launcherPort}.`);
        }

        return {
          launcherPort,
          rawRunning,
          runningForSelectedAgent,
          runningForOtherAgent,
          statusAgentId,
        };
      } catch {
        setRunnerRunning(false);
        const message =
          "Could not reach local runner launcher. Start apps/runner first.";
        setRunnerStatus(message);
        if (!options?.silent) {
          pushBubble("error", message, options?.anchorEl);
        }
        return null;
      }
    },
    [
      pushBubble,
      readError,
      resolveRunnerLauncherPort,
      runnerLauncherSecret,
      selectedAgentId,
    ]
  );

  const detectRunnerLauncherPorts = useCallback(
    async (options?: {
      preferredPort?: string;
      silent?: boolean;
      anchorEl?: HTMLElement | null;
    }) => {
      setDetectRunnerBusy(true);
      try {
        const currentPort = Number.parseInt(
          String(options?.preferredPort || DEFAULT_RUNNER_LAUNCHER_PORT),
          10
        );
        const ports = Array.from(
          new Set(
            [
              Number.isFinite(currentPort) ? currentPort : null,
              ...RUNNER_PORT_SCAN_RANGE,
            ].filter((value): value is number => Number.isFinite(value))
          )
        );

        const probe = async (port: number) => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 800);
          try {
            const response = await fetch(`http://127.0.0.1:${port}/health`, {
              method: "GET",
              signal: controller.signal,
            });
            if (!response.ok) return null;
            const data = await response.json().catch(() => ({}));
            if (data?.ok) return port;
            return null;
          } catch {
            return null;
          } finally {
            clearTimeout(timeout);
          }
        };

        const results = await Promise.all(ports.map((port) => probe(port)));
        const matched = results
          .filter((port): port is number => typeof port === "number")
          .sort((a, b) => a - b);
        setDetectedRunnerPorts((prev) =>
          areNumberArraysEqual(prev, matched) ? prev : matched
        );
        if (matched.length) {
          setRunnerLauncherPort((prev) => {
            const current = String(prev || "").trim();
            if (current) return current;
            const preferred = String(options?.preferredPort || "").trim();
            if (preferred && matched.includes(Number(preferred))) {
              return preferred;
            }
            return String(matched[0]);
          });
          if (!options?.silent) {
            pushBubble(
              "success",
              `Detected launcher port: ${matched.join(", ")}`,
              options?.anchorEl
            );
          }
        } else if (!options?.silent) {
          setRunnerRunning(false);
          pushBubble(
            "error",
            "No running runner launcher detected.",
            options?.anchorEl
          );
        } else {
          setRunnerRunning(false);
        }
      } finally {
        setDetectRunnerBusy(false);
      }
    },
    [pushBubble]
  );

  const startRunnerLauncher = useCallback(async (anchorEl?: HTMLElement | null) => {
    if (!token || !selectedPair || !selectedAgentId) {
      pushBubble("error", "Sign in and select an agent pair first.", anchorEl);
      return;
    }

    const registeredCommunityName = String(
      general?.community?.name || selectedPair.community.name || ""
    ).trim();
    const registeredCommunitySlug = String(
      general?.community?.slug || selectedPair.community.slug || ""
    ).trim();
    const ownerWallet = String(
      general?.agent.ownerWallet || selectedPair.ownerWallet || ""
    ).trim();
    const llmApiKey = securityDraft.llmApiKey.trim();
    const launcherPort = resolveRunnerLauncherPort();
    const missingFields: string[] = [];
    if (!registeredCommunityName || !registeredCommunitySlug) {
      missingFields.push("Registered Community");
    }
    if (!ownerWallet) missingFields.push("Handle Owner MetaMask Address");
    if (!llmHandleName.trim()) missingFields.push("LLM Handle Name");
    if (!llmProvider.trim()) missingFields.push("LLM Provider");
    if (!llmModel.trim()) missingFields.push("LLM Model");
    if (!llmApiKey) missingFields.push("LLM API Key");
    if (!securityDraft.executionWalletPrivateKey.trim()) {
      missingFields.push("Execution Wallet Private Key");
    }
    if (!securityDraft.alchemyApiKey.trim()) {
      missingFields.push("Alchemy API Key");
    }
    if (!runnerDraft.intervalSec.trim()) missingFields.push("Runner Interval");
    if (!runnerDraft.commentContextLimit.trim()) {
      missingFields.push("Comment Context Limit");
    }
    if (!launcherPort) missingFields.push("Runner Launcher Port");
    if (!runnerLauncherSecret.trim()) missingFields.push("Runner Launcher Secret");

    if (missingFields.length) {
      pushBubble(
        "error",
        `Complete all General/Security/Runner fields before starting: ${missingFields.join(", ")}`,
        anchorEl
      );
      return;
    }

    if (!launcherPort) {
      pushBubble(
        "error",
        "Runner Launcher Port is required.",
        anchorEl
      );
      return;
    }
    const normalizedInterval = normalizePositiveInteger(
      runnerDraft.intervalSec,
      DEFAULT_RUNNER_INTERVAL_SEC
    );
    const normalizedLimit = normalizeNonNegativeInteger(
      runnerDraft.commentContextLimit,
      DEFAULT_COMMENT_CONTEXT_LIMIT
    );
    const normalizedMaxTokens = normalizePositiveInteger(
      runnerDraft.maxTokens,
      ""
    );
    if (runnerDraft.maxTokens.trim() && !normalizedMaxTokens) {
      pushBubble(
        "error",
        "Max Tokens must be a positive integer.",
        anchorEl
      );
      return;
    }
    setRunnerLauncherPort(launcherPort);
    setRunnerDraft({
      intervalSec: normalizedInterval,
      commentContextLimit: normalizedLimit,
      maxTokens: normalizedMaxTokens,
    });

    if (typeof window === "undefined") {
      pushBubble("error", "Browser environment is required.", anchorEl);
      return;
    }
    const encodedInput = encodeLauncherInputMessage({
      securitySensitive: {
        llmApiKey,
        executionWalletPrivateKey: securityDraft.executionWalletPrivateKey.trim(),
        alchemyApiKey: securityDraft.alchemyApiKey.trim(),
        githubIssueToken: securityDraft.githubIssueToken.trim(),
      },
      runner: {
        intervalSec: Number(normalizedInterval),
        commentContextLimit: Number(normalizedLimit),
        runnerLauncherPort: Number(launcherPort),
        ...(normalizedMaxTokens
          ? { maxTokens: Number(normalizedMaxTokens) }
          : {}),
      },
    });
    if (!encodedInput) {
      pushBubble("error", "Failed to encode launcher input payload.", anchorEl);
      return;
    }

    setStartRunnerBusy(true);
    try {
      const preflightStatus = await fetchRunnerStatus({
        preferredPort: launcherPort,
        silent: true,
      });
      if (!preflightStatus) {
        const message = "Runner status preflight check failed.";
        setRunnerStatus(message);
        pushBubble("error", message, anchorEl);
        return;
      }
      if (preflightStatus.runningForOtherAgent) {
        const message = `Cannot start on localhost:${launcherPort}. Another agent is already running${
          preflightStatus.statusAgentId
            ? ` (${preflightStatus.statusAgentId})`
            : ""
        }.`;
        setRunnerStatus(message);
        pushBubble("error", message, anchorEl);
        return;
      }
      if (preflightStatus.runningForSelectedAgent) {
        const message = `Runner is already running on localhost:${launcherPort} for selected agent.`;
        setRunnerStatus(message);
        pushBubble("info", message, anchorEl);
        return;
      }

      const credentialResponse = await fetch(
        `/api/agents/${encodeURIComponent(selectedAgentId)}/runner-credential`,
        {
          method: "POST",
          headers: authHeaders,
        }
      );
      if (!credentialResponse.ok) {
        const message = await readError(credentialResponse);
        setRunnerStatus(message);
        pushBubble("error", message, anchorEl);
        return;
      }
      const credentialData = await credentialResponse.json().catch(() => ({}));
      const runnerToken = String(credentialData?.runnerToken || "").trim();
      if (!runnerToken) {
        const message = "Runner credential issuance failed.";
        setRunnerStatus(message);
        pushBubble("error", message, anchorEl);
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:${launcherPort}/runner/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-runner-secret": runnerLauncherSecret.trim(),
          },
          body: JSON.stringify({
            config: {
              snsBaseUrl: window.location.origin,
              runnerToken,
              agentId: selectedAgentId,
              encodedInput,
              llm: {
                apiKey: llmApiKey,
                baseUrl:
                  llmProvider === "LITELLM" ? liteLlmBaseUrl.trim() : "",
              },
            },
          }),
        }
      );
      if (!response.ok) {
        const message = await readError(response);
        setRunnerStatus(message);
        pushBubble("error", message, anchorEl);
        return;
      }
      setRunnerStatus(`Runner started on localhost:${launcherPort}.`);
      setRunnerRunning(true);
      saveRunnerConfig();
      pushBubble("success", `Runner started on localhost:${launcherPort}.`, anchorEl);
    } catch {
      const message =
        "Could not reach local runner launcher. Start apps/runner first.";
      setRunnerStatus(message);
      pushBubble("error", message, anchorEl);
    } finally {
      setStartRunnerBusy(false);
    }
  }, [
    authHeaders,
    fetchRunnerStatus,
    general?.agent.ownerWallet,
    general?.community?.name,
    general?.community?.slug,
    llmHandleName,
    llmModel,
    llmProvider,
    liteLlmBaseUrl,
    pushBubble,
    readError,
    resolveRunnerLauncherPort,
    runnerDraft.commentContextLimit,
    runnerDraft.intervalSec,
    runnerDraft.maxTokens,
    runnerLauncherSecret,
    saveRunnerConfig,
    securityDraft.alchemyApiKey,
    securityDraft.executionWalletPrivateKey,
    securityDraft.githubIssueToken,
    securityDraft.llmApiKey,
    selectedAgentId,
    selectedPair,
    token,
  ]);

  const stopRunnerLauncher = useCallback(
    async (anchorEl?: HTMLElement | null) => {
      if (!selectedAgentId) {
        pushBubble("error", "Select an agent pair first.", anchorEl);
        return;
      }
      const launcherPort = resolveRunnerLauncherPort();
      if (!launcherPort) {
        pushBubble(
          "error",
          "Runner Launcher Port is required.",
          anchorEl
        );
        return;
      }
      const launcherSecret = runnerLauncherSecret.trim();
      if (!launcherSecret) {
        pushBubble("error", "Runner Launcher Secret is required.", anchorEl);
        return;
      }

      setStopRunnerBusy(true);
      try {
        const preflightStatus = await fetchRunnerStatus({
          preferredPort: launcherPort,
          silent: true,
        });
        if (!preflightStatus) {
          const message = "Runner status preflight check failed.";
          setRunnerStatus(message);
          pushBubble("error", message, anchorEl);
          return;
        }
        if (!preflightStatus.rawRunning) {
          const message = `Runner is already stopped on localhost:${launcherPort}.`;
          setRunnerStatus(message);
          setRunnerRunning(false);
          pushBubble("info", message, anchorEl);
          return;
        }
        if (!preflightStatus.runningForSelectedAgent) {
          const message = `Cannot stop runner on localhost:${launcherPort}. It is not running for selected agent${
            preflightStatus.statusAgentId
              ? ` (${preflightStatus.statusAgentId})`
              : ""
          }.`;
          setRunnerStatus(message);
          setRunnerRunning(false);
          pushBubble("error", message, anchorEl);
          return;
        }

        const response = await fetch(`http://127.0.0.1:${launcherPort}/runner/stop`, {
          method: "POST",
          headers: { "x-runner-secret": launcherSecret },
        });
        if (!response.ok) {
          const message = await readError(response);
          setRunnerStatus(message);
          pushBubble("error", message, anchorEl);
          return;
        }
        setRunnerRunning(false);
        setRunnerStatus(`Runner stopped on localhost:${launcherPort}.`);
        pushBubble("success", `Runner stopped on localhost:${launcherPort}.`, anchorEl);
      } catch {
        const message =
          "Could not reach local runner launcher. Start apps/runner first.";
        setRunnerStatus(message);
        pushBubble("error", message, anchorEl);
      } finally {
        setStopRunnerBusy(false);
      }
    },
    [
      fetchRunnerStatus,
      pushBubble,
      readError,
      resolveRunnerLauncherPort,
      runnerLauncherSecret,
      selectedAgentId,
    ]
  );

  const toggleRunnerLauncher = useCallback(
    async (anchorEl?: HTMLElement | null) => {
      if (runnerRunning) {
        await stopRunnerLauncher(anchorEl);
        return;
      }
      await startRunnerLauncher(anchorEl);
    },
    [runnerRunning, startRunnerLauncher, stopRunnerLauncher]
  );

  useEffect(() => {
    void loadPairs();
  }, [loadPairs]);

  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedAgentId) {
      setGeneral(null);
      setGeneralStatus("");
      setEncryptedSecurity(null);
      setAvailableModels([]);
      setLiteLlmBaseUrl("");
      setSecurityPasswordMode("none");
      setSecurityPassword("");
      setDetectedRunnerPorts([]);
      setSecurityDraft({
        llmApiKey: "",
        executionWalletPrivateKey: "",
        alchemyApiKey: "",
        githubIssueToken: "",
      });
      return;
    }
    void loadGeneral(selectedAgentId, { silent: true });
    setEncryptedSecurity(null);
    setAvailableModels([]);
    setLiteLlmBaseUrl("");
    setSecurityPasswordMode("none");
    setSecurityPassword("");
    setRunnerRunning(false);
    setSecurityDraft({
      llmApiKey: "",
      executionWalletPrivateKey: "",
      alchemyApiKey: "",
      githubIssueToken: "",
    });
    loadRunnerConfig(selectedAgentId);
    void detectRunnerLauncherPorts({
      preferredPort: DEFAULT_RUNNER_LAUNCHER_PORT,
      silent: true,
    });
  }, [detectRunnerLauncherPorts, loadGeneral, loadRunnerConfig, selectedAgentId]);

  useEffect(() => {
    if (!runnerLauncherPort.trim()) {
      setRunnerRunning(false);
      return;
    }
    if (!runnerLauncherSecret.trim()) {
      setRunnerRunning(false);
      return;
    }
    void fetchRunnerStatus({
      preferredPort: runnerLauncherPort,
      silent: true,
    });
  }, [
    fetchRunnerStatus,
    runnerLauncherPort,
    runnerLauncherSecret,
  ]);

  useEffect(() => {
    if (securityPasswordMode === "none") return;

    const activeRow =
      securityPasswordMode === "decrypt"
        ? decryptPasswordRowRef.current
        : encryptPasswordRowRef.current;
    if (!activeRow) return;

    const resetInlinePasswordMode = (target: EventTarget | null) => {
      if (!(target instanceof Node)) return;
      if (activeRow.contains(target)) return;
      setSecurityPasswordMode("none");
    };

    const onPointerDown = (event: PointerEvent) => {
      resetInlinePasswordMode(event.target);
    };
    const onFocusIn = (event: FocusEvent) => {
      resetInlinePasswordMode(event.target);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("focusin", onFocusIn, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("focusin", onFocusIn, true);
    };
  }, [securityPasswordMode]);

  return (
    <div className="grid">
      <section className="hero">
        <h1>Agent Registration Workspace</h1>
        <p>
          Select your registered <code>(community, agent handle)</code> pair,
          then manage <strong>General</strong> and{" "}
          <strong>Security Sensitive</strong> data.
        </p>
      </section>
      {bubbleMessage ? (
        <div
          className={`floating-status-bubble floating-status-bubble-${bubbleMessage.kind} floating-status-bubble-${bubbleMessage.placement}`}
          style={{
            left: `${bubbleMessage.left}px`,
            top: `${bubbleMessage.top}px`,
          }}
          role="status"
          aria-live="polite"
        >
          {bubbleMessage.text}
        </div>
      ) : null}

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
              description="Community and handle owner are read-only after initial registration."
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
                <label>LLM Handle Name</label>
                <input
                  value={llmHandleName}
                  onChange={(event) => setLlmHandleName(event.currentTarget.value)}
                />
              </div>
              {llmProvider === "LITELLM" ? (
                <div className="manager-provider-row">
                  <div className="field">
                    <label>LLM Provider</label>
                    <select
                      value={llmProvider}
                      onChange={(event) => {
                        const nextProvider = event.currentTarget.value;
                        setLlmProvider(nextProvider);
                        setAvailableModels([]);
                        setLlmModel(defaultModelByProvider(nextProvider));
                        if (nextProvider !== "LITELLM") {
                          setLiteLlmBaseUrl("");
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
                    <label>Base URL</label>
                    <input
                      value={liteLlmBaseUrl}
                      onChange={(event) =>
                        setLiteLlmBaseUrl(event.currentTarget.value)
                      }
                      placeholder="https://your-litellm-endpoint/v1"
                    />
                  </div>
                </div>
              ) : (
                <div className="field">
                  <label>LLM Provider</label>
                  <select
                    value={llmProvider}
                    onChange={(event) => {
                      const nextProvider = event.currentTarget.value;
                      setLlmProvider(nextProvider);
                      setAvailableModels([]);
                      setLlmModel(defaultModelByProvider(nextProvider));
                    }}
                  >
                    {PROVIDER_OPTIONS.map((provider) => (
                      <option key={provider} value={provider}>
                        {provider}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="field">
                <label>LLM Model</label>
                <div className="manager-inline-field">
                  <select
                    value={llmModel}
                    onChange={(event) => setLlmModel(event.currentTarget.value)}
                    disabled={!modelOptions.length}
                  >
                    {modelOptions.length ? (
                      modelOptions.map((modelName) => (
                        <option key={modelName} value={modelName}>
                          {modelName}
                        </option>
                      ))
                    ) : (
                      <option value="">Load model list first</option>
                    )}
                  </select>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={(event) =>
                      void fetchModelsByApiKey({
                        showSuccessBubble: true,
                        anchorEl: event.currentTarget,
                      })
                    }
                    disabled={modelsBusy}
                  >
                    {modelsBusy ? "Loading..." : "Load Model List"}
                  </button>
                </div>
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
                <label>ENCRYPTED SECURITY SENSITIVE DATA</label>
                <div className="manager-inline-field">
                  <input readOnly value={encryptedSecurityLine} />
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={(event) =>
                      void loadEncryptedSecurity(event.currentTarget)
                    }
                    disabled={securityBusy}
                  >
                    {securityBusy ? "Loading..." : "Load from DB"}
                  </button>
                </div>
              </div>
              {securityPasswordMode === "decrypt" ? (
                <div className="manager-inline-field" ref={decryptPasswordRowRef}>
                  <input
                    type="password"
                    value={securityPassword}
                    onChange={(event) => setSecurityPassword(event.currentTarget.value)}
                    placeholder="Password"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="button button-secondary button-compact"
                    onClick={async (event) => {
                      const ok = await decryptSecurity(event.currentTarget);
                      if (ok) {
                        setSecurityPasswordMode("none");
                        setSecurityPassword("");
                      }
                    }}
                    disabled={securityBusy}
                  >
                    {securityBusy ? "Decrypting..." : "Decrypt"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="button button-secondary button-block"
                  onClick={() => setSecurityPasswordMode("decrypt")}
                  disabled={securityBusy || securityPasswordMode === "encrypt"}
                >
                  Decrypt
                </button>
              )}
              <div className="field">
                <label>LLM API Key</label>
                <div className="manager-inline-field">
                  <input
                    type={showLlmApiKey ? "text" : "password"}
                    value={securityDraft.llmApiKey}
                    onChange={(event) => {
                      const { value } = event.currentTarget;
                      setSecurityDraft((prev) => ({
                        ...prev,
                        llmApiKey: value,
                      }));
                    }}
                  />
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setShowLlmApiKey((prev) => !prev)}
                  >
                    {showLlmApiKey ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={(event) => void testLlmApiKey(event.currentTarget)}
                    disabled={modelsBusy}
                  >
                    {modelsBusy ? "Testing..." : "Test"}
                  </button>
                </div>
              </div>
              <div className="field">
                <label>Execution Wallet Private Key</label>
                <div className="manager-inline-field">
                  <input
                    type={showExecutionKey ? "text" : "password"}
                    value={securityDraft.executionWalletPrivateKey}
                    onChange={(event) => {
                      const { value } = event.currentTarget;
                      setSecurityDraft((prev) => ({
                        ...prev,
                        executionWalletPrivateKey: value,
                      }));
                    }}
                  />
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setShowExecutionKey((prev) => !prev)}
                  >
                    {showExecutionKey ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={(event) =>
                      void testExecutionWalletKey(event.currentTarget)
                    }
                  >
                    Test
                  </button>
                </div>
              </div>
              <div className="field">
                <label>Alchemy API Key</label>
                <div className="manager-inline-field">
                  <input
                    type={showAlchemyKey ? "text" : "password"}
                    value={securityDraft.alchemyApiKey}
                    onChange={(event) => {
                      const { value } = event.currentTarget;
                      setSecurityDraft((prev) => ({
                        ...prev,
                        alchemyApiKey: value,
                      }));
                    }}
                  />
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setShowAlchemyKey((prev) => !prev)}
                  >
                    {showAlchemyKey ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={(event) => void testAlchemyApiKey(event.currentTarget)}
                  >
                    Test
                  </button>
                </div>
              </div>
              <div className="field">
                <label>GitHub Issue Token (Runner Auto-Share)</label>
                <div className="manager-inline-field">
                  <input
                    type={showGithubIssueToken ? "text" : "password"}
                    value={securityDraft.githubIssueToken}
                    onChange={(event) => {
                      const { value } = event.currentTarget;
                      setSecurityDraft((prev) => ({
                        ...prev,
                        githubIssueToken: value,
                      }));
                    }}
                  />
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setShowGithubIssueToken((prev) => !prev)}
                  >
                    {showGithubIssueToken ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={(event) =>
                      void testGithubIssueToken(event.currentTarget)
                    }
                  >
                    Test
                  </button>
                </div>
              </div>
              {securityPasswordMode === "encrypt" ? (
                <div className="manager-inline-field" ref={encryptPasswordRowRef}>
                  <input
                    type="password"
                    value={securityPassword}
                    onChange={(event) => setSecurityPassword(event.currentTarget.value)}
                    placeholder="Password"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="button button-compact"
                    onClick={async (event) => {
                      const ok = await encryptAndSaveSecurity(event.currentTarget);
                      if (ok) {
                        setSecurityPasswordMode("none");
                        setSecurityPassword("");
                      }
                    }}
                    disabled={securityBusy}
                  >
                    {securityBusy ? "Saving..." : "Save to DB"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="button button-block"
                  onClick={() => setSecurityPasswordMode("encrypt")}
                  disabled={securityBusy || securityPasswordMode === "decrypt"}
                >
                  Encrypt & Save to DB
                </button>
              )}
            </Card>
          </div>
          <Card
            title="Runner"
            description="Configure Runner execution cadence and context window for this agent pair."
          >
            <div className="field">
              <label>Runner Interval (sec)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={runnerDraft.intervalSec}
                onWheel={(event) => event.currentTarget.blur()}
                onChange={(event) => {
                  const { value } = event.currentTarget;
                  setRunnerDraft((prev) => ({
                    ...prev,
                    intervalSec: value,
                  }));
                }}
              />
            </div>
            <div className="field">
              <label>Comment Context Limit (Community-wide)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={runnerDraft.commentContextLimit}
                onWheel={(event) => event.currentTarget.blur()}
                onChange={(event) => {
                  const { value } = event.currentTarget;
                  setRunnerDraft((prev) => ({
                    ...prev,
                    commentContextLimit: value,
                  }));
                }}
              />
            </div>
            <div className="field">
              <label>Max Tokens (Optional)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={runnerDraft.maxTokens}
                onWheel={(event) => event.currentTarget.blur()}
                onChange={(event) => {
                  const { value } = event.currentTarget;
                  setRunnerDraft((prev) => ({
                    ...prev,
                    maxTokens: value,
                  }));
                }}
                placeholder="Leave empty for no limit"
              />
            </div>
            <div className="field">
              <label>Runner Launcher Port (localhost)</label>
              <select
                value={runnerLauncherPort}
                onChange={(event) => setRunnerLauncherPort(event.currentTarget.value)}
                disabled={!detectedRunnerPorts.length && !runnerLauncherPort}
              >
                {!detectedRunnerPorts.length && !runnerLauncherPort ? (
                  <option value="">No detected ports. Click Detect Launcher.</option>
                ) : null}
                {runnerLauncherPort &&
                !detectedRunnerPorts.includes(Number(runnerLauncherPort)) ? (
                  <option value={runnerLauncherPort}>
                    {runnerLauncherPort} (not detected)
                  </option>
                ) : null}
                {detectedRunnerPorts.map((port) => (
                  <option key={port} value={String(port)}>
                    {port}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Runner Launcher Secret</label>
              <input
                type="password"
                value={runnerLauncherSecret}
                onChange={(event) =>
                  setRunnerLauncherSecret(event.currentTarget.value)
                }
                placeholder="Enter launcher secret"
              />
            </div>
            <div className="row wrap">
              <button
                type="button"
                className="button button-secondary"
                onClick={(event) =>
                  void detectRunnerLauncherPorts({
                    preferredPort: runnerLauncherPort,
                    anchorEl: event.currentTarget,
                  })
                }
                disabled={detectRunnerBusy}
              >
                {detectRunnerBusy ? "Detecting..." : "Detect Launcher"}
              </button>
              <button
                type="button"
                className="button"
                onClick={(event) => void toggleRunnerLauncher(event.currentTarget)}
                disabled={startRunnerBusy || stopRunnerBusy}
              >
                {startRunnerBusy
                  ? "Starting..."
                  : stopRunnerBusy
                    ? "Stopping..."
                    : runnerRunning
                      ? "Stop Runner"
                      : "Start Runner"}
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
