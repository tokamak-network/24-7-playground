const { Contract, JsonRpcProvider, Wallet } = require("ethers");
const { callLlm, defaultModelForProvider, normalizeProvider } = require("./llm");
const { writeCommunicationLog } = require("./communicationLog");
const {
  createComment,
  createThread,
  fetchAgentGeneral,
  fetchContext,
  normalizeBaseUrl,
} = require("./sns");
const {
  extractJsonPayload,
  toErrorMessage,
  toJsonSafe,
  logJson,
  logSummary,
} = require("./utils");

const DEFAULT_INTERVAL_SEC = 60;
const DEFAULT_COMMENT_LIMIT = 50;

function normalizePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function normalizeNonNegativeInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function defaultSystemPrompt() {
  return [
    "You are a smart contract auditor and beta tester.",
    "Return strict JSON only.",
    "JSON schema:",
    "{ action: 'create_thread'|'comment'|'tx', communitySlug, threadId?, title?, body, threadType?, contractAddress?, functionName?, args?, value? }",
    "threadType can be DISCUSSION, REQUEST_TO_HUMAN, or REPORT_TO_HUMAN.",
  ].join("\n");
}

function defaultUserPromptTemplate() {
  return [
    "Use this context to decide the next action.",
    "Return JSON only.",
    "Context:",
    "{{context}}",
  ].join("\n");
}

function parseDecision(output) {
  const payload = extractJsonPayload(output);
  const parsed = JSON.parse(payload);
  if (Array.isArray(parsed)) return parsed;
  return [parsed];
}

function extractActionTypes(output) {
  try {
    const parsed = parseDecision(String(output || ""));
    return Array.from(
      new Set(
        parsed
          .map((item) =>
            item && typeof item.action === "string" ? String(item.action).trim() : ""
          )
          .filter(Boolean)
      )
    );
  } catch {
    return [];
  }
}

function decodeEncodedInput(value) {
  const encoded = String(value || "").trim();
  if (!encoded) return null;
  try {
    const raw = Buffer.from(encoded, "base64").toString("utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("encodedInput must decode to a JSON object");
    }
    return parsed;
  } catch {
    throw new Error("encodedInput is invalid");
  }
}

function normalizeConfig(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Runner config is required");
  }
  const decodedInput = decodeEncodedInput(input.encodedInput);
  const securityFromEncoded =
    decodedInput &&
    decodedInput.securitySensitive &&
    typeof decodedInput.securitySensitive === "object"
      ? decodedInput.securitySensitive
      : {};
  const runnerFromEncoded =
    decodedInput &&
    decodedInput.runner &&
    typeof decodedInput.runner === "object"
      ? decodedInput.runner
      : {};

  const securityInput =
    input.securitySensitive && typeof input.securitySensitive === "object"
      ? { ...securityFromEncoded, ...input.securitySensitive }
      : securityFromEncoded;
  const llmInput = input.llm && typeof input.llm === "object" ? input.llm : {};
  const runtimeInput =
    input.runtime && typeof input.runtime === "object" ? input.runtime : {};
  const executionInput =
    input.execution && typeof input.execution === "object" ? input.execution : {};
  const promptInput =
    input.prompts && typeof input.prompts === "object" ? input.prompts : {};

  const sessionToken = String(input.sessionToken || "").trim();
  if (!sessionToken) {
    throw new Error("sessionToken is required");
  }
  const agentId = String(input.agentId || "").trim();
  if (!agentId) {
    throw new Error("agentId is required");
  }

  const llmApiKey = String(
    securityInput.llmApiKey || llmInput.apiKey || ""
  ).trim();
  if (!llmApiKey) {
    throw new Error("securitySensitive.llmApiKey is required");
  }

  return {
    snsBaseUrl: normalizeBaseUrl(input.snsBaseUrl),
    sessionToken,
    agentId,
    encodedInput: String(input.encodedInput || "").trim(),
    llm: {
      apiKey: llmApiKey,
      baseUrl: String(llmInput.baseUrl || "").trim(),
    },
    runtime: {
      intervalSec: normalizePositiveInt(
        runnerFromEncoded.intervalSec ?? runtimeInput.intervalSec,
        DEFAULT_INTERVAL_SEC
      ),
      commentLimit: normalizeNonNegativeInt(
        runnerFromEncoded.commentContextLimit ??
          runnerFromEncoded.commentLimit ??
          runtimeInput.commentLimit,
        DEFAULT_COMMENT_LIMIT
      ),
      runnerLauncherPort: normalizePositiveInt(
        runnerFromEncoded.runnerLauncherPort,
        0
      ),
    },
    execution: {
      privateKey: String(
        securityInput.executionWalletPrivateKey || executionInput.privateKey || ""
      ).trim(),
      alchemyApiKey: String(
        securityInput.alchemyApiKey || executionInput.alchemyApiKey || ""
      ).trim(),
    },
    securitySensitive: {
      password: String(securityInput.password || "").trim(),
    },
    prompts: {
      system: String(promptInput.system || "").trim(),
      user: String(promptInput.user || "").trim(),
    },
  };
}

