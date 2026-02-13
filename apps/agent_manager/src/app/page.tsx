"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserProvider, Contract, JsonRpcProvider, Wallet, getAddress } from "ethers";
import { decryptSecrets, encryptSecrets } from "../lib/crypto";
import { snsUrl } from "../lib/api";

type AgentRecord = {
  id: string;
  handle: string;
  ownerWallet?: string | null;
  encryptedSecrets?: any;
  runner?: {
    status?: string;
    intervalSec?: number;
  };
};

type LlmLogRecord = {
  id: string;
  createdAt: string;
  system: string;
  user: string;
  response: string;
  kind?: "cycle" | "tx_feedback";
  direction?: "agent_to_manager" | "manager_to_agent";
  actionTypes?: string[];
};

type LlmLogItem = {
  id: string;
  createdAt: string;
  direction: "agent_to_manager" | "manager_to_agent";
  actionTypes: string[];
  content: string;
};

type DecryptedSecrets = {
  llmKey: string;
  snsKey: string;
  config: {
    provider?: string;
    model?: string;
    llmBaseUrl?: string;
    commentLimit?: number;
    runIntervalSec?: number;
  };
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(",")}}`;
}

function toJsonSafe(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => toJsonSafe(item));
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    Object.keys(obj).forEach((key) => {
      result[key] = toJsonSafe(obj[key]);
    });
    return result;
  }
  return value;
}

async function sha256(value: string) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(key: string, message: string) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    enc.encode(message)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function callLlm({
  provider,
  model,
  apiKey,
  baseUrl,
  system,
  user,
}: {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
  system: string;
  user: string;
}) {
  const readErrorMessage = async (response: Response) => {
    try {
      const data = await response.json();
      if (data?.error?.message) return data.error.message as string;
      if (data?.message) return data.message as string;
      return JSON.stringify(data);
    } catch {
      return response.statusText || "Unknown error";
    }
  };

  const normalizeOpenAiBaseUrl = (input?: string) => {
    const trimmed = String(input || "").trim().replace(/\/+$/, "");
    if (!trimmed) return "";
    return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
  };

  if (provider === "LITELLM") {
    const base = normalizeOpenAiBaseUrl(baseUrl);
    if (!base) {
      throw new Error("LiteLLM base URL missing.");
    }
    const payload: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    };
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);
      throw new Error(`LiteLLM error ${response.status}: ${message}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "";
  }

  if (provider === "OPENAI") {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);
      throw new Error(`OpenAI error ${response.status}: ${message}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "";
  }

  if (provider === "ANTHROPIC") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);
      throw new Error(`Anthropic error ${response.status}: ${message}`);
    }

    const data = await response.json();
    return data?.content?.[0]?.text || "";
  }

  if (provider === "GEMINI") {
    const prompt = `${system}\n\n${user}`;
    const callGemini = async (modelName: string) => {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!response.ok) {
        const message = await readErrorMessage(response);
        throw new Error(`Gemini error ${response.status}: ${message}`);
      }

      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    };

    try {
      return await callGemini(model);
    } catch (error: any) {
      const text = String(error?.message || "");
      if (
        text.includes("404") &&
        (model.endsWith("-002") || model.endsWith("-001"))
      ) {
        const fallback = model.replace(/-(002|001)$/, "");
        return await callGemini(fallback);
      }
      throw error;
    }
  }

  return "";
}

function extractJsonPayload(output: string) {
  const trimmed = output.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("```")) {
    const lines = trimmed.split("\n");
    const fenceIndex = lines.findIndex((line) => line.startsWith("```"));
    if (fenceIndex !== -1) {
      const endIndex = lines.findIndex(
        (line, idx) => idx > fenceIndex && line.startsWith("```")
      );
      if (endIndex !== -1) {
        return lines.slice(fenceIndex + 1, endIndex).join("\n").trim();
      }
    }
  }
  const firstBrace = trimmed.indexOf("{");
  const firstBracket = trimmed.indexOf("[");
  const start =
    firstBrace === -1
      ? firstBracket
      : firstBracket === -1
      ? firstBrace
      : Math.min(firstBrace, firstBracket);
  if (start === -1) return trimmed;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }
    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{" || ch === "[") {
      depth += 1;
    } else if (ch === "}" || ch === "]") {
      depth -= 1;
      if (depth === 0) {
        return trimmed.slice(start, i + 1).trim();
      }
    }
  }
  return trimmed;
}

function sanitizeJsonPayload(input: string): string {
  const normalized = input
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/,\s*([}\]])/g, "$1");
  let output = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === "\"") {
        inString = false;
      } else if (ch === "\n") {
        output += "\\n";
        continue;
      } else if (ch === "\r") {
        continue;
      }
    } else if (ch === "\"") {
      inString = true;
    }
    output += ch;
  }
  return output;
}

function extractActionTypes(output: string): string[] {
  if (!output) return [];
  try {
    const jsonPayload = extractJsonPayload(output);
    if (!jsonPayload) return [];
    const parsed = JSON.parse(jsonPayload);
    const actions = Array.isArray(parsed) ? parsed : [parsed];
    const types = actions
      .map((item) => (item && typeof item.action === "string" ? item.action : null))
      .filter((action): action is string => Boolean(action));
    return Array.from(new Set(types));
  } catch {
    return [];
  }
}

function normalizeLlmLog(log: LlmLogRecord): LlmLogRecord {
  const kind = log.kind || "cycle";
  const direction = log.direction || "agent_to_manager";
  const actionTypes = log.actionTypes || [];
  const raw = log.response || "";
  let isTxFeedbackPayload = false;
  try {
    const payload = JSON.parse(raw);
    isTxFeedbackPayload = payload?.type === "tx_feedback";
  } catch {
    try {
      const payload = JSON.parse(extractJsonPayload(raw));
      isTxFeedbackPayload = payload?.type === "tx_feedback";
    } catch {
      isTxFeedbackPayload = false;
    }
  }
  if ((kind === "tx_feedback" || direction === "manager_to_agent") && !isTxFeedbackPayload) {
    return {
      ...log,
      kind: "cycle",
      direction: "agent_to_manager",
      actionTypes,
    };
  }
  if (isTxFeedbackPayload) {
    return {
      ...log,
      kind: "tx_feedback",
      direction: "manager_to_agent",
      actionTypes: actionTypes.length > 0 ? actionTypes : ["tx"],
    };
  }
  return {
    ...log,
    kind,
    direction,
    actionTypes,
  };
}

function parseJsonPayload(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    try {
      return JSON.parse(sanitizeJsonPayload(extractJsonPayload(input)));
    } catch {
      return null;
    }
  }
}

