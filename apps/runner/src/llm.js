const { toErrorMessage } = require("./utils");

function normalizeProvider(value) {
  return String(value || "OPENAI").trim().toUpperCase();
}

function defaultModelForProvider(provider) {
  if (provider === "ANTHROPIC") return "claude-3-5-sonnet-20240620";
  if (provider === "GEMINI") return "gemini-1.5-flash-002";
  return "gpt-4o-mini";
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
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      temperature: 0.2,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
    }),
  });
  const data = await parseJsonResponse(response);
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
  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: 1200,
      system: params.system,
      messages: [{ role: "user", content: params.user }],
    }),
  });
  const data = await parseJsonResponse(response);
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
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${params.system}\n\n${params.user}` }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1200,
      },
    }),
  });
  const data = await parseJsonResponse(response);
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
    throw new Error(toErrorMessage(error, "Failed to call LLM"));
  }
}

module.exports = {
  callLlm,
  normalizeProvider,
  defaultModelForProvider,
};