function redactConfig(config) {
  if (!config) return null;
  return {
    snsBaseUrl: config.snsBaseUrl,
    agentId: config.agentId,
    llm: {
      baseUrl: config.llm.baseUrl || null,
      hasApiKey: Boolean(config.llm.apiKey),
    },
    runtime: {
      intervalSec: config.runtime.intervalSec,
      commentLimit: config.runtime.commentLimit,
      runnerLauncherPort: config.runtime.runnerLauncherPort || null,
    },
    execution: {
      hasPrivateKey: Boolean(config.execution.privateKey),
      hasAlchemyApiKey: Boolean(config.execution.alchemyApiKey),
    },
    securitySensitive: {
      hasPassword: Boolean(
        config.securitySensitive && config.securitySensitive.password
      ),
      encodedInput: Boolean(config.encodedInput),
    },
    prompts: {
      hasSystemPrompt: Boolean(config.prompts.system),
      hasUserPrompt: Boolean(config.prompts.user),
    },
    auth: {
      hasSessionToken: Boolean(config.sessionToken),
      hasAgentId: Boolean(config.agentId),
    },
  };
}

function trace(logger, label, payload) {
  logJson(logger, `[runner][engine] ${label}`, payload);
}

class RunnerEngine {
  constructor(logger = console) {
    this.logger = logger;
    this.timer = null;
    this.inFlight = false;
    this.config = null;
    this.state = {
      running: false,
      startedAt: null,
      lastRunAt: null,
      lastSuccessAt: null,
      lastError: null,
      cycleCount: 0,
      lastActionCount: 0,
      lastLlmOutput: null,
    };
  }

  getStatus() {
    return {
      ...this.state,
      config: redactConfig(this.config),
    };
  }

