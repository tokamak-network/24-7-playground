import dotenv from "dotenv";
import path from "path";
import readline from "node:readline";
import { prisma } from "./db";
import { loadEnvState, writeEnvState } from "./config";
import { scheduleLoop } from "./worker";
import { ROLE_ROTATION, roleFromIndex } from "./roles";

const agentEnv = path.resolve(process.cwd(), ".env");
dotenv.config({ path: agentEnv });

function getArg(name: string) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

function printUsage() {
  console.log("Usage:");
  console.log("  agents config set --handle <handle> [--provider OPENAI|ANTHROPIC|GEMINI|LOCAL] [--model <model>] [--role <role>] [--run-interval <sec>] [--max-actions <n>] [--api-key <key>]");
  console.log("  agents status");
  console.log("  agents run");
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
  const apiKey = getArg("--api-key");

  const state = loadEnvState();
  const configs = state.agentConfigs || {};
  const keys = state.agentApiKeys || {};

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

  if (apiKey) {
    keys[handle] = apiKey;
  }

  writeEnvState({ ...state, agentConfigs: configs, agentApiKeys: keys });
  console.log(`Updated config for ${handle}`);
}

async function interactiveConfig() {
  const handle = await ask("Agent handle: ");
  if (!handle) {
    console.log("Handle is required.");
    return;
  }

  const state = loadEnvState();
  const configs = state.agentConfigs || {};
  const keys = state.agentApiKeys || {};
  const existing = configs[handle] || {};

  const provider = await ask(
    `Provider (OPENAI|ANTHROPIC|GEMINI|LOCAL) [${existing.provider || ""}]: `
  );
  const model = await ask(`Model [${existing.model || ""}]: `);
  const roleLabel = roleFromIndex(existing.roleIndex ?? 0);
  const role = await ask(`Role (${ROLE_ROTATION.join("/")}) [${roleLabel}]: `);
  const runInterval = await ask(
    `Run interval sec [${existing.runIntervalSec ?? ""}]: `
  );
  const maxActions = await ask(
    `Max actions per cycle [${existing.maxActionsPerCycle ?? ""}]: `
  );
  const apiKey = await ask(`Agent API key [${keys[handle] ? "configured" : ""}]: `);

  const nextConfig = {
    ...existing,
    ...(provider ? { provider } : {}),
    ...(model ? { model } : {}),
    ...(role
      ? {
          role,
          roleIndex: Math.max(0, ROLE_ROTATION.indexOf(role as any)),
        }
      : {}),
    ...(runInterval ? { runIntervalSec: Number(runInterval) } : {}),
    ...(maxActions ? { maxActionsPerCycle: Number(maxActions) } : {}),
  };

  configs[handle] = nextConfig;
  if (apiKey) {
    keys[handle] = apiKey;
  }

  writeEnvState({ ...state, agentConfigs: configs, agentApiKeys: keys });
  console.log(`Updated config for ${handle}`);
}

async function status() {
  const state = loadEnvState();
  const configs = state.agentConfigs || {};
  const keys = state.agentApiKeys || {};
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
    console.log(`  apiKey: ${keys[agent.handle] ? "configured" : "missing"}`);
  }
}

async function run() {
  await scheduleLoop();
}

async function interactiveMenu() {
  while (true) {
    console.log("\nAgent CLI");
    console.log("1. Configure agent");
    console.log("2. Show status");
    console.log("3. Run scheduler");
    console.log("4. Exit");

    const choice = await ask("Select an option: ");
    if (choice === "1") {
      await interactiveConfig();
      continue;
    }
    if (choice === "2") {
      await status();
      continue;
    }
    if (choice === "3") {
      await run();
      return;
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

  if (cmd === "status") {
    await status();
    return;
  }

  if (cmd === "run") {
    await run();
    return;
  }

  printUsage();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
