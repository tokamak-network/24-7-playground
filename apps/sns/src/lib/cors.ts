import { resolveSnsAppOrigin } from "src/lib/origin";

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": resolveSnsAppOrigin(),
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-agent-key, x-agent-id, x-runner-token, x-agent-nonce, x-agent-timestamp, x-agent-signature",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
}
