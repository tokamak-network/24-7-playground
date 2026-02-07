"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserProvider } from "ethers";
import { SiweMessage } from "siwe";
import { decryptSecrets, encryptSecrets } from "../lib/crypto";
import { snsUrl } from "../lib/api";

type AgentRecord = {
  id: string;
  handle: string;
  ownerWallet?: string | null;
  encryptionSalt?: string | null;
  encryptedSecrets?: any;
  runnerIntervalSec?: number;
  runnerStatus?: string;
};

type DecryptedSecrets = {
  llmKey: string;
  snsKey: string;
  config: {
    provider?: string;
    model?: string;
    roleIndex?: number;
    runIntervalSec?: number;
    maxActionsPerCycle?: number;
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

    const data = await response.json();
    return data?.content?.[0]?.text || "";
  }

  if (provider === "GEMINI") {
    const prompt = `${system}\n\n${user}`;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  return "";
}

export default function AgentManagerPage() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [agent, setAgent] = useState<AgentRecord | null>(null);
  const [status, setStatus] = useState<string>("");
  const [llmKey, setLlmKey] = useState<string>("");
  const [snsKey, setSnsKey] = useState<string>("");
  const [configJson, setConfigJson] = useState<string>("{}");
  const [runnerOn, setRunnerOn] = useState<boolean>(false);
  const intervalRef = useRef<number | null>(null);
  const heartbeatRef = useRef<number | null>(null);

  const saveToken = (value: string) => {
    setToken(value);
    if (value) {
      localStorage.setItem("sns_session_token", value);
    } else {
      localStorage.removeItem("sns_session_token");
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
    if (stored) {
      setToken(stored);
    }
  }, []);

  useEffect(() => {
    fetchAgent().catch(() => undefined);
  }, [fetchAgent]);

  const connectWallet = async () => {
    if (!(window as any).ethereum) {
      setStatus("MetaMask not found.");
      return;
    }
    const provider = new BrowserProvider((window as any).ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setWalletAddress(accounts[0] || "");
  };

  const login = async () => {
    if (!walletAddress) {
      setStatus("Connect wallet first.");
      return;
    }
    const nonceRes = await fetch(snsUrl("/api/auth/nonce"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress }),
    });
    const nonceData = await nonceRes.json();
    if (!nonceRes.ok) {
      setStatus(nonceData.error || "Nonce request failed.");
      return;
    }

    const provider = new BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();
    const snsBase = new URL(snsUrl("/"));

    const message = new SiweMessage({
      domain: snsBase.host,
      address: walletAddress,
      statement: "Sign in to Agent Manager.",
      uri: snsBase.origin,
      version: "1",
      chainId: Number(network.chainId),
      nonce: nonceData.nonce,
    }).prepareMessage();

    const signature = await signer.signMessage(message);
    const verifyRes = await fetch(snsUrl("/api/auth/verify"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, signature }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) {
      setStatus(verifyData.error || "Login failed.");
      return;
    }

    saveToken(verifyData.token);
    setStatus("Logged in.");
    await fetchAgent();
  };

  const fetchSecrets = async () => {
    if (!token) return;
    const res = await fetch(snsUrl("/api/agents/secrets"), {
      headers: authHeaders,
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || "Failed to load secrets.");
      return;
    }
    setAgent((prev) => (prev ? { ...prev, ...data } : data));
  };

  const decryptAndLoad = async () => {
    if (!agent?.encryptionSalt || !agent?.encryptedSecrets) {
      setStatus("No encrypted secrets available.");
      return;
    }
    const provider = new BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(
      `Agent Manager Encryption: ${agent.encryptionSalt}`
    );
    const decrypted = (await decryptSecrets(
      signature,
      agent.encryptionSalt,
      agent.encryptedSecrets
    )) as DecryptedSecrets;
    setLlmKey(decrypted.llmKey || "");
    setSnsKey(decrypted.snsKey || "");
    setConfigJson(JSON.stringify(decrypted.config || {}, null, 2));
    setStatus("Secrets decrypted.");
  };

  const saveSecrets = async () => {
    if (!agent?.encryptionSalt) {
      setStatus("Missing encryption salt.");
      return;
    }
    const provider = new BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(
      `Agent Manager Encryption: ${agent.encryptionSalt}`
    );
    let parsedConfig = {};
    try {
      parsedConfig = JSON.parse(configJson || "{}");
    } catch {
      setStatus("Invalid config JSON.");
      return;
    }

    const encryptedSecrets = await encryptSecrets(
      signature,
      agent.encryptionSalt,
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
    setStatus("Secrets saved.");
  };

  const buildSignedHeaders = async (body: unknown) => {
    const nonceRes = await fetch(snsUrl("/api/agents/nonce"), {
      method: "POST",
      headers: { "x-agent-key": snsKey },
    });
    const nonceData = await nonceRes.json();
    if (!nonceRes.ok || !nonceData.nonce) {
      throw new Error(nonceData.error || "Failed to fetch nonce");
    }
    const timestamp = Date.now().toString();
    const bodyHash = await sha256(stableStringify(body));
    const signature = await hmac(
      snsKey,
      `${nonceData.nonce}.${timestamp}.${bodyHash}`
    );
    return {
      "Content-Type": "application/json",
      "x-agent-key": snsKey,
      "x-agent-nonce": nonceData.nonce,
      "x-agent-timestamp": timestamp,
      "x-agent-signature": signature,
    };
  };

  const runCycle = async () => {
    if (!llmKey || !snsKey) return;
    let config: any = {};
    try {
      config = JSON.parse(configJson || "{}");
    } catch {
      return;
    }

    const contextRes = await fetch(snsUrl("/api/agents/context"), {
      headers: authHeaders,
    });
    const contextData = await contextRes.json();
    if (!contextRes.ok) {
      setStatus(contextData.error || "Failed to load context.");
      return;
    }

    const provider = config.provider || "OPENAI";
    const model =
      config.model ||
      (provider === "ANTHROPIC"
        ? "claude-3-5-sonnet-20240620"
        : provider === "GEMINI"
        ? "gemini-1.5-flash"
        : "gpt-4o-mini");

    const system =
      "You are an autonomous testing agent. Choose a community and decide an action.";
    const user = [
      "Return strict JSON only with fields:",
      "{ action: 'create_thread'|'comment', communitySlug, threadId?, title?, body }",
      "If commenting, provide threadId. If creating thread, provide title and body.",
      "Context:",
      JSON.stringify(contextData.context),
    ].join("\n");

    const output = await callLlm({
      provider,
      model,
      apiKey: llmKey,
      system,
      user,
    });

    let decision: any = null;
    try {
      decision = JSON.parse(output);
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
      const headers = await buildSignedHeaders(body);
      await fetch(snsUrl("/api/threads"), {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    } else if (decision.action === "comment" && decision.threadId) {
      const body = { body: decision.body || "" };
      const headers = await buildSignedHeaders(body);
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
    if (!token) return;
    if (!llmKey || !snsKey) {
      setStatus("Decrypt secrets before running.");
      return;
    }

    await fetch(snsUrl("/api/agents/runner/start"), {
      method: "POST",
      headers: authHeaders,
    });

    const intervalMs = (() => {
      try {
        const parsed = JSON.parse(configJson || "{}");
        return Math.max(10, Number(parsed.runIntervalSec || 60)) * 1000;
      } catch {
        return 60_000;
      }
    })();

    await fetch(snsUrl("/api/agents/runner/config"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ intervalSec: Math.floor(intervalMs / 1000) }),
    });

    intervalRef.current = window.setInterval(() => {
      runCycle().catch(() => undefined);
    }, intervalMs);

    heartbeatRef.current = window.setInterval(() => {
      fetch(snsUrl("/api/agents/heartbeat"), {
        method: "POST",
        headers: authHeaders,
      }).catch(() => undefined);
    }, 60_000);

    fetch(snsUrl("/api/agents/heartbeat"), {
      method: "POST",
      headers: authHeaders,
    }).catch(() => undefined);

    setRunnerOn(true);
  };

  const stopRunner = async () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
    intervalRef.current = null;
    heartbeatRef.current = null;
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
          <button onClick={connectWallet}>Connect Wallet</button>
          <button onClick={login}>Login (SIWE)</button>
          <span>{walletAddress || "No wallet connected"}</span>
        </div>
      </section>

      <section style={{ marginTop: 24, padding: 20, background: "var(--panel)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <h2>Agent</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={fetchAgent}>Refresh Agent</button>
          <button onClick={fetchSecrets}>Load Encrypted Secrets</button>
          <button onClick={decryptAndLoad}>Decrypt Secrets</button>
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
        <label>SNS API Key</label>
        <input
          value={snsKey}
          onChange={(e) => setSnsKey(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
        />
        <label>Agent Config (JSON)</label>
        <textarea
          value={configJson}
          onChange={(e) => setConfigJson(e.target.value)}
          rows={8}
          style={{ width: "100%", marginBottom: 12 }}
        />
        <button onClick={saveSecrets}>Encrypt & Save</button>
      </section>

      <section style={{ marginTop: 24, padding: 20, background: "var(--panel)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <h2>Runner</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={startRunner} disabled={runnerOn}>
            Start
          </button>
          <button onClick={stopRunner} disabled={!runnerOn}>
            Stop
          </button>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <strong>Status:</strong> {status}
      </section>
    </main>
  );
}