function splitLlmOutput(output: string): { json: string | null; plain: string } {
  const trimmed = output.trim();
  if (!trimmed) {
    return { json: null, plain: "" };
  }
  if (trimmed.startsWith("```")) {
    const lines = trimmed.split("\n");
    const startIndex = lines.findIndex((line) => line.startsWith("```"));
    if (startIndex !== -1) {
      const endIndex = lines.findIndex(
        (line, idx) => idx > startIndex && line.startsWith("```")
      );
      if (endIndex !== -1) {
        const json = lines.slice(startIndex + 1, endIndex).join("\n").trim();
        const before = lines.slice(0, startIndex).join("\n").trim();
        const after = lines.slice(endIndex + 1).join("\n").trim();
        const plain = [before, after].filter(Boolean).join("\n\n").trim();
        return { json: json || null, plain };
      }
    }
  }
  const firstBrace = trimmed.indexOf("{");
  const firstBracket = trimmed.indexOf("[");
  const start =
    firstBrace === -1
      ? firstBracket
      : firstBracket === -1
      ? firstBrace
      : Math.min(firstBrace, firstBracket);
  if (start === -1) {
    return { json: null, plain: trimmed };
  }
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }
    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{" || ch === "[") {
      depth += 1;
    } else if (ch === "}" || ch === "]") {
      depth -= 1;
      if (depth === 0) {
        const json = trimmed.slice(start, i + 1).trim();
        const plain = `${trimmed.slice(0, start)}${trimmed.slice(i + 1)}`.trim();
        return { json: json || null, plain };
      }
    }
  }
  return { json: null, plain: trimmed };
}

function expandLlmLogs(logs: LlmLogRecord[]): LlmLogItem[] {
  const items: LlmLogItem[] = [];
  for (const log of logs) {
    const base = {
      createdAt: log.createdAt,
      direction: log.direction || "agent_to_manager",
    };
    const { json, plain } = splitLlmOutput(log.response || "");
    const parsed = json ? parseJsonPayload(json) : null;
    if (Array.isArray(parsed)) {
      parsed.forEach((entry, idx) => {
        const action = entry && typeof entry.action === "string" ? entry.action : null;
        items.push({
          id: `${log.id}:${idx}`,
          ...base,
          actionTypes: action ? [action] : [],
          content: JSON.stringify(entry, null, 2),
        });
      });
      if (plain) {
        items.push({
          id: `${log.id}:plain`,
          ...base,
          actionTypes: [],
          content: plain,
        });
      }
      continue;
    }
    if (parsed && typeof parsed === "object") {
      const action =
        (parsed as any).action && typeof (parsed as any).action === "string"
          ? String((parsed as any).action)
          : null;
      items.push({
        id: `${log.id}:0`,
        ...base,
        actionTypes: action ? [action] : log.actionTypes || [],
        content: JSON.stringify(parsed, null, 2),
      });
      if (plain) {
        items.push({
          id: `${log.id}:plain`,
          ...base,
          actionTypes: [],
          content: plain,
        });
      }
      continue;
    }
    if (plain) {
      items.push({
        id: `${log.id}:0`,
        ...base,
        actionTypes: log.actionTypes || [],
        content: plain,
      });
    }
  }
  return items;
}

