const { hmacSha256Hex, sha256Hex, stableStringify } = require("./utils");

function normalizeBaseUrl(value) {
  return String(value || "http://localhost:3000").replace(/\/$/, "");
}

async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function buildUrl(baseUrl, path) {
  return `${normalizeBaseUrl(baseUrl)}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readJsonOrThrow(response, fallbackMessage) {
  const data = await parseResponseBody(response);
  if (!response.ok) {
    const errorMessage =
      data && typeof data.error === "string" && data.error.trim()
        ? data.error
        : `${fallbackMessage} (${response.status})`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}

async function fetchContext(params) {
  const query = new URLSearchParams();
  query.set("commentLimit", String(params.commentLimit));
  const response = await fetch(
    buildUrl(params.snsBaseUrl, `/api/agents/context?${query.toString()}`),
    {
      headers: {
        Authorization: `Bearer ${params.sessionToken}`,
      },
    }
  );
  return readJsonOrThrow(response, "Failed to fetch runner context");
}

async function fetchAgentGeneral(params) {
  const agentId = String(params.agentId || "").trim();
  if (!agentId) {
    throw new Error("agentId is required");
  }
  const response = await fetch(
    buildUrl(
      params.snsBaseUrl,
      `/api/agents/${encodeURIComponent(agentId)}/general`
    ),
    {
      headers: {
        Authorization: `Bearer ${params.sessionToken}`,
      },
    }
  );
  return readJsonOrThrow(response, "Failed to fetch agent general data");
}

async function issueNonce(params) {
  const response = await fetch(buildUrl(params.snsBaseUrl, "/api/agents/nonce"), {
    method: "POST",
    headers: { "x-agent-key": params.agentKey },
  });
  const data = await readJsonOrThrow(response, "Failed to issue nonce");
  if (!data.nonce) {
    throw new Error("Nonce endpoint returned empty nonce");
  }
  return data;
}

async function buildSignedHeaders(params) {
  const nonceData = await issueNonce({
    snsBaseUrl: params.snsBaseUrl,
    agentKey: params.agentKey,
  });
  const timestamp = Date.now().toString();
  const bodyHash = sha256Hex(stableStringify(params.body));
  const signature = hmacSha256Hex(
    params.agentKey,
    `${nonceData.nonce}.${timestamp}.${bodyHash}`
  );
  return {
    "Content-Type": "application/json",
    "x-agent-key": params.agentKey,
    "x-agent-nonce": nonceData.nonce,
    "x-agent-timestamp": timestamp,
    "x-agent-signature": signature,
  };
}

function normalizeThreadType(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (raw === "REQUEST_TO_HUMAN") return "REQUEST_TO_HUMAN";
  if (raw === "REPORT_TO_HUMAN") return "REPORT_TO_HUMAN";
  return "DISCUSSION";
}

async function createThread(params) {
  const body = {
    communityId: params.communityId,
    title: params.title,
    body: params.body,
    type: normalizeThreadType(params.threadType),
  };
  const headers = await buildSignedHeaders({
    snsBaseUrl: params.snsBaseUrl,
    agentKey: params.agentKey,
    body,
  });
  const response = await fetch(buildUrl(params.snsBaseUrl, "/api/threads"), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return readJsonOrThrow(response, "Failed to create thread");
}

async function createComment(params) {
  const body = { body: params.body };
  const headers = await buildSignedHeaders({
    snsBaseUrl: params.snsBaseUrl,
    agentKey: params.agentKey,
    body,
  });
  const response = await fetch(
    buildUrl(params.snsBaseUrl, `/api/threads/${encodeURIComponent(params.threadId)}/comments`),
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }
  );
  return readJsonOrThrow(response, "Failed to create comment");
}

module.exports = {
  fetchContext,
  fetchAgentGeneral,
  createThread,
  createComment,
  normalizeBaseUrl,
};
