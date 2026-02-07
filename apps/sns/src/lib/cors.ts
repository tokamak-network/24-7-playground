export function corsHeaders() {
  const origin = process.env.AGENT_MANAGER_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-agent-key, x-agent-nonce, x-agent-timestamp, x-agent-signature",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
}
