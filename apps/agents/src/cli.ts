import dotenv from "dotenv";
import path from "path";
import readline from "node:readline";
import { prisma } from "./db";
import { loadEnvState, writeEnvState } from "./config";
import { ROLE_ROTATION } from "./roles";

const agentEnv = path.resolve(process.cwd(), ".env");
dotenv.config({ path: agentEnv });

function getArg(name: string) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

function printUsage() {
  console.log("Usage:");
  console.log("  agents config set --handle <handle> [--provider OPENAI|ANTHROPIC|GEMINI|LOCAL] [--model <model>] [--role <role>] [--run-interval <sec>] [--max-actions <n>] [--sns-key <key>]");
  console.log("  agents agent add --handle <handle> --llm-key <key> --sns-key <key>");
  console.log("  agents agent update --handle <handle> [--llm-key <key>] [--sns-key <key>]");
  console.log("  agents agent list");
  console.log("  agents status");
}

function createPromptInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(question: string) {
  const rl = createPromptInterface();
  return new Promise<string>((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function configSet() {
  const handle = getArg("--handle");
  if (!handle) {
    console.error("--handle is required");
    return;
  }

  const provider = getArg("--provider");
  const model = getArg("--model");
  const role = getArg("--role");
  const runIntervalSec = getArg("--run-interval");
  const maxActions = getArg("--max-actions");
  const snsKeyArg = getArg("--sns-key") || getArg("--api-key");

  const state = loadEnvState();
  const configs = state.agentConfigs || {};
  const snsKeys = state.agentSnsKeys || {};
  const llmKeys = state.agentLlmKeys || {};

  const nextConfig = {
    ...configs[handle],
    ...(provider ? { provider } : {}),
    ...(model ? { model } : {}),
    ...(role
      ? {
          role,
          roleIndex: Math.max(0, ROLE_ROTATION.indexOf(role as any)),
        }
      : {}),
    ...(runIntervalSec ? { runIntervalSec: Number(runIntervalSec) } : {}),
    ...(maxActions ? { maxActionsPerCycle: Number(maxActions) } : {}),
  };

  configs[handle] = nextConfig;

  if (snsKeyArg) {
    snsKeys[handle] = snsKeyArg;
  }

  writeEnvState({
    ...state,
    agentConfigs: configs,
    agentSnsKeys: snsKeys,
    agentLlmKeys: llmKeys,
  });
  console.log(`Updated config for ${handle}`);
}

async function interactiveAgentAdd() {
  const handle = await ask("Agent handle: ");
  if (!handle) {
    console.log("Handle is required.");
    return;
  }

  const llmKey = await ask("LLM API key: ");
  const snsKey = await ask("SNS API key: ");

  if (!llmKey || !snsKey) {
    console.log("Both LLM API key and SNS API key are required.");
    return;
  }

  const state = loadEnvState();
  const snsKeys = state.agentSnsKeys || {};
  const llmKeys = state.agentLlmKeys || {};

  llmKeys[handle] = llmKey;
  snsKeys[handle] = snsKey;

  writeEnvState({ ...state, agentSnsKeys: snsKeys, agentLlmKeys: llmKeys });
  console.log(`Added agent keys for ${handle}`);
}

async function interactiveAgentUpdate() {
  const handle = await ask("Agent handle: ");
  if (!handle) {
    console.log("Handle is required.");
    return;
  }

  const state = loadEnvState();
  const snsKeys = state.agentSnsKeys || {};
  const llmKeys = state.agentLlmKeys || {};

  const llmKey = await ask(
    `LLM API key [${llmKeys[handle] ? "configured" : ""}]: `
  );
  const snsKey = await ask(
    `SNS API key [${snsKeys[handle] ? "configured" : ""}]: `
  );

  if (llmKey) llmKeys[handle] = llmKey;
  if (snsKey) snsKeys[handle] = snsKey;

  writeEnvState({ ...state, agentSnsKeys: snsKeys, agentLlmKeys: llmKeys });
  console.log(`Updated agent keys for ${handle}`);
}

async function agentAdd() {
  const handle = getArg("--handle");
  const llmKey = getArg("--llm-key");
  const snsKey = getArg("--sns-key");
  if (!handle || !llmKey || !snsKey) {
    console.error("--handle, --llm-key, --sns-key are required");
    return;
  }

  const state = loadEnvState();
  const snsKeys = state.agentSnsKeys || {};
  const llmKeys = state.agentLlmKeys || {};
  llmKeys[handle] = llmKey;
  snsKeys[handle] = snsKey;

  writeEnvState({
    ...state,
    agentSnsKeys: snsKeys,
    agentLlmKeys: llmKeys,
  });
  console.log(`Added agent keys for ${handle}`);
}

async function agentUpdate() {
  const handle = getArg("--handle");
  const llmKey = getArg("--llm-key");
  const snsKey = getArg("--sns-key");
  if (!handle) {
    console.error("--handle is required");
    return;
  }

  const state = loadEnvState();
  const snsKeys = state.agentSnsKeys || {};
  const llmKeys = state.agentLlmKeys || {};

  if (llmKey) llmKeys[handle] = llmKey;
  if (snsKey) snsKeys[handle] = snsKey;

  writeEnvState({
    ...state,
    agentSnsKeys: snsKeys,
    agentLlmKeys: llmKeys,
  });
  console.log(`Updated keys for ${handle}`);
}

async function agentList() {
  const state = loadEnvState();
  const snsKeys = state.agentSnsKeys || {};
  const llmKeys = state.agentLlmKeys || {};
  const handles = Array.from(
    new Set([...Object.keys(snsKeys), ...Object.keys(llmKeys)])
  ).sort();

  if (!handles.length) {
    console.log("No agents registered.");
    return;
  }

  console.log("Registered agents:");
  for (const handle of handles) {
    console.log(
      `- ${handle} (llmKey: ${llmKeys[handle] ? "configured" : "missing"}, snsKey: ${snsKeys[handle] ? "configured" : "missing"})`
    );
  }
}

async function status() {
  const state = loadEnvState();
  const configs = state.agentConfigs || {};
  const snsKeys = state.agentSnsKeys || {};
  const llmKeys = state.agentLlmKeys || {};
  const agents = await prisma.agent.findMany();

  console.log("Agents:\n");
  for (const agent of agents) {
    const cfg = configs[agent.handle] || {};
    console.log(`- ${agent.handle}`);
    console.log(`  status: ${agent.status}`);
    console.log(`  active: ${agent.isActive}`);
    console.log(`  wallet: ${agent.walletAddress || ""}`);
    console.log(`  lastRunAt: ${agent.lastRunAt || ""}`);
    console.log(`  provider: ${cfg.provider || ""}`);
    console.log(`  model: ${cfg.model || ""}`);
    console.log(`  roleIndex: ${cfg.roleIndex ?? ""}`);
    console.log(`  runIntervalSec: ${cfg.runIntervalSec ?? ""}`);
    console.log(`  maxActionsPerCycle: ${cfg.maxActionsPerCycle ?? ""}`);
    console.log(`  llmKey: ${llmKeys[agent.handle] ? "configured" : "missing"}`);
    console.log(`  snsKey: ${snsKeys[agent.handle] ? "configured" : "missing"}`);
  }
}

async function interactiveMenu() {
  while (true) {
    console.log("\nAgent CLI");
    console.log("1. Add agent keys");
    console.log("2. List agent handles");
    console.log("3. Edit agent keys");
    console.log("4. Exit");

    const choice = await ask("Select an option: ");
    if (choice === "1") {
      await interactiveAgentAdd();
      continue;
    }
    if (choice === "2") {
      await agentList();
      continue;
    }
    if (choice === "3") {
      await interactiveAgentUpdate();
      continue;
    }
    return;
  }
}

async function main() {
  const cmd = process.argv[2];
  if (!cmd) {
    await interactiveMenu();
    return;
  }

  if (cmd === "config" && process.argv[3] === "set") {
    await configSet();
    return;
  }

  if (cmd === "agent" && process.argv[3] === "add") {
    await agentAdd();
    return;
  }

  if (cmd === "agent" && process.argv[3] === "update") {
    await agentUpdate();
    return;
  }

  if (cmd === "agent" && process.argv[3] === "list") {
    await agentList();
    return;
  }

  if (cmd === "status") {
    await status();
    return;
  }

  printUsage();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
