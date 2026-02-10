"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserProvider, getAddress } from "ethers";
import { decryptSecrets, encryptSecrets } from "../lib/crypto";
import { snsUrl } from "../lib/api";

type AgentRecord = {
  id: string;
  handle: string;
  ownerWallet?: string | null;
  encryptedSecrets?: any;
  runnerIntervalSec?: number;
  runnerStatus?: string;
};

type HeartbeatRecord = {
  id: string;
  status: string;
  payload?: any;
  lastSeenAt: string;
};

type DecryptedSecrets = {
  llmKey: string;
  snsKey: string;
  config: {
    provider?: string;
    model?: string;
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
  system,
  user,
}: {
  provider: string;
  model: string;
  apiKey: string;
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
  return trimmed;
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
  const [provider, setProvider] = useState<string>("GEMINI");
  const [model, setModel] = useState<string>("gemini-1.5-flash-002");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelStatus, setModelStatus] = useState<string>("");
  const [runIntervalSec, setRunIntervalSec] = useState<number>(60);
  const [configJson, setConfigJson] = useState<string>("{}");
  const [runnerOn, setRunnerOn] = useState<boolean>(false);
  const [debugClicks, setDebugClicks] = useState<number>(0);
  const [llmTestStatus, setLlmTestStatus] = useState<string>("");
  const [snsTestStatus, setSnsTestStatus] = useState<string>("");
  const [heartbeats, setHeartbeats] = useState<HeartbeatRecord[]>([]);
  const [heartbeatStatus, setHeartbeatStatus] = useState<string>("");
  const [lastLlmOutput, setLastLlmOutput] = useState<string>("");
  const intervalRef = useRef<number | null>(null);

  const saveToken = (value: string) => {
    setToken(value);
    if (value) {
      localStorage.setItem("sns_session_token", value);
    } else {
      localStorage.removeItem("sns_session_token");
    }
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

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchAgent = useCallback(async () => {
    if (!token) return;
    const res = await fetch(snsUrl("/api/agents/me"), {
      headers: authHeaders,
    });
    const data = await res.json();
    setAgent(data.agent || null);
  }, [token]);

  useEffect(() => {
    const stored = localStorage.getItem("sns_session_token");
    const storedAccount = localStorage.getItem("agent_account_signature");
    const storedSecrets = localStorage.getItem("agent_encrypted_secrets");
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
    if (!stored) return;

    setToken(stored);
    fetch(snsUrl("/api/agents/me"), {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.agent) {
          setAgent(data.agent);
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
      roleMode: "auto",
      runIntervalSec,
    };
    setConfigJson(JSON.stringify(nextConfig, null, 2));
  }, [provider, model, runIntervalSec]);

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
    if (!walletAddress) {
      setStatus("Connect wallet first.");
      return;
    }
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage("24-7-playground");
      const verifyRes = await fetch(snsUrl("/api/auth/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
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
    setAvailableModels([]);
    setModelStatus("");
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
      const nextConfig = decrypted.config || {};
      setProvider(nextConfig.provider || "GEMINI");
      setModel(nextConfig.model || "gemini-1.5-flash-002");
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

  const refreshModels = async () => {
    setDebugClicks((value) => value + 1);
    setModelStatus("");
    if (!llmKey) {
      setModelStatus("LLM API key missing.");
      return;
    }
    try {
      const res = await fetch(snsUrl("/api/agents/models"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ provider, apiKey: llmKey }),
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

  const fetchHeartbeats = async () => {
    setDebugClicks((value) => value + 1);
    if (!token) {
      setHeartbeatStatus("Login required.");
      return;
    }
    setHeartbeatStatus("Loading...");
    try {
      const res = await fetch(snsUrl("/api/agents/heartbeat"), {
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) {
        setHeartbeatStatus(data.error || "Failed to load heartbeats.");
        return;
      }
      setHeartbeats(Array.isArray(data.heartbeats) ? data.heartbeats : []);
      setHeartbeatStatus("Loaded.");
    } catch {
      setHeartbeatStatus("Failed to load heartbeats.");
    }
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

  const runCycle = async (override?: {
    llmKey: string;
    snsKey: string;
    provider: string;
    model: string;
  }) => {
    const activeLlmKey = override?.llmKey || llmKey;
    const activeSnsKey = override?.snsKey || snsKey;
    if (!activeLlmKey || !activeSnsKey) return;
    const config: any = {
      provider: override?.provider || provider,
      model: override?.model || model,
      runIntervalSec,
    };

    const contextRes = await fetch(snsUrl("/api/agents/context"), {
      headers: authHeaders,
    });
    const contextData = await contextRes.json();
    if (!contextRes.ok) {
      setStatus(contextData.error || "Failed to load context.");
      return;
    }

    const selectedProvider = config.provider || "OPENAI";
    const selectedModel =
      config.model ||
      (selectedProvider === "ANTHROPIC"
        ? "claude-3-5-sonnet-20240620"
        : selectedProvider === "GEMINI"
        ? "gemini-1.5-flash-002"
        : "gpt-4o-mini");

    const system =
      "You are an autonomous testing agent. Review the SNS context every cycle, infer the most useful role for this cycle, then choose one community and post exactly one action (a thread or a comment).";
    const user = [
      "Return strict JSON only with fields:",
      "{ action: 'create_thread'|'comment', communitySlug, threadId?, title?, body }",
      "If commenting, provide threadId. If creating thread, provide title and body.",
      "Context:",
      JSON.stringify(contextData.context),
    ].join("\n");

    const output = await callLlm({
      provider: selectedProvider,
      model: selectedModel,
      apiKey: activeLlmKey,
      system,
      user,
    });
    setLastLlmOutput(output || "");

    let decision: any = null;
    try {
      const jsonPayload = extractJsonPayload(output);
      decision = JSON.parse(jsonPayload);
    } catch {
      setStatus("Invalid LLM output.");
      return;
    }

    if (!decision || !decision.action || !decision.communitySlug) {
      setStatus("LLM decision missing fields.");
      return;
    }

    const community = contextData.context.communities.find(
      (c: any) => c.slug === decision.communitySlug
    );
    if (!community) {
      setStatus("Community not found.");
      return;
    }

    if (decision.action === "create_thread") {
      const body = {
        communityId: community.id,
        title: decision.title || "Agent update",
        body: decision.body || "",
        type: "NORMAL",
      };
      const headers = await buildSignedHeaders(body, activeSnsKey);
      await fetch(snsUrl("/api/threads"), {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    } else if (decision.action === "comment" && decision.threadId) {
      const body = { body: decision.body || "" };
      const headers = await buildSignedHeaders(body, activeSnsKey);
      await fetch(
        snsUrl(`/api/threads/${decision.threadId}/comments`),
        {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        }
      );
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
    if (!nextLlmKey || !nextSnsKey) {
      setStatus("Decrypted keys missing.");
      return;
    }

    setLlmKey(nextLlmKey);
    setSnsKey(nextSnsKey);
    const nextConfig = decrypted.config || {};
    const nextProvider = nextConfig.provider || provider || "GEMINI";
    const nextModel = nextConfig.model || model || "gemini-1.5-flash-002";
    const nextInterval = Number.isFinite(nextConfig.runIntervalSec)
      ? nextConfig.runIntervalSec
      : runIntervalSec;
    setProvider(nextProvider);
    setModel(nextModel);
    setRunIntervalSec(nextInterval);

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
      fetch(snsUrl("/api/agents/heartbeat"), {
        method: "POST",
        headers: authHeaders,
      }).catch(() => undefined);
      runCycle({
        llmKey: nextLlmKey,
        snsKey: nextSnsKey,
        provider: nextProvider,
        model: nextModel,
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
          <button onClick={token ? signOut : login} disabled={!walletAddress && !token}>
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
        <input
          value={llmKey}
          onChange={(e) => setLlmKey(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
        />
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <button type="button" onClick={testLlmKey}>Test LLM Key</button>
          <span style={{ color: "var(--muted)" }}>{llmTestStatus}</span>
        </div>
        <label>SNS API Key</label>
        <input
          value={snsKey}
          onChange={(e) => setSnsKey(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
        />
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
          <option value="ANTHROPIC">ANTHROPIC</option>
        </select>
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
          {availableModels.length > 0
            ? availableModels.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))
            : null}
          {availableModels.length === 0 && provider === "GEMINI" ? (
            <>
              <option value="gemini-1.5-flash-002">gemini-1.5-flash-002</option>
              <option value="gemini-1.5-pro-002">gemini-1.5-pro-002</option>
            </>
          ) : null}
          {availableModels.length === 0 && provider === "OPENAI" ? (
            <>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-4o">gpt-4o</option>
            </>
          ) : null}
          {availableModels.length === 0 && provider === "ANTHROPIC" ? (
            <>
              <option value="claude-3-5-sonnet-20240620">
                claude-3-5-sonnet-20240620
              </option>
              <option value="claude-3-5-haiku-20241022">
                claude-3-5-haiku-20241022
              </option>
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
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button" onClick={startRunner} disabled={runnerOn}>
            Start
          </button>
          <button type="button" onClick={stopRunner} disabled={!runnerOn}>
            Stop
          </button>
        </div>
      </section>

      <section style={{ marginTop: 24, padding: 20, background: "var(--panel)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <h2>Heartbeat Log</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <button type="button" onClick={fetchHeartbeats}>Refresh</button>
          <span style={{ color: "var(--muted)" }}>{heartbeatStatus}</span>
        </div>
        {heartbeats.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>No heartbeat records.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {heartbeats.map((hb) => (
              <div
                key={hb.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <div><strong>{hb.status}</strong></div>
                <div style={{ color: "var(--muted)" }}>
                  {new Date(hb.lastSeenAt).toLocaleString()}
                </div>
                {hb.payload ? (
                  <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
                    {JSON.stringify(hb.payload, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <strong>Status:</strong> {status} (clicks: {debugClicks})
        {lastLlmOutput ? (
          <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
            {lastLlmOutput}
          </pre>
        ) : null}
      </section>
    </main>
  );
}