  async start(configInput) {
    if (this.state.running) {
      throw new Error("Runner is already running");
    }
    trace(this.logger, "start:input", { configInput });
    this.config = normalizeConfig(configInput);
    trace(this.logger, "start:normalized-config", { config: this.config });
    this.state.running = true;
    this.state.startedAt = new Date().toISOString();
    this.state.lastError = null;
    logSummary(
      this.logger,
      `runner started (agentId=${this.config.agentId}, intervalSec=${this.config.runtime.intervalSec}, commentLimit=${this.config.runtime.commentLimit})`
    );
    await this.runOnce();

    const intervalMs = Math.max(1, this.config.runtime.intervalSec) * 1000;
    this.timer = setInterval(() => {
      this.runOnce().catch((error) => {
        this.logger.error(
          "[runner] periodic cycle failed:",
          toErrorMessage(error, "Unknown error")
        );
      });
    }, intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.state.running = false;
    logSummary(this.logger, "runner stopped");
  }

  updateConfig(patchInput) {
    if (!this.config) {
      throw new Error("Runner config is not initialized");
    }
    trace(this.logger, "update-config:patch-input", { patchInput });
    const merged = {
      ...this.config,
      ...patchInput,
      llm: { ...this.config.llm, ...(patchInput.llm || {}) },
      runtime: { ...this.config.runtime, ...(patchInput.runtime || {}) },
      execution: { ...this.config.execution, ...(patchInput.execution || {}) },
      securitySensitive: {
        ...this.config.securitySensitive,
        ...(patchInput.securitySensitive || {}),
      },
      prompts: { ...this.config.prompts, ...(patchInput.prompts || {}) },
    };
    this.config = normalizeConfig(merged);
    trace(this.logger, "update-config:normalized-config", { config: this.config });
    if (this.state.running) {
      if (this.timer) {
        clearInterval(this.timer);
      }
      const intervalMs = Math.max(1, this.config.runtime.intervalSec) * 1000;
      this.timer = setInterval(() => {
        this.runOnce().catch((error) => {
          this.logger.error(
            "[runner] periodic cycle failed:",
            toErrorMessage(error, "Unknown error")
          );
        });
      }, intervalMs);
    }
    return this.getStatus();
  }

  async runOnceWithConfig(configInput) {
    trace(this.logger, "run-once-with-config:input", { configInput });
    const normalized = normalizeConfig(configInput);
    trace(this.logger, "run-once-with-config:normalized", { normalized });
    return this.#runCycle(normalized);
  }

  async runOnce() {
    if (!this.config) {
      throw new Error("Runner config is not initialized");
    }
    trace(this.logger, "run-once:using-config", { config: this.config });
    return this.#runCycle(this.config);
  }

  async #runCycle(config) {
    if (this.inFlight) {
      return { skipped: true, reason: "Runner cycle already in-flight" };
    }
    trace(this.logger, "cycle:start", { config });
    logSummary(
      this.logger,
      `cycle started (nextCycle=${this.state.cycleCount + 1}, agentId=${config.agentId})`
    );
    this.inFlight = true;
    this.state.lastRunAt = new Date().toISOString();

    try {
      const generalData = await fetchAgentGeneral({
        snsBaseUrl: config.snsBaseUrl,
        sessionToken: config.sessionToken,
        agentId: config.agentId,
      });
      const generalAgent =
        generalData && generalData.agent && typeof generalData.agent === "object"
          ? generalData.agent
          : null;
      const generalCommunity =
        generalData &&
        generalData.community &&
        typeof generalData.community === "object"
          ? generalData.community
          : null;
      const agentKey = String((generalData && generalData.snsApiKey) || "").trim();
      trace(this.logger, "cycle:general-data", {
        generalData,
        generalAgent,
        generalCommunity,
        agentKey,
      });
      if (!generalAgent) {
        throw new Error("General agent data is missing");
      }
      if (!agentKey) {
        throw new Error("General SNS API key is missing");
      }
      const provider = normalizeProvider(generalAgent.llmProvider);
      const model = String(
        generalAgent.llmModel || defaultModelForProvider(provider)
      ).trim();
      const persistedBaseUrl = String(generalAgent.llmBaseUrl || "").trim();

      const contextData = await fetchContext({
        snsBaseUrl: config.snsBaseUrl,
        sessionToken: config.sessionToken,
        commentLimit: config.runtime.commentLimit,
      });

      let communities =
        contextData &&
        contextData.context &&
        Array.isArray(contextData.context.communities)
          ? contextData.context.communities
          : [];
      if (
        generalCommunity &&
        (generalCommunity.id || generalCommunity.slug) &&
        communities.length
      ) {
        const targetId = String(generalCommunity.id || "").trim();
        const targetSlug = String(generalCommunity.slug || "").trim();
        const filtered = communities.filter((community) => {
          const id = String(community && community.id).trim();
          const slug = String(community && community.slug).trim();
          return (targetId && id === targetId) || (targetSlug && slug === targetSlug);
        });
        if (filtered.length) {
          communities = filtered;
          contextData.context.communities = filtered;
        }
      }
      trace(this.logger, "cycle:context-data", {
        contextData,
        communities,
      });
      if (!communities.length) {
        throw new Error("No community assigned for this runner");
      }

      const system = config.prompts.system || defaultSystemPrompt();
      const userTemplate = config.prompts.user || defaultUserPromptTemplate();
      const user = userTemplate.replace(
        "{{context}}",
        JSON.stringify(contextData.context)
      );
      trace(this.logger, "cycle:prompt", {
        system,
        userTemplate,
        user,
      });

      const llmOutput = await callLlm({
        provider,
        model: model || defaultModelForProvider(provider),
        apiKey: config.llm.apiKey,
        baseUrl: config.llm.baseUrl || persistedBaseUrl,
        system,
        user,
      });
      this.state.lastLlmOutput = llmOutput || "";
      trace(this.logger, "cycle:llm-output", { llmOutput });
      writeCommunicationLog(this.logger, {
        createdAt: new Date().toISOString(),
        direction: "agent_to_manager",
        actionTypes: extractActionTypes(llmOutput || ""),
        content: llmOutput || "",
      });

      const actions = parseDecision(llmOutput || "");
      const validActions = actions.filter(
        (item) =>
          item &&
          typeof item === "object" &&
          item.action &&
          item.communitySlug
      );
      trace(this.logger, "cycle:parsed-actions", {
        actions,
        validActions,
      });

      if (!validActions.length) {
        throw new Error("LLM decision does not include valid actions");
      }

      const executionResults = [];
      for (const action of validActions) {
        trace(this.logger, "cycle:action:start", { action });
        const community = communities.find(
          (candidate) =>
            candidate && candidate.slug === String(action.communitySlug || "")
        );
        trace(this.logger, "cycle:action:community-match", {
          actionCommunitySlug: String(action.communitySlug || ""),
          matchedCommunity: community || null,
        });
        if (!community) continue;

        const actionType = String(action.action || "").trim();
        if (actionType === "create_thread") {
          const threadResponse = await createThread({
            snsBaseUrl: config.snsBaseUrl,
            agentKey,
            communityId: community.id,
            title: String(action.title || "Agent update"),
            body: String(action.body || ""),
            threadType: action.threadType,
          });
          trace(this.logger, "cycle:action:create-thread:result", {
            action,
            threadResponse,
          });
          logSummary(
            this.logger,
            `action create_thread completed (community=${community.slug})`
          );
          executionResults.push({ action: "create_thread", community: community.slug });
          continue;
        }

        if (actionType === "comment") {
          const threadId = String(action.threadId || "").trim();
          if (!threadId) continue;
          const commentResponse = await createComment({
            snsBaseUrl: config.snsBaseUrl,
            agentKey,
            threadId,
            body: String(action.body || ""),
          });
          trace(this.logger, "cycle:action:comment:result", {
            action,
            commentResponse,
          });
          logSummary(
            this.logger,
            `action comment completed (community=${community.slug}, threadId=${threadId})`
          );
          executionResults.push({ action: "comment", community: community.slug, threadId });
          continue;
        }

        if (actionType === "tx") {
          const txResult = await this.#executeTxAction(config, community, action);
          trace(this.logger, "cycle:action:tx:result", {
            action,
            txResult,
          });
          const feedbackPayload = {
            type: "tx_feedback",
            communitySlug: community.slug,
            threadId: action.threadId || null,
            contractAddress: community.address || null,
            functionName: action.functionName || null,
            args: Array.isArray(action.args) ? action.args : [],
            value: action.value ?? null,
            result: toJsonSafe(txResult),
          };
          writeCommunicationLog(this.logger, {
            createdAt: new Date().toISOString(),
            direction: "manager_to_agent",
            actionTypes: ["tx"],
            content: JSON.stringify(feedbackPayload, null, 2),
          });
          logSummary(
            this.logger,
            `action tx completed (community=${community.slug}, function=${String(action.functionName || "")})`
          );
          executionResults.push({
            action: "tx",
            community: community.slug,
            result: toJsonSafe(txResult),
          });
          if (action.threadId && txResult) {
            const summary = `TX result for ${String(action.functionName || "")}\n\n\`\`\`json\n${JSON.stringify(
              toJsonSafe(txResult),
              null,
              2
            )}\n\`\`\``;
            const txCommentResponse = await createComment({
              snsBaseUrl: config.snsBaseUrl,
              agentKey,
              threadId: String(action.threadId),
              body: summary,
            });
            trace(this.logger, "cycle:action:tx:comment-result", {
              action,
              txCommentResponse,
            });
          }
        }
      }

      this.state.cycleCount += 1;
      this.state.lastActionCount = executionResults.length;
      this.state.lastSuccessAt = new Date().toISOString();
      this.state.lastError = null;
      trace(this.logger, "cycle:success", {
        state: this.state,
        executionResults,
      });
      const actionSummary = executionResults.map((item) => item.action).join(", ") || "none";
      logSummary(
        this.logger,
        `cycle completed (cycleCount=${this.state.cycleCount}, actionCount=${executionResults.length}, actions=[${actionSummary}])`
      );
      return {
        ok: true,
        cycleCount: this.state.cycleCount,
        actionCount: executionResults.length,
        actions: executionResults,
      };
    } catch (error) {
      const message = toErrorMessage(error, "Runner cycle failed");
      this.state.lastError = message;
      trace(this.logger, "cycle:error", {
        error: {
          message,
          stack: error && error.stack ? String(error.stack) : null,
        },
        config,
        state: this.state,
      });
      this.logger.error("[runner] cycle error:", message);
      logSummary(this.logger, `cycle failed (error=${message})`);
      return { ok: false, error: message };
    } finally {
      this.inFlight = false;
    }
  }

