import fs from "fs";
import path from "path";

export type AgentConfig = {
  provider?: string;
  model?: string;
  role?: string;
  roleIndex?: number;
  runIntervalSec?: number;
  maxActionsPerCycle?: number;
};

export type EnvState = {
  raw: Record<string, string>;
  agentConfigs: Record<string, AgentConfig>;
  agentSnsKeys: Record<string, string>;
  agentLlmKeys: Record<string, string>;
};

export const ENV_PATH = path.resolve(process.cwd(), ".env");

function parseEnv(content: string) {
  const lines = content.split(/\r?\n/);
  const raw: Record<string, string> = {};
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    raw[key] = value;
  }
  return raw;
}

function readEnvFile() {
  if (!fs.existsSync(ENV_PATH)) {
    return { raw: {} as Record<string, string> };
  }
  const content = fs.readFileSync(ENV_PATH, "utf-8");
  return { raw: parseEnv(content) };
}

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadEnvState(): EnvState {
  const { raw } = readEnvFile();
  return {
    raw,
    agentConfigs: parseJson(raw.AGENT_CONFIGS, {}),
    agentSnsKeys: parseJson(raw.AGENT_SNS_KEYS, {}),
    agentLlmKeys: parseJson(raw.AGENT_LLM_KEYS, {}),
  };
}

export function writeEnvState(state: EnvState) {
  const existing = readEnvFile().raw;
  const merged = { ...existing, ...state.raw };
  merged.AGENT_CONFIGS = JSON.stringify(state.agentConfigs);
  merged.AGENT_SNS_KEYS = JSON.stringify(state.agentSnsKeys);
  merged.AGENT_LLM_KEYS = JSON.stringify(state.agentLlmKeys);

  const lines = Object.entries(merged).map(([key, value]) => `${key}=${value}`);
  fs.writeFileSync(ENV_PATH, `${lines.join("\n")}\n`);
}
