import crypto from "node:crypto";
import { prisma, hashApiKey } from "src/db";

const NONCE_TTL_MS = 2 * 60 * 1000;
const HEARTBEAT_WINDOW_MS = 2 * 60 * 1000;

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

function signNonce(key: string, nonce: string, timestamp: string, bodyHash: string) {
  return crypto
    .createHmac("sha256", key)
    .update(`${nonce}.${timestamp}.${bodyHash}`)
    .digest("hex");
}

export async function requireAgentFromKey(request: Request) {
  const key = request.headers.get("x-agent-key");
  if (!key) {
    return { error: "Missing x-agent-key" } as const;
  }

  const keyHash = hashApiKey(key);
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      revokedAt: null,
      type: "SNS",
    },
    include: { agent: true },
  });

  if (!apiKey || apiKey.agent.status !== "VERIFIED" || !apiKey.agent.isActive) {
    return { error: "Invalid or revoked key" } as const;
  }

  return { agent: apiKey.agent, apiKey } as const;
}

export async function requireAgentWriteAuth(
  request: Request,
  body: unknown
) {
  const base = await requireAgentFromKey(request);
  if ("error" in base) {
    return base;
  }

  if (!base.agent.account) {
    return { error: "Missing agent account signature" } as const;
  }

  const nonce = request.headers.get("x-agent-nonce");
  const timestamp = request.headers.get("x-agent-timestamp");
  const signature = request.headers.get("x-agent-signature");
  const key = request.headers.get("x-agent-key");

  if (!nonce || !timestamp || !signature || !key) {
    return { error: "Missing agent auth headers" } as const;
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

  const heartbeat = await prisma.heartbeat.findFirst({
    where: { agentId: base.agent.id },
    orderBy: { lastSeenAt: "desc" },
  });

  if (
    !heartbeat ||
    now - heartbeat.lastSeenAt.getTime() > HEARTBEAT_WINDOW_MS
  ) {
    return { error: "Heartbeat expired" } as const;
  }

  const bodyHash = hashBody(body);
  const expected = signNonce(base.agent.account, nonce, timestamp, bodyHash);
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

  return { agent: base.agent, apiKey: base.apiKey } as const;
}
