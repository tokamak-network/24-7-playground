const { toErrorMessage, logJson } = require("./utils");

function normalizeProvider(value) {
  return String(value || "OPENAI").trim().toUpperCase();
}

function defaultModelForProvider(provider) {
  if (provider === "ANTHROPIC") return "claude-3-5-sonnet-20240620";
  if (provider === "GEMINI") return "gemini-1.5-flash-002";
  return "gpt-4o-mini";
}

function trace(label, payload) {
  logJson(console, `[runner][llm] ${label}`, payload);
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function callOpenAiCompatible(params) {
  const baseUrl = String(params.baseUrl || "https://api.openai.com/v1").replace(
    /\/$/,
    ""
  );
  const url = `${baseUrl}/chat/completions`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${params.apiKey}`,
  };
  const body = {
    model: params.model,
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
  };
  trace("request", {
    provider: "OPENAI_COMPATIBLE",
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
  const data = await parseJsonResponse(response);
  trace("response", {
    provider: "OPENAI_COMPATIBLE",
    method: "POST",
    url,
    status: response.status,
    ok: response.ok,
    body: data,
  });
  if (!response.ok) {
    throw new Error(
      data.error && data.error.message
        ? data.error.message
        : `LLM request failed (${response.status})`
    );
  }
  const content =
    data &&
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content;
  return typeof content === "string" ? content : "";
}

async function callAnthropic(params) {
  const baseUrl = String(params.baseUrl || "https://api.anthropic.com").replace(
    /\/$/,
    ""
  );
  const url = `${baseUrl}/v1/messages`;
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": params.apiKey,
    "anthropic-version": "2023-06-01",
  };
  const body = {
    model: params.model,
    max_tokens: 1200,
    system: params.system,
    messages: [{ role: "user", content: params.user }],
  };
  trace("request", {
    provider: "ANTHROPIC",
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
  const data = await parseJsonResponse(response);
  trace("response", {
    provider: "ANTHROPIC",
    method: "POST",
    url,
    status: response.status,
    ok: response.ok,
    body: data,
  });
  if (!response.ok) {
    throw new Error(
      data.error && data.error.message
        ? data.error.message
        : `LLM request failed (${response.status})`
    );
  }
  const blocks = Array.isArray(data.content) ? data.content : [];
  const textBlock = blocks.find((block) => block && block.type === "text");
  return textBlock && typeof textBlock.text === "string" ? textBlock.text : "";
}

async function callGemini(params) {
  const model = String(params.model || "gemini-1.5-flash-002");
  const endpoint =
    params.baseUrl && String(params.baseUrl).trim()
      ? String(params.baseUrl)
      : `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model
        )}:generateContent?key=${encodeURIComponent(params.apiKey)}`;
  const headers = { "Content-Type": "application/json" };
  const body = {
    contents: [{ role: "user", parts: [{ text: `${params.system}\n\n${params.user}` }] }],
    generationConfig: {
      maxOutputTokens: 1200,
    },
  };
  trace("request", {
    provider: "GEMINI",
    method: "POST",
    url: endpoint,
    headers,
    body,
  });
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await parseJsonResponse(response);
  trace("response", {
    provider: "GEMINI",
    method: "POST",
    url: endpoint,
    status: response.status,
    ok: response.ok,
    body: data,
  });
  if (!response.ok) {
    throw new Error(
      data.error && data.error.message
        ? data.error.message
        : `LLM request failed (${response.status})`
    );
  }
  const candidate =
    data &&
    Array.isArray(data.candidates) &&
    data.candidates[0] &&
    data.candidates[0].content &&
    Array.isArray(data.candidates[0].content.parts)
      ? data.candidates[0].content.parts[0]
      : null;
  return candidate && typeof candidate.text === "string" ? candidate.text : "";
}

async function callLlm(params) {
  const provider = normalizeProvider(params.provider);
  const model = String(params.model || defaultModelForProvider(provider));
  trace("call", {
    provider,
    model,
    baseUrl: String(params.baseUrl || ""),
    apiKey: String(params.apiKey || ""),
    system: String(params.system || ""),
    user: String(params.user || ""),
  });
  if (!params.apiKey) {
    throw new Error("Missing LLM API key");
  }

  try {
    if (provider === "GEMINI") {
      return await callGemini({ ...params, provider, model });
    }
    if (provider === "ANTHROPIC") {
      return await callAnthropic({ ...params, provider, model });
    }
    return await callOpenAiCompatible({ ...params, provider, model });
  } catch (error) {
    trace("error", {
      provider,
      model,
      error: toErrorMessage(error, "Failed to call LLM"),
    });
    throw new Error(toErrorMessage(error, "Failed to call LLM"));
  }
}

module.exports = {
  callLlm,
  normalizeProvider,
  defaultModelForProvider,
};
