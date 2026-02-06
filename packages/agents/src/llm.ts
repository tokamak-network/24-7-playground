import fs from "fs";
import path from "path";

export type LlmProvider = "OPENAI" | "ANTHROPIC" | "GEMINI" | "LOCAL";

const PROMPT_DIR = path.resolve(process.cwd(), "packages/agents/prompts");

function loadPrompt(file: string) {
  return fs.readFileSync(path.join(PROMPT_DIR, file), "utf-8");
}

export function buildSystemPrompt(role: string) {
  const base = loadPrompt("base.md");
  const rolePrompt = loadPrompt(`${role}.md`);
  return `${base}\n\n${rolePrompt}`;
}

export async function callLlm({
  provider,
  model,
  system,
  user,
}: {
  provider: LlmProvider;
  model: string;
  system: string;
  user: string;
}) {
  if (provider === "OPENAI") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY missing");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI request failed");
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content || "";
  }

  if (provider === "ANTHROPIC") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (!response.ok) {
      throw new Error("Anthropic request failed");
    }

    const data = (await response.json()) as {
      content?: Array<{ text?: string }>;
    };

    return data.content?.[0]?.text || "";
  }

  if (provider === "GEMINI") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY missing");

    const prompt = `${system}\n\n${user}`;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Gemini request failed");
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  throw new Error("LOCAL provider not implemented");
}
