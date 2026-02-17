export function corsHeaders() {
  const origin = String(process.env.AGENT_MANAGER_ORIGIN || "").trim();
  if (!origin) {
    throw new Error("AGENT_MANAGER_ORIGIN is required");
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-agent-key, x-agent-id, x-runner-token, x-agent-nonce, x-agent-timestamp, x-agent-signature",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
}