export default function AgentManagerPage() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [accountSignature, setAccountSignature] = useState<string>("");
  const [cachedEncryptedSecrets, setCachedEncryptedSecrets] = useState<any | null>(null);
  const [agent, setAgent] = useState<AgentRecord | null>(null);
  const [status, setStatus] = useState<string>("");
  const [llmKey, setLlmKey] = useState<string>("");
  const [snsKey, setSnsKey] = useState<string>("");
  const [llmBaseUrl, setLlmBaseUrl] = useState<string>("");
  const [executionKey, setExecutionKey] = useState<string>("");
  const [alchemyKey, setAlchemyKey] = useState<string>("");
  const [provider, setProvider] = useState<string>("GEMINI");
  const [model, setModel] = useState<string>("gemini-1.5-flash-002");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelStatus, setModelStatus] = useState<string>("");
  const [runIntervalSec, setRunIntervalSec] = useState<number>(60);
  const [commentLimitInput, setCommentLimitInput] = useState<string>("50");
  const [configJson, setConfigJson] = useState<string>("{}");
  const [runnerOn, setRunnerOn] = useState<boolean>(false);
  const [debugClicks, setDebugClicks] = useState<number>(0);
  const [llmTestStatus, setLlmTestStatus] = useState<string>("");
  const [snsTestStatus, setSnsTestStatus] = useState<string>("");
  const [executionKeyStatus, setExecutionKeyStatus] = useState<string>("");
  const [alchemyKeyStatus, setAlchemyKeyStatus] = useState<string>("");
  const [showLlmKey, setShowLlmKey] = useState<boolean>(false);
  const [showSnsKey, setShowSnsKey] = useState<boolean>(false);
  const [showExecutionKey, setShowExecutionKey] = useState<boolean>(false);
  const [showAlchemyKey, setShowAlchemyKey] = useState<boolean>(false);
  const [lastLlmOutput, setLastLlmOutput] = useState<string>("");
  const [llmLogs, setLlmLogs] = useState<LlmLogRecord[]>([]);
  const [llmLogFilter, setLlmLogFilter] = useState<
    "all" | "create_thread" | "comment" | "tx" | "etc"
  >("all");
  const [llmLogPage, setLlmLogPage] = useState<number>(1);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [userPromptTemplate, setUserPromptTemplate] = useState<string>("");
  const intervalRef = useRef<number | null>(null);
  const runInFlightRef = useRef<boolean>(false);
  const autoTestRef = useRef<boolean>(false);
  const autoResumeRef = useRef<boolean>(false);
  const fallbackModels =
    provider === "GEMINI"
      ? ["gemini-1.5-flash-002", "gemini-1.5-pro-002"]
      : provider === "OPENAI"
      ? ["gpt-4o-mini", "gpt-4o"]
      : provider === "LITELLM"
      ? ["gpt-4o-mini", "gpt-4o"]
      : provider === "ANTHROPIC"
      ? ["claude-3-5-sonnet-20240620", "claude-3-5-haiku-20241022"]
      : [];
  const knownModels = new Set([
    ...availableModels,
    ...(availableModels.length === 0 ? fallbackModels : []),
  ]);
  const showSavedModel = Boolean(model) && !knownModels.has(model);
  const parseCommentLimit = (value: string, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
  };
  const commentLimit = parseCommentLimit(commentLimitInput, 50);

  const saveToken = (value: string) => {
    setToken(value);
    if (value) {
      localStorage.setItem("sns_session_token", value);
    } else {
      localStorage.removeItem("sns_session_token");
    }
  };

  const handleUnauthorized = (message?: string) => {
    saveToken("");
    setAgent(null);
    setRunnerOn(false);
    setStatus(message || "Session expired. Please sign in again.");
  };

  const saveAccount = (value: string) => {
    setAccountSignature(value);
    if (value) {
      localStorage.setItem("agent_account_signature", value);
    } else {
      localStorage.removeItem("agent_account_signature");
    }
  };

  const saveEncryptedCache = (value: any | null) => {
    setCachedEncryptedSecrets(value);
    if (value) {
      localStorage.setItem("agent_encrypted_secrets", JSON.stringify(value));
    } else {
      localStorage.removeItem("agent_encrypted_secrets");
    }
  };

  const saveLlmLogs = (logs: LlmLogRecord[]) => {
    const normalized = logs.map(normalizeLlmLog);
    setLlmLogs(normalized);
    localStorage.setItem("agent_llm_logs", JSON.stringify(normalized));
  };

  const saveLocalExecution = (key: string, alchemy: string) => {
    localStorage.setItem(
      "agent_execution_config",
      JSON.stringify({ executionKey: key, alchemyKey: alchemy })
    );
  };

  const addLlmLog = (log: LlmLogRecord) => {
    let current = llmLogs;
    try {
      const stored = localStorage.getItem("agent_llm_logs");
      if (stored) {
        current = JSON.parse(stored).map(normalizeLlmLog);
      }
    } catch {
      current = llmLogs;
    }
    const nextLogs = [log, ...(Array.isArray(current) ? current : [])].slice(0, 50);
    saveLlmLogs(nextLogs);
    setLlmLogPage(1);
  };

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const expandedLlmLogs = expandLlmLogs(llmLogs);
  const filteredLlmLogs =
    llmLogFilter === "all"
      ? expandedLlmLogs
      : expandedLlmLogs.filter((log) => {
          const types = log.actionTypes || [];
          if (llmLogFilter === "etc") {
            return types.length === 0;
          }
          return types.includes(llmLogFilter);
        });
  const llmLogPageSize = 5;
  const llmLogTotalPages = Math.max(
    1,
    Math.ceil(filteredLlmLogs.length / llmLogPageSize)
  );
  const clampedLlmLogPage = Math.min(llmLogPage, llmLogTotalPages);
  const pagedLlmLogs = filteredLlmLogs.slice(
    (clampedLlmLogPage - 1) * llmLogPageSize,
    clampedLlmLogPage * llmLogPageSize
  );

  const fetchAgent = useCallback(async () => {
    if (!token) return;
    const res = await fetch(snsUrl("/api/agents/me"), {
      headers: authHeaders,
    });
    if (res.status === 401) {
      handleUnauthorized();
      return;
    }
    const data = await res.json();
    const nextAgent = data.agent || null;
    setAgent(nextAgent);
    if (nextAgent?.runner?.status === "RUNNING") {
      setRunnerOn(true);
    } else {
      setRunnerOn(false);
    }
  }, [token]);

  useEffect(() => {
    const stored = localStorage.getItem("sns_session_token");
    const storedAccount = localStorage.getItem("agent_account_signature");
    const storedSecrets = localStorage.getItem("agent_encrypted_secrets");
    const storedLogs = localStorage.getItem("agent_llm_logs");
    const storedExec = localStorage.getItem("agent_execution_config");
    if (storedAccount) {
      setAccountSignature(storedAccount);
    }
    if (storedSecrets) {
      try {
        setCachedEncryptedSecrets(JSON.parse(storedSecrets));
      } catch {
        setCachedEncryptedSecrets(null);
      }
    }
    if (storedLogs) {
      try {
        setLlmLogs(JSON.parse(storedLogs).map(normalizeLlmLog));
      } catch {
        setLlmLogs([]);
      }
    }
    if (storedExec) {
      try {
        const parsed = JSON.parse(storedExec);
        setExecutionKey(parsed.executionKey || "");
        setAlchemyKey(parsed.alchemyKey || "");
      } catch {
        setExecutionKey("");
        setAlchemyKey("");
      }
    }
    if (!stored) return;

    setToken(stored);
    fetch(snsUrl("/api/agents/me"), {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((res) => {
        if (res.status === 401) {
          handleUnauthorized();
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data?.agent) {
          setAgent(data.agent);
          if (data.agent?.runner?.status === "RUNNING") {
            setRunnerOn(true);
          } else {
            setRunnerOn(false);
          }
          setStatus("Session restored.");
        } else {
          saveToken("");
          setAgent(null);
        }
      })
      .catch(() => {
        saveToken("");
        setAgent(null);
      });
  }, []);

  useEffect(() => {
    if (autoTestRef.current) return;
    if (!executionKey && !alchemyKey) return;
    autoTestRef.current = true;
    if (executionKey) {
      testExecutionKey().catch?.(() => undefined);
    }
    if (alchemyKey) {
      testAlchemyKey().catch?.(() => undefined);
    }
  }, [executionKey, alchemyKey]);

  useEffect(() => {
    if (autoResumeRef.current) return;
    if (!agent || !token || runnerOn) return;
    if (agent.runner?.status !== "RUNNING") return;
    if (
      executionKeyStatus.startsWith("OK") &&
      alchemyKeyStatus.startsWith("OK")
    ) {
      autoResumeRef.current = true;
      startRunner().catch(() => undefined);
    } else if (executionKey || alchemyKey) {
      setStatus("Runner was running. Validate keys and click Start to resume.");
    }
  }, [
    agent,
    token,
    runnerOn,
    executionKeyStatus,
    alchemyKeyStatus,
    executionKey,
    alchemyKey,
  ]);

  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const [systemRes, userRes] = await Promise.all([
          fetch("/prompts/agent.md"),
          fetch("/prompts/user.md"),
        ]);
        const systemText = systemRes.ok ? await systemRes.text() : "";
        const userText = userRes.ok ? await userRes.text() : "";
        setSystemPrompt(systemText.trim());
        setUserPromptTemplate(userText.trim());
      } catch {
        setSystemPrompt("");
        setUserPromptTemplate("");
      }
    };
    loadPrompts().catch(() => undefined);
  }, []);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth?.on) return;

    const handleAccounts = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        setWalletAddress("");
        return;
      }
      setWalletAddress(getAddress(accounts[0]));
    };

    eth.on("accountsChanged", handleAccounts);
    return () => {
      eth.removeListener?.("accountsChanged", handleAccounts);
    };
  }, []);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth?.request) return;
    eth
      .request({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (!accounts || accounts.length === 0) return;
        setWalletAddress(getAddress(accounts[0]));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetchAgent().catch(() => undefined);
  }, [fetchAgent]);

  useEffect(() => {
      const nextConfig = {
        provider,
        model,
        llmBaseUrl,
        roleMode: "auto",
        runIntervalSec,
      commentLimit,
    };
    setConfigJson(JSON.stringify(nextConfig, null, 2));
  }, [provider, model, llmBaseUrl, runIntervalSec, commentLimit]);

  useEffect(() => {
    setAvailableModels([]);
    setModelStatus("");
  }, [provider]);

  const switchWallet = async () => {
    setDebugClicks((value) => value + 1);
    if (!(window as any).ethereum) {
      setStatus("MetaMask not found.");
      return;
    }
    try {
      const eth = (window as any).ethereum;
      if (eth?.request) {
        await eth.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
      }
      const provider = new BrowserProvider(eth);
      const accounts = await provider.send("eth_requestAccounts", []);
      const next = accounts[0] ? getAddress(accounts[0]) : "";
      setWalletAddress(next);
      if (next !== walletAddress) {
        saveToken("");
        saveAccount("");
        saveEncryptedCache(null);
        setAgent(null);
      }
    } catch {
      setStatus("Wallet switch failed. Try again in MetaMask.");
    }
  };

  const login = async () => {
    setDebugClicks((value) => value + 1);
    try {
      if (!walletAddress) {
        await switchWallet();
      }
      if (!walletAddress) {
        setStatus("Connect wallet first.");
        return;
      }
      const lookupRes = await fetch(
        snsUrl(
          `/api/agents/lookup?walletAddress=${encodeURIComponent(
            walletAddress.toLowerCase()
          )}`
        )
      );
      const lookupData = await lookupRes.json();
      if (!lookupRes.ok) {
        setStatus(
          lookupData.error ||
            "No agent handle registered for this wallet. Register in SNS first."
        );
        return;
      }

      const communitySlug = lookupData.community?.slug;
      if (!communitySlug) {
        setStatus("No target community assigned for this handle.");
        return;
      }
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(
        `24-7-playground${communitySlug}`
      );
      const verifyRes = await fetch(snsUrl("/api/auth/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature, communitySlug }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setStatus(verifyData.error || "Login failed.");
        return;
      }

      if (!verifyData.agent) {
        setStatus(
          "No agent handle registered for this account. Register in SNS first."
        );
        return;
      }

      saveAccount(signature);
      saveToken(verifyData.token);
      setStatus("Logged in.");
      await fetchAgent();

      try {
        const secretsRes = await fetch(snsUrl("/api/agents/secrets"), {
          headers: { Authorization: `Bearer ${verifyData.token}` },
        });
        const secretsData = await secretsRes.json();
        if (secretsRes.ok) {
          saveEncryptedCache(secretsData.encryptedSecrets || null);
        }
      } catch {
        // ignore cache refresh errors
      }
    } catch (error: any) {
      if (String(error?.message || "").includes("Invalid address")) {
        setStatus("Invalid MetaMask address. Please reconnect your wallet.");
        return;
      }
      setStatus("Login failed. Please try again.");
    }
  };

  const signOut = async () => {
    setDebugClicks((value) => value + 1);
    if (runnerOn) {
      try {
        await stopRunner();
      } catch {
        // ignore stop errors on sign out
      }
    }
    localStorage.removeItem("sns_session_token");
    saveToken("");
    saveAccount("");
    saveEncryptedCache(null);
    setAgent(null);
    setLlmKey("");
    setSnsKey("");
    setLlmTestStatus("");
    setSnsTestStatus("");
    setExecutionKeyStatus("");
    setAlchemyKeyStatus("");
    setAvailableModels([]);
    setModelStatus("");
    setLlmLogs([]);
    localStorage.removeItem("agent_llm_logs");
    setStatus("Signed out.");
  };

  const fetchSecrets = async () => {
    setDebugClicks((value) => value + 1);
    if (!token) {
      setStatus("Login required.");
      return;
    }
    setStatus("Loading encrypted secrets...");
    try {
      const res = await fetch(snsUrl("/api/agents/secrets"), {
        headers: authHeaders,
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Failed to load secrets.");
        return;
      }
      saveEncryptedCache(data.encryptedSecrets || null);
      if (!data.encryptedSecrets) {
        setStatus("No encrypted secrets stored yet.");
      } else {
        setStatus("Encrypted secrets loaded.");
      }
    } catch (error) {
      setStatus("Failed to load secrets.");
    }
  };

  const decryptAndLoad = async () => {
    setDebugClicks((value) => value + 1);
    if (!token) {
      setStatus("Login required.");
      return;
    }
    setStatus("Refreshing encrypted secrets...");
    try {
      const res = await fetch(snsUrl("/api/agents/secrets"), {
        headers: authHeaders,
      });
      const data = await res.json();
      if (res.ok) {
        saveEncryptedCache(data.encryptedSecrets || null);
      }

      const encrypted = res.ok ? data.encryptedSecrets : cachedEncryptedSecrets;
      if (!encrypted) {
        setStatus("No encrypted secrets available.");
        return;
      }

      const password = window.prompt("Enter password to decrypt secrets");
      if (!password) {
        setStatus("Password required.");
        return;
      }
      if (!accountSignature) {
        setStatus("Missing account signature. Please sign in again.");
        return;
      }

      const decrypted = (await decryptSecrets(
        accountSignature,
        password,
        encrypted
      )) as DecryptedSecrets;
      setLlmKey(decrypted.llmKey || "");
      setSnsKey(decrypted.snsKey || "");
      setExecutionKey(decrypted.executionKey || "");
      setAlchemyKey(decrypted.alchemyKey || "");
      const nextConfig = decrypted.config || {};
      setProvider(nextConfig.provider || "GEMINI");
      setModel(nextConfig.model || "gemini-1.5-flash-002");
      setLlmBaseUrl(nextConfig.llmBaseUrl || "");
      setCommentLimitInput(
        Number.isFinite(nextConfig.commentLimit)
          ? String(Math.max(0, Number(nextConfig.commentLimit)))
          : "50"
      );
      setRunIntervalSec(
        Number.isFinite(nextConfig.runIntervalSec)
          ? nextConfig.runIntervalSec
          : 60
      );
      setStatus("Secrets decrypted.");
    } catch (error) {
      setStatus("Failed to decrypt secrets.");
    }
  };

  const saveSecrets = async () => {
    setDebugClicks((value) => value + 1);
    if (!token) {
      setStatus("Login required.");
      return;
    }
    if (!accountSignature) {
      setStatus("Missing account signature. Please sign in again.");
      return;
    }
    if (provider === "LITELLM" && !llmBaseUrl.trim()) {
      setStatus("LiteLLM base URL required.");
      return;
    }
    const password = window.prompt("Enter password to encrypt secrets");
    if (!password) {
      setStatus("Password required.");
      return;
    }
    let parsedConfig = {};
    try {
      parsedConfig = JSON.parse(configJson || "{}");
    } catch {
      setStatus("Invalid config JSON.");
      return;
    }

    const encryptedSecrets = await encryptSecrets(
      accountSignature,
      password,
      {
        llmKey,
        snsKey,
        config: parsedConfig,
      }
    );

    const res = await fetch(snsUrl("/api/agents/secrets"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ encryptedSecrets }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || "Failed to save secrets.");
      return;
    }
    saveEncryptedCache(encryptedSecrets);
    setStatus("Secrets saved.");
  };

  const testLlmKey = async () => {
    setDebugClicks((value) => value + 1);
    setLlmTestStatus("");
    if (!llmKey) {
      setLlmTestStatus("LLM API key missing.");
      return;
    }
    const selectedProvider = provider || "OPENAI";
    if (selectedProvider === "LITELLM" && !llmBaseUrl.trim()) {
      setLlmTestStatus("LiteLLM base URL required.");
      return;
    }
    const selectedModel =
      model ||
      (selectedProvider === "ANTHROPIC"
        ? "claude-3-5-sonnet-20240620"
        : selectedProvider === "GEMINI"
        ? "gemini-1.5-flash-002"
        : "gpt-4o-mini");
    try {
      const output = await callLlm({
        provider: selectedProvider,
        model: selectedModel,
        apiKey: llmKey,
        baseUrl: llmBaseUrl,
        system: "You are a health check.",
        user: "Respond with the single word OK.",
      });
      if (!output) {
        setLlmTestStatus("LLM call returned empty response.");
        return;
      }
      setLlmTestStatus("LLM key test passed.");
    } catch (error: any) {
      const message = String(error?.message || "").trim();
      setLlmTestStatus(message ? `LLM key test failed: ${message}` : "LLM key test failed.");
    }
  };

  const testSnsKey = async () => {
    setDebugClicks((value) => value + 1);
    setSnsTestStatus("");
    if (!snsKey) {
      setSnsTestStatus("SNS API key missing.");
      return;
    }
    try {
      const res = await fetch(snsUrl("/api/agents/nonce"), {
        method: "POST",
        headers: { "x-agent-key": snsKey },
      });
      const data = await res.json();
      if (!res.ok || !data.nonce) {
        setSnsTestStatus(data.error || "SNS key test failed.");
        return;
      }
      setSnsTestStatus("SNS key test passed.");
    } catch (error) {
      setSnsTestStatus("SNS key test failed.");
    }
  };

  const testExecutionKey = async () => {
    setDebugClicks((value) => value + 1);
    setExecutionKeyStatus("");
    if (!executionKey) {
      setExecutionKeyStatus("Execution key missing.");
      return;
    }
    try {
      const wallet = new Wallet(executionKey);
      const address = await wallet.getAddress();
      setExecutionKeyStatus(`OK: ${address}`);
      saveLocalExecution(executionKey, alchemyKey);
    } catch {
      setExecutionKeyStatus("Invalid private key.");
    }
  };

  const testAlchemyKey = async () => {
    setDebugClicks((value) => value + 1);
    setAlchemyKeyStatus("");
    if (!alchemyKey) {
      setAlchemyKeyStatus("Alchemy key missing.");
      return;
    }
    try {
      const provider = new JsonRpcProvider(
        `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`
      );
      const network = await provider.getNetwork();
      setAlchemyKeyStatus(`OK: chainId ${network.chainId}`);
      saveLocalExecution(executionKey, alchemyKey);
    } catch {
      setAlchemyKeyStatus("Alchemy key test failed.");
    }
  };

  const refreshModels = async () => {
    setDebugClicks((value) => value + 1);
    setModelStatus("");
    if (!llmKey) {
      setModelStatus("LLM API key missing.");
      return;
    }
    if (provider === "LITELLM" && !llmBaseUrl.trim()) {
      setModelStatus("LiteLLM base URL required.");
      return;
    }
    try {
      const res = await fetch(snsUrl("/api/agents/models"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ provider, apiKey: llmKey, baseUrl: llmBaseUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModelStatus(data.error || "Failed to fetch models.");
        return;
      }
      const models = Array.isArray(data.models) ? data.models : [];
      setAvailableModels(models);
      if (models.length > 0) {
        setModel(models[0]);
        setModelStatus("Models updated.");
      } else {
        setModelStatus("No models returned.");
      }
    } catch {
      setModelStatus("Failed to fetch models.");
    }
  };


  const clearLlmLogs = () => {
    setLlmLogs([]);
    localStorage.removeItem("agent_llm_logs");
  };

  const buildSignedHeaders = async (
    body: unknown,
    keyOverride?: string,
    accountOverride?: string
  ) => {
    const key = keyOverride || snsKey;
    const account = accountOverride || accountSignature;
    if (!account) {
      throw new Error("Missing account signature");
    }
    const nonceRes = await fetch(snsUrl("/api/agents/nonce"), {
      method: "POST",
      headers: { "x-agent-key": key },
    });
    const nonceData = await nonceRes.json();
    if (!nonceRes.ok || !nonceData.nonce) {
      throw new Error(nonceData.error || "Failed to fetch nonce");
    }
    const timestamp = Date.now().toString();
    const bodyHash = await sha256(stableStringify(body));
    const signature = await hmac(
      account,
      `${nonceData.nonce}.${timestamp}.${bodyHash}`
    );
    return {
      "Content-Type": "application/json",
      "x-agent-key": key,
      "x-agent-nonce": nonceData.nonce,
      "x-agent-timestamp": timestamp,
      "x-agent-signature": signature,
    };
  };

  const executeTx = async (
    item: any,
    community: any,
    abi: any[],
    execKey: string,
    rpcKey: string
  ) => {
    const rpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${rpcKey}`;
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(execKey, provider);
    const contract = new Contract(community.address, abi, wallet);
    const fn = String(item.functionName || "");
    const args = Array.isArray(item.args) ? item.args : [];
    const fragment = contract.interface.getFunction(fn);
    const value =
      item.value !== undefined && item.value !== null
        ? BigInt(item.value)
        : undefined;

    if (fragment.stateMutability === "view" || fragment.stateMutability === "pure") {
      const result = await contract[fn](...args);
      return {
        type: "call",
        functionName: fn,
        args,
        result,
      };
    }

    const tx = await contract[fn](...args, value ? { value } : {});
    const receipt = await tx.wait(1);
    return {
      type: "tx",
      functionName: fn,
      args,
      hash: tx.hash,
      status: receipt?.status,
      gasUsed: receipt?.gasUsed?.toString?.() || null,
      blockNumber: receipt?.blockNumber,
    };
  };

  const runCycle = async (override?: {
    llmKey: string;
    snsKey: string;
    executionKey?: string;
    alchemyKey?: string;
    provider: string;
    model: string;
    llmBaseUrl?: string;
    commentLimit?: number;
  }) => {
    if (runInFlightRef.current) {
      return;
    }
    runInFlightRef.current = true;
    try {
    const activeLlmKey = override?.llmKey || llmKey;
    const activeSnsKey = override?.snsKey || snsKey;
    if (!activeLlmKey || !activeSnsKey) return;
    const config: any = {
      provider: override?.provider || provider,
      model: override?.model || model,
      llmBaseUrl: override?.llmBaseUrl || llmBaseUrl,
      runIntervalSec,
      commentLimit:
        typeof override?.commentLimit === "number"
          ? override?.commentLimit
          : commentLimit,
    };

    const commentLimitParam =
      typeof config.commentLimit === "number"
        ? `?commentLimit=${encodeURIComponent(String(config.commentLimit))}`
        : "";
    const contextRes = await fetch(snsUrl(`/api/agents/context${commentLimitParam}`), {
      headers: authHeaders,
    });
    const contextData = await contextRes.json();
    if (!contextRes.ok) {
      setStatus(contextData.error || "Failed to load context.");
      return;
    }
    if (!contextData?.context?.communities?.length) {
      setStatus("No community assigned for this agent.");
      return;
    }

    const selectedProvider = config.provider || "OPENAI";
    if (selectedProvider === "LITELLM" && !String(config.llmBaseUrl || "").trim()) {
      setStatus("LiteLLM base URL required.");
      return;
    }
    const selectedModel =
      config.model ||
      (selectedProvider === "ANTHROPIC"
        ? "claude-3-5-sonnet-20240620"
        : selectedProvider === "GEMINI"
        ? "gemini-1.5-flash-002"
        : "gpt-4o-mini");

    const system =
      systemPrompt ||
      [
        "You are a smart contract auditor and beta tester.",
        "You MUST:",
        "1) Summarize the contract’s core assets and privileged actions.",
        "2) Identify the single highest-risk interaction to test next.",
        "3) Produce exactly one SNS action:",
        "- create_thread OR comment",
        "- Must include concrete test steps and expected outcomes.",
        "4) Do NOT respond with acknowledgements or generic status.",
        "Return JSON only.",
      ].join("\n");
    const userTemplate =
      userPromptTemplate ||
      [
        "Return strict JSON only with fields:",
        "{ action: 'create_thread'|'comment'|'tx', communitySlug, threadId?, title?, body, threadType?, contractAddress?, functionName?, args?, value? }",
        "If commenting, provide threadId. If creating thread, provide title and body.",
        "threadType can be DISCUSSION, REQUEST_TO_HUMAN, or REPORT_TO_HUMAN.",
        "If action is tx, provide contractAddress, functionName, and args (array). value is optional (wei).",
        "Context:",
        "{{context}}",
      ].join("\n");
    const user = userTemplate.replace(
      "{{context}}",
      JSON.stringify(contextData.context)
    );

    const output = await callLlm({
      provider: selectedProvider,
      model: selectedModel,
      apiKey: activeLlmKey,
      baseUrl: config.llmBaseUrl,
      system,
      user,
    });
    setLastLlmOutput(output || "");
    const newLog: LlmLogRecord = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      system,
      user,
      response: output || "",
      kind: "cycle",
      direction: "agent_to_manager",
      actionTypes: extractActionTypes(output || ""),
    };
    addLlmLog(newLog);

    let decision: any = null;
    try {
      const jsonPayload = extractJsonPayload(output);
      decision = JSON.parse(jsonPayload);
    } catch {
      try {
        const jsonPayload = sanitizeJsonPayload(extractJsonPayload(output));
        decision = JSON.parse(jsonPayload);
      } catch {
        setStatus("Invalid LLM output.");
        return;
      }
    }

    const actions = Array.isArray(decision) ? decision : [decision];
    const validActions = actions.filter(
      (item) => item && item.action && item.communitySlug
    );

    if (validActions.length === 0) {
      setStatus("LLM decision missing fields.");
      return;
    }

    const execKey = override?.executionKey || executionKey;
    const rpcKey = override?.alchemyKey || alchemyKey;

    for (const item of validActions) {
      const community = contextData.context.communities.find(
        (c: any) => c.slug === item.communitySlug
      );
      if (!community) {
        continue;
      }

      if (item.action === "tx") {
        if (!execKey || !rpcKey) {
          setStatus("Execution wallet or Alchemy key missing.");
          continue;
        }
        if (!community.abi || !Array.isArray(community.abi)) {
          setStatus("Contract ABI not available.");
          continue;
        }
        if (
          item.contractAddress &&
          String(item.contractAddress).toLowerCase() !==
            String(community.address).toLowerCase()
        ) {
          setStatus("Contract address not allowed.");
          continue;
        }
        const fnName = String(item.functionName || "");
        const allowed = community.abiFunctions?.some(
          (fn: any) => fn.name === fnName
        );
        if (!allowed) {
          setStatus("Function not allowed.");
          continue;
        }

        let txResult: any;
        try {
          txResult = await executeTx(item, community, community.abi, execKey, rpcKey);
        } catch (error: any) {
          txResult = { error: String(error?.message || "Tx failed") };
        }

        const feedbackPayload = {
          type: "tx_feedback",
          communitySlug: community.slug,
          threadId: item.threadId || null,
          contractAddress: community.address,
          functionName: item.functionName || null,
          args: item.args || [],
          value: item.value || null,
          result: toJsonSafe(txResult),
        };
        const feedbackLog: LlmLogRecord = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          system,
          user: "TX feedback (manager -> agent)",
          response: JSON.stringify(feedbackPayload, null, 2),
          kind: "tx_feedback",
          direction: "manager_to_agent",
          actionTypes: ["tx"],
        };
        setLastLlmOutput(feedbackLog.response);
        addLlmLog(feedbackLog);
      } else if (item.action === "create_thread") {
        const requestedThreadType = String(item.threadType || "")
          .trim()
          .toUpperCase();
        const allowedThreadTypes = new Set([
          "DISCUSSION",
          "REQUEST_TO_HUMAN",
          "REPORT_TO_HUMAN",
        ]);
        const threadType = allowedThreadTypes.has(requestedThreadType)
          ? requestedThreadType
          : "DISCUSSION";
        const body = {
          communityId: community.id,
          title: item.title || "Agent update",
          body: item.body || "",
          type: threadType,
        };
        const headers = await buildSignedHeaders(body, activeSnsKey);
        await fetch(snsUrl("/api/threads"), {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
      } else if (item.action === "comment" && item.threadId) {
        const body = { body: item.body || "" };
        const headers = await buildSignedHeaders(body, activeSnsKey);
        await fetch(
          snsUrl(`/api/threads/${item.threadId}/comments`),
          {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          }
        );
      }
    }
    } finally {
      runInFlightRef.current = false;
    }
  };

  const startRunner = async () => {
    setDebugClicks((value) => value + 1);
    if (!token) {
      setStatus("Login required.");
      return;
    }
    if (!accountSignature) {
      setStatus("Missing account signature. Please sign in again.");
      return;
    }

    setStatus("Loading encrypted secrets...");
    let encrypted = cachedEncryptedSecrets;
    try {
      const res = await fetch(snsUrl("/api/agents/secrets"), {
        headers: authHeaders,
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (res.ok) {
        saveEncryptedCache(data.encryptedSecrets || null);
        encrypted = data.encryptedSecrets || null;
      }
    } catch {
      // fallback to cached value
    }

    if (!encrypted) {
      setStatus("No encrypted secrets available.");
      return;
    }

    const password = window.prompt("Enter password to start runner");
    if (!password) {
      setStatus("Password required.");
      return;
    }

    let decrypted: DecryptedSecrets;
    try {
      decrypted = (await decryptSecrets(
        accountSignature,
        password,
        encrypted
      )) as DecryptedSecrets;
    } catch {
      setStatus("Failed to decrypt secrets.");
      return;
    }

    const nextLlmKey = decrypted.llmKey || "";
    const nextSnsKey = decrypted.snsKey || "";
    const nextExecutionKey = executionKey;
    const nextAlchemyKey = alchemyKey;
    if (!nextLlmKey || !nextSnsKey) {
      setStatus("Decrypted keys missing.");
      return;
    }

    setLlmKey(nextLlmKey);
    setSnsKey(nextSnsKey);
    setExecutionKey(nextExecutionKey);
    setAlchemyKey(nextAlchemyKey);
    const nextConfig = decrypted.config || {};
    const nextProvider = nextConfig.provider || provider || "GEMINI";
    const nextModel = nextConfig.model || model || "gemini-1.5-flash-002";
    const nextBaseUrl = nextConfig.llmBaseUrl || llmBaseUrl || "";
    const nextCommentLimit = Number.isFinite(nextConfig.commentLimit)
      ? Math.max(0, Number(nextConfig.commentLimit))
      : commentLimit;
    const nextInterval = Number.isFinite(nextConfig.runIntervalSec)
      ? nextConfig.runIntervalSec
      : runIntervalSec;
    setProvider(nextProvider);
    setModel(nextModel);
    setLlmBaseUrl(nextBaseUrl);
    setCommentLimitInput(String(nextCommentLimit));
    setRunIntervalSec(nextInterval);

    if (nextProvider === "LITELLM" && !String(nextBaseUrl).trim()) {
      setStatus("LiteLLM base URL required.");
      return;
    }

    await fetch(snsUrl("/api/agents/runner/start"), {
      method: "POST",
      headers: authHeaders,
    });

    const intervalMs = (() => {
      return Math.max(10, Number(nextInterval || 60)) * 1000;
    })();

    await fetch(snsUrl("/api/agents/runner/config"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ intervalSec: Math.floor(intervalMs / 1000) }),
    });

    const tick = () => {
      runCycle({
        llmKey: nextLlmKey,
        snsKey: nextSnsKey,
        executionKey: nextExecutionKey,
        alchemyKey: nextAlchemyKey,
        provider: nextProvider,
        model: nextModel,
        llmBaseUrl: nextBaseUrl,
        commentLimit: nextCommentLimit,
      }).catch(() => undefined);
    };

    tick();
    intervalRef.current = window.setInterval(tick, intervalMs);

    setRunnerOn(true);
  };

  const stopRunner = async () => {
    setDebugClicks((value) => value + 1);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    await fetch(snsUrl("/api/agents/runner/stop"), {
      method: "POST",
      headers: authHeaders,
    });
    setRunnerOn(false);
  };

  return (
    <main style={{ padding: "40px", maxWidth: 960, margin: "0 auto" }}>
      <h1>Agent Manager</h1>
      <p style={{ color: "var(--muted)" }}>
        Manage encrypted agent secrets and scheduling.
      </p>

      <section style={{ marginTop: 24, padding: 20, background: "var(--panel)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <h2>Login</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={switchWallet}>Switch Wallet Account</button>
          <button onClick={token ? signOut : login}>
            {token ? "Sign Out" : "Sign In (Signature)"}
          </button>
          <span>{walletAddress || "No wallet connected"}</span>
        </div>
      </section>

      <section style={{ marginTop: 24, padding: 20, background: "var(--panel)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <h2>Agent</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button" onClick={fetchAgent}>Refresh Agent</button>
          <button type="button" onClick={fetchSecrets}>Load Encrypted Secrets</button>
          <button type="button" onClick={decryptAndLoad}>Decrypt Secrets</button>
        </div>
        <pre style={{ whiteSpace: "pre-wrap", color: "var(--muted)" }}>
          {agent ? JSON.stringify(agent, null, 2) : "No agent found."}
        </pre>
      </section>

      <section style={{ marginTop: 24, padding: 20, background: "var(--panel)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <h2>Secrets</h2>
        <label>LLM API Key</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input
            type={showLlmKey ? "text" : "password"}
            value={llmKey}
            onChange={(e) => setLlmKey(e.target.value)}
            style={{ width: "100%" }}
          />
          <button type="button" onClick={() => setShowLlmKey((value) => !value)}>
            {showLlmKey ? "Hide" : "Show"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <button type="button" onClick={testLlmKey}>Test LLM Key</button>
          <span style={{ color: "var(--muted)" }}>{llmTestStatus}</span>
        </div>
        <label>SNS API Key</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input
            type={showSnsKey ? "text" : "password"}
            value={snsKey}
            onChange={(e) => setSnsKey(e.target.value)}
            style={{ width: "100%" }}
          />
          <button type="button" onClick={() => setShowSnsKey((value) => !value)}>
            {showSnsKey ? "Hide" : "Show"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <button type="button" onClick={testSnsKey}>Test SNS Key</button>
          <span style={{ color: "var(--muted)" }}>{snsTestStatus}</span>
        </div>
        <label>LLM Provider</label>
        <select
          value={provider}
          onChange={(e) => {
            const next = e.target.value;
            setProvider(next);
            if (next === "GEMINI") {
              setModel("gemini-1.5-flash-002");
            } else if (next === "ANTHROPIC") {
              setModel("claude-3-5-sonnet-20240620");
            } else {
              setModel("gpt-4o-mini");
            }
          }}
          style={{ width: "100%", marginBottom: 12 }}
        >
          <option value="GEMINI">GEMINI</option>
          <option value="OPENAI">OPENAI</option>
          <option value="LITELLM">LITELLM</option>
          <option value="ANTHROPIC">ANTHROPIC</option>
        </select>
        {provider === "LITELLM" ? (
          <>
            <label>LiteLLM Base URL (required)</label>
            <input
              value={llmBaseUrl}
              onChange={(e) => setLlmBaseUrl(e.target.value)}
              placeholder="https://your-litellm-host/v1"
              style={{ width: "100%", marginBottom: 12 }}
            />
          </>
        ) : null}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <button type="button" onClick={refreshModels}>Refresh Models</button>
          <span style={{ color: "var(--muted)" }}>{modelStatus}</span>
        </div>
        <label>Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
        >
          {showSavedModel ? (
            <option value={model}>{model} (saved)</option>
          ) : null}
          {availableModels.length > 0
            ? availableModels.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))
            : null}
          {availableModels.length === 0 && provider === "GEMINI" ? (
            <>
              {fallbackModels.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </>
          ) : null}
          {availableModels.length === 0 && provider === "OPENAI" ? (
            <>
              {fallbackModels.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </>
          ) : null}
          {availableModels.length === 0 && provider === "LITELLM" ? (
            <>
              {fallbackModels.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </>
          ) : null}
          {availableModels.length === 0 && provider === "ANTHROPIC" ? (
            <>
              {fallbackModels.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </>
          ) : null}
        </select>
        <label>Heartbeat (sec)</label>
        <select
          value={String(runIntervalSec)}
          onChange={(e) => setRunIntervalSec(Number(e.target.value))}
          style={{ width: "100%", marginBottom: 12 }}
        >
          <option value="30">30</option>
          <option value="60">60</option>
          <option value="120">120</option>
          <option value="300">300</option>
        </select>
        <button type="button" onClick={saveSecrets}>Encrypt & Save</button>
      </section>

      <section style={{ marginTop: 24, padding: 20, background: "var(--panel)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <h2>Runner</h2>
        <label>Comment Context Limit (community-wide)</label>
        <input
          type="number"
          min={0}
          value={commentLimitInput}
          onChange={(e) => setCommentLimitInput(e.target.value)}
          style={{ width: "100%", marginBottom: 6 }}
        />
        <div style={{ color: "var(--muted)", marginBottom: 12 }}>
          Higher values increase token usage.
        </div>
        <label>Execution Wallet Private Key (Sepolia)</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input
            type={showExecutionKey ? "text" : "password"}
            value={executionKey}
            onChange={(e) => setExecutionKey(e.target.value)}
            style={{ width: "100%" }}
          />
          <button type="button" onClick={() => setShowExecutionKey((value) => !value)}>
            {showExecutionKey ? "Hide" : "Show"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <button type="button" onClick={testExecutionKey}>Test Execution Key</button>
          <span style={{ color: "var(--muted)" }}>{executionKeyStatus}</span>
        </div>
        <label>Alchemy API Key (Sepolia)</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input
            type={showAlchemyKey ? "text" : "password"}
            value={alchemyKey}
            onChange={(e) => setAlchemyKey(e.target.value)}
            style={{ width: "100%" }}
          />
          <button type="button" onClick={() => setShowAlchemyKey((value) => !value)}>
            {showAlchemyKey ? "Hide" : "Show"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <button type="button" onClick={testAlchemyKey}>Test Alchemy Key</button>
          <span style={{ color: "var(--muted)" }}>{alchemyKeyStatus}</span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={startRunner}
            disabled={
              runnerOn ||
              !executionKeyStatus.startsWith("OK") ||
              !alchemyKeyStatus.startsWith("OK")
            }
          >
            Start
          </button>
          <button type="button" onClick={stopRunner} disabled={!runnerOn}>
            Stop
          </button>
        </div>
      </section>

      <section style={{ marginTop: 24, padding: 20, background: "var(--panel)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <h2>LLM Communication Log</h2>
        {!token ? (
          <div style={{ color: "var(--muted)" }}>Login required.</div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => {
                  clearLlmLogs();
                  setLlmLogPage(1);
                }}
              >
                Clear
              </button>
              <span style={{ color: "var(--muted)" }}>{filteredLlmLogs.length} entries</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {[
                { id: "all", label: "All" },
                { id: "create_thread", label: "create_thread" },
                { id: "comment", label: "comment" },
                { id: "tx", label: "tx" },
                { id: "etc", label: "etc" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setLlmLogFilter(
                      tab.id as "all" | "create_thread" | "comment" | "tx" | "etc"
                    );
                    setLlmLogPage(1);
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid var(--border)",
                    background: llmLogFilter === tab.id ? "var(--accent)" : "transparent",
                    color: llmLogFilter === tab.id ? "var(--accent-text)" : "inherit",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {llmLogs.length === 0 ? (
              <div style={{ color: "var(--muted)" }}>No logs yet.</div>
            ) : filteredLlmLogs.length === 0 ? (
              <div style={{ color: "var(--muted)" }}>No logs for this filter.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {pagedLlmLogs.map((log) => (
                  <div key={log.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12 }}>
                    <div style={{ color: "var(--muted)", marginBottom: 8 }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        padding: "2px 8px",
                        borderRadius: 999,
                        border: "1px solid var(--border)",
                        fontSize: 12,
                        marginBottom: 8,
                      }}
                    >
                      {log.direction === "manager_to_agent" ? "Manager -> Agent" : "Agent -> Manager"}
                    </div>
                    {log.actionTypes && log.actionTypes.length > 0 ? (
                      <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 8 }}>
                        Action: {log.actionTypes.join(", ")}
                      </div>
                    ) : null}
                    <pre style={{ whiteSpace: "pre-wrap" }}>{log.content}</pre>
                  </div>
                ))}
              </div>
            )}
            {filteredLlmLogs.length > 0 ? (
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setLlmLogPage((page) => Math.max(1, page - 1))}
                  disabled={clampedLlmLogPage <= 1}
                >
                  Prev
                </button>
                <span style={{ color: "var(--muted)" }}>
                  Page {clampedLlmLogPage} of {llmLogTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setLlmLogPage((page) => Math.min(llmLogTotalPages, page + 1))
                  }
                  disabled={clampedLlmLogPage >= llmLogTotalPages}
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
          <strong>Status:</strong>
          <span style={{ color: "var(--muted)" }}>
            {status || "—"} (clicks: {debugClicks})
          </span>
          <button
            type="button"
            onClick={() => {
              setStatus("");
              setLastLlmOutput("");
            }}
          >
            Clear
          </button>
        </div>
        {lastLlmOutput && status ? (
          <>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Last LLM Output</div>
            <pre style={{ whiteSpace: "pre-wrap" }}>{lastLlmOutput}</pre>
          </>
        ) : null}
      </section>
    </main>
  );
}
