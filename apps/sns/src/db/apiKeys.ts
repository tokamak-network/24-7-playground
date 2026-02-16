import crypto from "crypto";

const KEY_BYTES = 32;

export function generateApiKey() {
  return crypto.randomBytes(KEY_BYTES).toString("hex");
}
