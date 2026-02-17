const { hmacSha256Hex, sha256Hex, stableStringify, logJson } = require("./utils");

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

function trace(label, payload) {
  logJson(console, `[runner][sns] ${label}`, payload);
}

async function readJsonOrThrow(response, fallbackMessage, meta) {
  const data = await parseResponseBody(response);
  trace("response", {
    request: meta || null,
    status: response.status,
    ok: response.ok,
    body: data,
  });
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
  query.set("agentId", String(params.agentId || ""));
  const url = buildUrl(params.snsBaseUrl, `/api/agents/context?${query.toString()}`);
  const headers = {
    "x-runner-token": params.runnerToken,
    "x-agent-id": params.agentId,
  };
  trace("request", {
    name: "fetchContext",
    method: "GET",
    url,
    headers,
  });
  const response = await fetch(
    url,
    { headers }
  );
  return readJsonOrThrow(response, "Failed to fetch runner context", {
    name: "fetchContext",
    method: "GET",
    url,
    headers,
  });
}

async function fetchAgentGeneral(params) {
  const agentId = String(params.agentId || "").trim();
  if (!agentId) {
    throw new Error("agentId is required");
  }
  const url = buildUrl(
    params.snsBaseUrl,
    `/api/agents/${encodeURIComponent(agentId)}/general`
  );
  const headers = {
    "x-runner-token": params.runnerToken,
    "x-agent-id": agentId,
  };
  trace("request", {
    name: "fetchAgentGeneral",
    method: "GET",
    url,
    headers,
  });
  const response = await fetch(
    url,
    { headers }
  );
  return readJsonOrThrow(response, "Failed to fetch agent general data", {
    name: "fetchAgentGeneral",
    method: "GET",
    url,
    headers,
  });
}

async function issueNonce(params) {
  const url = buildUrl(params.snsBaseUrl, "/api/agents/nonce");
  const headers = {
    "x-runner-token": params.runnerToken,
    "x-agent-id": params.agentId,
  };
  trace("request", {
    name: "issueNonce",
    method: "POST",
    url,
    headers,
  });
  const response = await fetch(url, {
    method: "POST",
    headers,
  });
  const data = await readJsonOrThrow(response, "Failed to issue nonce", {
    name: "issueNonce",
    method: "POST",
    url,
    headers,
  });
  if (!data.nonce) {
    throw new Error("Nonce endpoint returned empty nonce");
  }
  return data;
}

async function buildSignedHeaders(params) {
  const nonceData = await issueNonce({
    snsBaseUrl: params.snsBaseUrl,
    runnerToken: params.runnerToken,
    agentId: params.agentId,
  });
  const timestamp = Date.now().toString();
  const bodyHash = sha256Hex(stableStringify(params.body));
  const signature = hmacSha256Hex(
    params.runnerToken,
    `${nonceData.nonce}.${timestamp}.${bodyHash}.${params.agentId}`
  );
  const signed = {
    "Content-Type": "application/json",
    "x-runner-token": params.runnerToken,
    "x-agent-id": params.agentId,
    "x-agent-nonce": nonceData.nonce,
    "x-agent-timestamp": timestamp,
    "x-agent-signature": signature,
  };
  trace("signed-headers", {
    name: "buildSignedHeaders",
    body: params.body,
    nonceData,
    signed,
  });
  return signed;
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
  const url = buildUrl(params.snsBaseUrl, "/api/threads");
  const headers = await buildSignedHeaders({
    snsBaseUrl: params.snsBaseUrl,
    runnerToken: params.runnerToken,
    agentId: params.agentId,
    body,
  });
  trace("request", {
    name: "createThread",
    method: "POST",
    url,
    headers,
    body,
  });
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return readJsonOrThrow(response, "Failed to create thread", {
    name: "createThread",
    method: "POST",
    url,
    headers,
    body,
  });
}

async function createComment(params) {
  const body = { body: params.body };
  const url = buildUrl(
    params.snsBaseUrl,
    `/api/threads/${encodeURIComponent(params.threadId)}/comments`
  );
  const headers = await buildSignedHeaders({
    snsBaseUrl: params.snsBaseUrl,
    runnerToken: params.runnerToken,
    agentId: params.agentId,
    body,
  });
  trace("request", {
    name: "createComment",
    method: "POST",
    url,
    headers,
    body,
  });
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return readJsonOrThrow(response, "Failed to create comment", {
    name: "createComment",
    method: "POST",
    url,
    headers,
    body,
  });
}

module.exports = {
  fetchContext,
  fetchAgentGeneral,
  createThread,
  createComment,
  normalizeBaseUrl,
};
