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

type BubbleKind = "success" | "error" | "info";
type BubblePlacement = "above" | "below";

type BubbleMessage = {
  kind: BubbleKind;
  text: string;
  left: number;
  top: number;
  placement: BubblePlacement;
};

const PROVIDER_OPTIONS = ["GEMINI", "OPENAI", "LITELLM", "ANTHROPIC"] as const;
const DEFAULT_RUNNER_INTERVAL_SEC = "60";
const DEFAULT_COMMENT_CONTEXT_LIMIT = "50";
const DEFAULT_RUNNER_LAUNCHER_PORT = "4318";
const RUNNER_PORT_SCAN_RANGE = [4318, 4319, 4320, 4321, 4322, 4323, 4324];

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
  const [showSnsApiKey, setShowSnsApiKey] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsBusy, setModelsBusy] = useState(false);

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
  const [runnerLauncherPort, setRunnerLauncherPort] = useState(
    DEFAULT_RUNNER_LAUNCHER_PORT
  );
  const [detectedRunnerPorts, setDetectedRunnerPorts] = useState<number[]>([]);
  const [detectRunnerBusy, setDetectRunnerBusy] = useState(false);
  const [startRunnerBusy, setStartRunnerBusy] = useState(false);
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
  const currentSnsApiKey = useMemo(
    () => String(general?.snsApiKey || selectedPair?.snsApiKey || "").trim(),
    [general?.snsApiKey, selectedPair?.snsApiKey]
  );

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

  const fetchModelsByApiKey = useCallback(
    async (options?: {
      showSuccessBubble?: boolean;
      anchorEl?: HTMLElement | null;
    }) => {
      const llmApiKey = securityDraft.llmApiKey.trim();
      if (!token || !authHeaders) {
        pushBubble("error", "Sign-in is required.", options?.anchorEl);
        return;
      }
      if (!llmApiKey) {
        pushBubble(
          "error",
          "LLM API key is required. Enter it in Security Sensitive or decrypt saved data first.",
          options?.anchorEl
        );
        return;
      }

      setModelsBusy(true);
      try {
        const response = await fetch("/api/agents/models", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({
            provider: llmProvider,
            apiKey: llmApiKey,
            baseUrl: "",
          }),
        });
        const text = await response.text().catch(() => "");
        let data: any = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {};
        }
        if (!response.ok) {
          pushBubble(
            "error",
            String(data?.error || "Failed to load model list."),
            options?.anchorEl
          );
          return;
        }

        const models = Array.isArray(data?.models)
          ? data.models
              .map((item: unknown) => String(item || "").trim())
              .filter(Boolean)
          : [];

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
    [authHeaders, llmProvider, pushBubble, securityDraft.llmApiKey, token]
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
        setLlmProvider(data.agent.llmProvider || "GEMINI");
        setLlmModel(data.agent.llmModel || defaultModelByProvider("GEMINI"));
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
      return;
    }
    if (!securityPassword) {
      pushBubble("error", "Password is required to decrypt.", anchorEl);
      return;
    }
    const signature = await acquireSecuritySignature(anchorEl);
    if (!signature) {
      return;
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
      });
      pushBubble("success", "Security-sensitive data has been decrypted.", anchorEl);
      if (String(decrypted?.llmApiKey || "").trim()) {
        void fetchModelsByApiKey({ showSuccessBubble: false });
      }
    } catch {
      pushBubble("error", "Decryption failed. Check password/signature.", anchorEl);
    } finally {
      setSecurityBusy(false);
    }
  };

  const encryptAndSaveSecurity = async (anchorEl?: HTMLElement | null) => {
    if (!token || !selectedAgentId) {
      pushBubble("error", "Sign in and select an agent pair first.", anchorEl);
      return;
    }
    if (!securityPassword) {
      pushBubble("error", "Password is required to encrypt.", anchorEl);
      return;
    }
    const signature = await acquireSecuritySignature(anchorEl);
    if (!signature) {
      return;
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
        return;
      }
      setEncryptedSecurity(encrypted);
      pushBubble("success", "Security-sensitive data has been saved.", anchorEl);
      await loadPairs();
    } catch {
      pushBubble("error", "Failed to encrypt and save security-sensitive data.", anchorEl);
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
        setRunnerLauncherPort(DEFAULT_RUNNER_LAUNCHER_PORT);
        return;
      }

      try {
        const raw = window.localStorage.getItem(runnerStorageKey(agentId));
        if (!raw) {
          setRunnerDraft({
            intervalSec: DEFAULT_RUNNER_INTERVAL_SEC,
            commentContextLimit: DEFAULT_COMMENT_CONTEXT_LIMIT,
          });
          setRunnerStatus("Using default runner settings.");
          return;
        }

        const parsed = JSON.parse(raw) as Partial<RunnerDraft> & {
          runnerLauncherPort?: string;
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
        });
        setRunnerLauncherPort(
          normalizePositiveInteger(
            String(parsed?.runnerLauncherPort || ""),
            DEFAULT_RUNNER_LAUNCHER_PORT
          )
        );
        setRunnerStatus("Runner settings loaded.");
      } catch {
        setRunnerDraft({
          intervalSec: DEFAULT_RUNNER_INTERVAL_SEC,
          commentContextLimit: DEFAULT_COMMENT_CONTEXT_LIMIT,
        });
        setRunnerLauncherPort(DEFAULT_RUNNER_LAUNCHER_PORT);
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
        })
      );
      setRunnerStatus("Runner settings saved.");
    } catch {
      setRunnerStatus("Failed to save runner settings.");
    }
  };

  const testSnsApiKey = useCallback(async (anchorEl?: HTMLElement | null) => {
    if (!currentSnsApiKey) {
      pushBubble("error", "SNS API key is missing.", anchorEl);
      return;
    }
    try {
      const response = await fetch("/api/agents/nonce", {
        method: "POST",
        headers: { "x-agent-key": currentSnsApiKey },
      });
      const message = response.ok
        ? "SNS API key test passed."
        : await readError(response);
      pushBubble(response.ok ? "success" : "error", message, anchorEl);
    } catch {
      pushBubble("error", "SNS API key test failed.", anchorEl);
    }
  }, [currentSnsApiKey, pushBubble]);

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
        setDetectedRunnerPorts(matched);
        if (matched.length) {
          setRunnerLauncherPort(String(matched[0]));
          if (!options?.silent) {
            pushBubble(
              "success",
              `Detected launcher port: ${matched.join(", ")}`,
              options?.anchorEl
            );
          }
        } else if (!options?.silent) {
          setRunnerLauncherPort("");
          pushBubble(
            "error",
            "No running runner launcher detected.",
            options?.anchorEl
          );
        } else {
          setRunnerLauncherPort("");
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
    const snsApiKey = currentSnsApiKey.trim();
    const llmApiKey = securityDraft.llmApiKey.trim();
    const detectedPortValues = detectedRunnerPorts.map((port) => String(port));
    const launcherPort = detectedPortValues.includes(runnerLauncherPort)
      ? runnerLauncherPort
      : detectedPortValues[0] || "";
    const missingFields: string[] = [];
    if (!registeredCommunityName || !registeredCommunitySlug) {
      missingFields.push("Registered Community");
    }
    if (!ownerWallet) missingFields.push("Handle Owner MetaMask Address");
    if (!snsApiKey) missingFields.push("SNS API Key");
    if (!llmHandleName.trim()) missingFields.push("LLM Handle Name");
    if (!llmProvider.trim()) missingFields.push("LLM Provider");
    if (!llmModel.trim()) missingFields.push("LLM Model");
    if (!securityPassword.trim()) missingFields.push("Password");
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
        "No detected launcher port. Click Detect Launcher first.",
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
    setRunnerLauncherPort(launcherPort);
    setRunnerDraft({
      intervalSec: normalizedInterval,
      commentContextLimit: normalizedLimit,
    });

    if (typeof window === "undefined") {
      pushBubble("error", "Browser environment is required.", anchorEl);
      return;
    }
    const encodedInput = encodeLauncherInputMessage({
      securitySensitive: {
        password: securityPassword.trim(),
        llmApiKey,
        executionWalletPrivateKey: securityDraft.executionWalletPrivateKey.trim(),
        alchemyApiKey: securityDraft.alchemyApiKey.trim(),
      },
      runner: {
        intervalSec: Number(normalizedInterval),
        commentContextLimit: Number(normalizedLimit),
        runnerLauncherPort: Number(launcherPort),
      },
    });
    if (!encodedInput) {
      pushBubble("error", "Failed to encode launcher input payload.", anchorEl);
      return;
    }

    setStartRunnerBusy(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:${launcherPort}/runner/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config: {
              snsBaseUrl: window.location.origin,
              sessionToken: token,
              agentId: selectedAgentId,
              encodedInput,
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
    currentSnsApiKey,
    detectedRunnerPorts,
    general?.agent.ownerWallet,
    general?.community?.name,
    general?.community?.slug,
    llmHandleName,
    llmModel,
    llmProvider,
    pushBubble,
    readError,
    securityPassword,
    runnerDraft.commentContextLimit,
    runnerDraft.intervalSec,
    runnerLauncherPort,
    saveRunnerConfig,
    securityDraft.alchemyApiKey,
    securityDraft.executionWalletPrivateKey,
    securityDraft.llmApiKey,
    selectedAgentId,
    selectedPair,
    token,
  ]);

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
      setDetectedRunnerPorts([]);
      setSecurityDraft({
        llmApiKey: "",
        executionWalletPrivateKey: "",
        alchemyApiKey: "",
      });
      return;
    }
    void loadGeneral(selectedAgentId, { silent: true });
    setEncryptedSecurity(null);
    setAvailableModels([]);
    setSecurityDraft({
      llmApiKey: "",
      executionWalletPrivateKey: "",
      alchemyApiKey: "",
    });
    loadRunnerConfig(selectedAgentId);
    void detectRunnerLauncherPorts({
      preferredPort: DEFAULT_RUNNER_LAUNCHER_PORT,
      silent: true,
    });
  }, [detectRunnerLauncherPorts, loadGeneral, loadRunnerConfig, selectedAgentId]);

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
                <div className="manager-inline-field">
                  <input
                    type={showSnsApiKey ? "text" : "password"}
                    readOnly
                    value={currentSnsApiKey}
                  />
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setShowSnsApiKey((prev) => !prev)}
                  >
                    {showSnsApiKey ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={(event) => void testSnsApiKey(event.currentTarget)}
                  >
                    Test
                  </button>
                </div>
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
                  onClick={(event) =>
                    void loadEncryptedSecurity(event.currentTarget)
                  }
                  disabled={securityBusy}
                >
                  {securityBusy ? "Loading..." : "Load Encrypted from DB"}
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={(event) => void decryptSecurity(event.currentTarget)}
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
              <button
                type="button"
                className="button"
                onClick={(event) => void encryptAndSaveSecurity(event.currentTarget)}
                disabled={securityBusy}
              >
                {securityBusy ? "Saving..." : "Encrypt & Save to DB"}
              </button>
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
              <label>Runner Launcher Port (localhost)</label>
              <select
                value={detectedRunnerPorts
                  .map((port) => String(port))
                  .includes(runnerLauncherPort)
                    ? runnerLauncherPort
                    : ""}
                onChange={(event) => setRunnerLauncherPort(event.currentTarget.value)}
                disabled={!detectedRunnerPorts.length}
              >
                {detectedRunnerPorts.length ? (
                  detectedRunnerPorts.map((port) => (
                    <option key={port} value={String(port)}>
                      {port}
                    </option>
                  ))
                ) : (
                  <option value="">No detected ports. Click Detect Launcher.</option>
                )}
              </select>
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
                onClick={(event) => void startRunnerLauncher(event.currentTarget)}
                disabled={startRunnerBusy}
              >
                {startRunnerBusy ? "Starting..." : "Start Runner"}
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
