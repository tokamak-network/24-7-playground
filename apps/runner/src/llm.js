const { toErrorMessage, logJson } = require("./utils");

function normalizeProvider(value) {
  return String(value || "OPENAI").trim().toUpperCase();
}

function defaultModelForProvider(provider) {
  if (provider === "ANTHROPIC") return "claude-3-5-sonnet-20240620";
  if (provider === "GEMINI") return "gemini-1.5-flash-002";
  return "gpt-4o-mini";
}

function normalizeOpenAiBaseUrl(input) {
  const trimmed = String(input || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function trace(label, payload) {
  logJson(console, `[runner][llm] ${label}`, payload);
}

function normalizeOptionalMaxTokens(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}

function normalizeUsageNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed);
}

function normalizeUsage(provider, data) {
  const normalizedProvider = normalizeProvider(provider);
  if (normalizedProvider === "ANTHROPIC") {
    const raw =
      data && data.usage && typeof data.usage === "object" ? data.usage : null;
    const input = normalizeUsageNumber(raw && raw.input_tokens);
    const output = normalizeUsageNumber(raw && raw.output_tokens);
    const total =
      normalizeUsageNumber(raw && raw.total_tokens) ??
      (input !== null && output !== null ? input + output : null);
    return {
      inputTokens: input,
      outputTokens: output,
      totalTokens: total,
      raw,
    };
  }

  if (normalizedProvider === "GEMINI") {
    const raw =
      data && data.usageMetadata && typeof data.usageMetadata === "object"
        ? data.usageMetadata
        : null;
    const input = normalizeUsageNumber(raw && raw.promptTokenCount);
    const output = normalizeUsageNumber(raw && raw.candidatesTokenCount);
    const total =
      normalizeUsageNumber(raw && raw.totalTokenCount) ??
      (input !== null && output !== null ? input + output : null);
    return {
      inputTokens: input,
      outputTokens: output,
      totalTokens: total,
      raw,
    };
  }

  const raw = data && data.usage && typeof data.usage === "object" ? data.usage : null;
  const input =
    normalizeUsageNumber(raw && raw.prompt_tokens) ??
    normalizeUsageNumber(raw && raw.input_tokens);
  const output =
    normalizeUsageNumber(raw && raw.completion_tokens) ??
    normalizeUsageNumber(raw && raw.output_tokens);
  const total =
    normalizeUsageNumber(raw && raw.total_tokens) ??
    (input !== null && output !== null ? input + output : null);
  return {
    inputTokens: input,
    outputTokens: output,
    totalTokens: total,
    raw,
  };
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
  const maxTokens = normalizeOptionalMaxTokens(params.maxTokens);
  if (maxTokens) {
    body.max_tokens = maxTokens;
  }
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
  return {
    content: typeof content === "string" ? content : "",
    usage: normalizeUsage(params.provider || "OPENAI", data),
  };
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
    system: params.system,
    messages: [{ role: "user", content: params.user }],
  };
  const maxTokens = normalizeOptionalMaxTokens(params.maxTokens);
  if (maxTokens) {
    body.max_tokens = maxTokens;
  }
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
  return {
    content: textBlock && typeof textBlock.text === "string" ? textBlock.text : "",
    usage: normalizeUsage(params.provider || "ANTHROPIC", data),
  };
}

async function callGemini(params) {
  const model = String(params.model || "gemini-1.5-flash-002");
  const callGeminiModel = async (modelName) => {
    const endpoint =
      params.baseUrl && String(params.baseUrl).trim()
        ? String(params.baseUrl)
        : `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            modelName
          )}:generateContent?key=${encodeURIComponent(params.apiKey)}`;
    const headers = { "Content-Type": "application/json" };
    const body = {
      contents: [{ role: "user", parts: [{ text: `${params.system}\n\n${params.user}` }] }],
    };
    const maxTokens = normalizeOptionalMaxTokens(params.maxTokens);
    if (maxTokens) {
      body.generationConfig = { maxOutputTokens: maxTokens };
    }
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
      const message =
        data && data.error && data.error.message
          ? data.error.message
          : JSON.stringify(data || {});
      throw new Error(`Gemini error ${response.status}: ${message}`);
    }
    const candidate =
      data &&
      Array.isArray(data.candidates) &&
      data.candidates[0] &&
      data.candidates[0].content &&
      Array.isArray(data.candidates[0].content.parts)
        ? data.candidates[0].content.parts[0]
        : null;
    return {
      content: candidate && typeof candidate.text === "string" ? candidate.text : "",
      usage: normalizeUsage(params.provider || "GEMINI", data),
    };
  };

  try {
    return await callGeminiModel(model);
  } catch (error) {
    const message = String(error && error.message ? error.message : "");
    if (
      message.includes("404") &&
      (String(model).endsWith("-002") || String(model).endsWith("-001"))
    ) {
      const fallbackModel = String(model).replace(/-(002|001)$/, "");
      trace("gemini-fallback", {
        model,
        fallbackModel,
      });
      return callGeminiModel(fallbackModel);
    }
    throw error;
  }
}

async function callLlm(params) {
  const provider = normalizeProvider(params.provider);
  const model = String(params.model || defaultModelForProvider(provider));
  let baseUrl = String(params.baseUrl || "");
  if (provider === "LITELLM") {
    baseUrl = normalizeOpenAiBaseUrl(params.baseUrl);
    if (!baseUrl) {
      throw new Error("LiteLLM base URL missing.");
    }
  }
  trace("call", {
    provider,
    model,
    baseUrl,
    maxTokens: normalizeOptionalMaxTokens(params.maxTokens),
    apiKey: String(params.apiKey || ""),
    system: String(params.system || ""),
    user: String(params.user || ""),
  });
  if (!params.apiKey) {
    throw new Error("Missing LLM API key");
  }

  try {
    if (provider === "GEMINI") {
      const result = await callGemini({ ...params, provider, model });
      return {
        provider,
        model,
        content: String(result && result.content ? result.content : ""),
        usage: result && result.usage ? result.usage : null,
      };
    }
    if (provider === "ANTHROPIC") {
      const result = await callAnthropic({ ...params, provider, model });
      return {
        provider,
        model,
        content: String(result && result.content ? result.content : ""),
        usage: result && result.usage ? result.usage : null,
      };
    }
    const result = await callOpenAiCompatible({
      ...params,
      provider,
      model,
      baseUrl: provider === "LITELLM" ? baseUrl : params.baseUrl,
    });
    return {
      provider,
      model,
      content: String(result && result.content ? result.content : ""),
      usage: result && result.usage ? result.usage : null,
    };
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
