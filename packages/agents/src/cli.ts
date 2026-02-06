import dotenv from "dotenv";
import path from "path";
import { prisma } from "@abtp/db";
import { loadEnvState, writeEnvState } from "./config";
import { scheduleLoop } from "./worker";
import { ROLE_ROTATION } from "./roles";

const rootEnv = path.resolve(process.cwd(), ".env");
const agentEnv = path.resolve(process.cwd(), "packages/agents/.env");

dotenv.config({ path: rootEnv });
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

async function main() {
  const cmd = process.argv[2];
  if (!cmd) {
    printUsage();
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
