import { prisma } from "./db";
import { buildSystemPrompt, callLlm, LlmProvider } from "./llm";
import { decisionSchema, Decision } from "./schema";
import { roleFromIndex, nextRoleIndex } from "./roles";
import { loadEnvState, writeEnvState } from "./config";

const DEFAULT_INTERVAL_SEC = 60;

type AgentKeyMap = Record<string, string>;

type AgentConfig = {
  provider?: string;
  model?: string;
  role?: string;
  roleIndex?: number;
  runIntervalSec?: number;
  maxActionsPerCycle?: number;
};

async function postThread(baseUrl: string, apiKey: string, payload: any) {
  const res = await fetch(`${baseUrl}/api/threads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agent-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Thread post failed: ${await res.text()}`);
  }

  return res.json();
}

async function postComment(
  baseUrl: string,
  apiKey: string,
  threadId: string,
  body: string
) {
  const res = await fetch(`${baseUrl}/api/threads/${threadId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agent-key": apiKey,
    },
    body: JSON.stringify({ body }),
  });

  if (!res.ok) {
    throw new Error(`Comment post failed: ${await res.text()}`);
  }

  return res.json();
}

async function decideAction({
  provider,
  model,
  system,
  user,
}: {
  provider: LlmProvider;
  model: string;
  system: string;
  user: string;
}): Promise<Decision | null> {
  try {
    const output = await callLlm({ provider, model, system, user });
    const parsed = decisionSchema.parse(JSON.parse(output));
    return parsed;
  } catch (error) {
    console.warn("LLM decision invalid", error);
    return null;
  }
}

function getAgentConfig(handle: string, configs: Record<string, AgentConfig>) {
  return configs[handle] || {};
}

export async function runLlmAgentCycle() {
  const baseUrl = process.env.AGENT_API_BASE_URL || "http://localhost:3000";
  const envState = loadEnvState();
  const keys: AgentKeyMap = envState.agentApiKeys || {};
  const configs = envState.agentConfigs || {};

  const agents = await prisma.agent.findMany({
    where: { status: "VERIFIED", isActive: true },
  });

  if (!agents.length) return;

  const communities = await prisma.community.findMany({
    include: {
      threads: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { agent: true, comments: true },
      },
      serviceContract: true,
    },
  });

  const context = {
    communities: communities.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      chain: c.serviceContract.chain,
      address: c.serviceContract.address,
      threads: c.threads.map((t) => ({
        id: t.id,
        title: t.title,
        type: t.type,
        author: t.agent?.handle || "system",
        commentCount: t.comments.length,
      })),
    })),
  };

  let configUpdated = false;

  for (const agent of agents) {
    const apiKey = keys[agent.handle];
    if (!apiKey) {
      continue;
    }

    const cfg = getAgentConfig(agent.handle, configs);
    const runInterval = cfg.runIntervalSec ?? DEFAULT_INTERVAL_SEC;
    if (agent.lastRunAt) {
      const diff = Date.now() - agent.lastRunAt.getTime();
      if (diff < runInterval * 1000) {
        continue;
      }
    }

    const roleIndex = cfg.roleIndex ?? 0;
    const role = roleFromIndex(roleIndex);
    const provider = (cfg.provider || "OPENAI") as LlmProvider;
    const model =
      cfg.model ||
      (provider === "ANTHROPIC"
        ? "claude-3-5-sonnet-20240620"
        : provider === "GEMINI"
        ? "gemini-1.5-flash"
        : "gpt-4o-mini");

    const system = buildSystemPrompt(role);
    const user = [
      "You must choose a community and decide an action.",
      "Return strict JSON only with fields:",
      "{ action: 'create_thread'|'comment', communitySlug, threadId?, title?, body }",
      "If commenting, provide threadId. If creating thread, provide title and body.",
      "Context:",
      JSON.stringify(context),
    ].join("\n");

    const maxActions = Math.max(1, Math.min(cfg.maxActionsPerCycle || 1, 3));

    for (let i = 0; i < maxActions; i += 1) {
      const decision = await decideAction({ provider, model, system, user });
      if (!decision) break;

      const community = communities.find(
        (c) => c.slug === decision.communitySlug
      );
      if (!community) break;

      try {
        if (decision.action === "create_thread") {
          await postThread(baseUrl, apiKey, {
            communityId: community.id,
            title: decision.title || "Agent update",
            body: decision.body,
            type: "NORMAL",
          });
        } else if (decision.action === "comment" && decision.threadId) {
          await postComment(baseUrl, apiKey, decision.threadId, decision.body);
        }
      } catch (error) {
        console.warn("Agent action failed", error);
        break;
      }
    }

    configs[agent.handle] = {
      ...cfg,
      roleIndex: nextRoleIndex(roleIndex),
    };
    configUpdated = true;

    await prisma.agent.update({
      where: { id: agent.id },
      data: { lastRunAt: new Date() },
    });
  }

  if (configUpdated) {
    writeEnvState({ ...envState, agentConfigs: configs });
  }
}

export function scheduleLoop() {
  const interval = Number(
    process.env.AGENT_RUN_INTERVAL_SEC || DEFAULT_INTERVAL_SEC
  );
  setInterval(() => {
    runLlmAgentCycle().catch(() => undefined);
  }, interval * 1000);
}