  async #executeTxAction(config, community, action) {
    trace(this.logger, "tx-action:start", {
      config,
      community,
      action,
    });
    if (!config.execution.privateKey || !config.execution.alchemyApiKey) {
      throw new Error(
        "TX action requires execution.privateKey and execution.alchemyApiKey"
      );
    }
    if (!Array.isArray(community.abi) || !community.abi.length) {
      throw new Error("Community ABI is not available");
    }

    const rpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${config.execution.alchemyApiKey}`;
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(config.execution.privateKey, provider);
    const contract = new Contract(String(community.address || ""), community.abi, wallet);
    const functionName = String(action.functionName || "").trim();
    if (!functionName) {
      throw new Error("Missing functionName for tx action");
    }

    const args = Array.isArray(action.args) ? action.args : [];
    const fragment = contract.interface.getFunction(functionName);
    const value =
      action.value !== undefined && action.value !== null
        ? BigInt(action.value)
        : undefined;

    if (fragment.stateMutability === "view" || fragment.stateMutability === "pure") {
      const result = await contract[functionName](...args);
      const output = {
        type: "call",
        functionName,
        args,
        result: toJsonSafe(result),
      };
      trace(this.logger, "tx-action:call-result", { output });
      return output;
    }

    const tx = await contract[functionName](...args, value ? { value } : {});
    const receipt = await tx.wait(1);
    const output = {
      type: "tx",
      functionName,
      args,
      hash: tx.hash,
      status: receipt && receipt.status,
      gasUsed:
        receipt && receipt.gasUsed && receipt.gasUsed.toString
          ? receipt.gasUsed.toString()
          : null,
      blockNumber: receipt && receipt.blockNumber ? receipt.blockNumber : null,
    };
    trace(this.logger, "tx-action:tx-result", { output });
    return output;
  }
}

module.exports = {
  RunnerEngine,
  normalizeConfig,
};
