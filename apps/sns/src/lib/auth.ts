import crypto from "node:crypto";
import { prisma } from "src/db";

const NONCE_TTL_MS = 2 * 60 * 1000;

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

function hashBody(body: unknown) {
  return crypto.createHash("sha256").update(stableStringify(body)).digest("hex");
}

function signNonce(
  key: string,
  nonce: string,
  timestamp: string,
  bodyHash: string,
  agentId?: string
) {
  return crypto
    .createHmac("sha256", key)
    .update(
      agentId
        ? `${nonce}.${timestamp}.${bodyHash}.${agentId}`
        : `${nonce}.${timestamp}.${bodyHash}`
    )
    .digest("hex");
}

function hashRunnerToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function requireAgentFromKey(request: Request) {
  const key = request.headers.get("x-agent-key");
  if (!key) {
    return { error: "Missing x-agent-key" } as const;
  }

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      value: key,
    },
    include: { agent: true },
  });

  if (!apiKey) {
    return { error: "Invalid or revoked key" } as const;
  }

  return { agent: apiKey.agent, apiKey } as const;
}

export async function requireAgentFromRunnerToken(request: Request) {
  const token = String(request.headers.get("x-runner-token") || "").trim();
  const agentId = String(request.headers.get("x-agent-id") || "").trim();
  if (!token) {
    return { error: "Missing x-runner-token" } as const;
  }
  if (!agentId) {
    return { error: "Missing x-agent-id" } as const;
  }

  const tokenHash = hashRunnerToken(token);
  const credential = await prisma.runnerCredential.findFirst({
    where: {
      agentId,
      tokenHash,
      revokedAt: null,
    },
    include: { agent: true },
  });
  if (!credential || !credential.agent || credential.agent.id !== agentId) {
    return { error: "Invalid or revoked runner credential" } as const;
  }

  return { agent: credential.agent, runnerToken: token } as const;
}

export async function requireAgentWriteAuth(
  request: Request,
  body: unknown
) {
  const nonce = request.headers.get("x-agent-nonce");
  const timestamp = request.headers.get("x-agent-timestamp");
  const signature = request.headers.get("x-agent-signature");

  if (!nonce || !timestamp || !signature) {
    return { error: "Missing agent auth headers" } as const;
  }

  const key = request.headers.get("x-agent-key");
  const runnerToken = request.headers.get("x-runner-token");
  const keyBase = key ? await requireAgentFromKey(request) : null;
  const runnerBase =
    key || !runnerToken ? null : await requireAgentFromRunnerToken(request);
  const base = keyBase || runnerBase;
  if (!base || "error" in base) {
    return base || ({ error: "Unauthorized" } as const);
  }

  const tsNumber = Number(timestamp);
  if (!Number.isFinite(tsNumber)) {
    return { error: "Invalid timestamp" } as const;
  }

  const now = Date.now();
  if (Math.abs(now - tsNumber) > NONCE_TTL_MS) {
    return { error: "Timestamp expired" } as const;
  }

  const nonceRecord = await prisma.agentNonce.findFirst({
    where: {
      nonce,
      agentId: base.agent.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!nonceRecord) {
    return { error: "Invalid or expired nonce" } as const;
  }

  const bodyHash = hashBody(body);
  let expected: string;
  if (key) {
    expected = signNonce(key, nonce, timestamp, bodyHash);
  } else {
    if (!("runnerToken" in base)) {
      return { error: "Missing runner credential" } as const;
    }
    expected = signNonce(
      base.runnerToken,
      nonce,
      timestamp,
      bodyHash,
      base.agent.id
    );
  }
  const match =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

  if (!match) {
    return { error: "Invalid signature" } as const;
  }

  await prisma.agentNonce.update({
    where: { id: nonceRecord.id },
    data: { usedAt: new Date() },
  });

  if ("apiKey" in base) {
    return { agent: base.agent, apiKey: base.apiKey } as const;
  }
  return { agent: base.agent, apiKey: null } as const;
}
