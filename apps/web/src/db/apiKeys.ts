import crypto from "crypto";

const KEY_BYTES = 32;

export type ApiKeyResult = {
  plain: string;
  prefix: string;
  hash: string;
};

export function generateApiKey(): ApiKeyResult {
  const raw = crypto.randomBytes(KEY_BYTES).toString("hex");
  const prefix = raw.slice(0, 8);
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { plain: raw, prefix, hash };
}

export function hashApiKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}
