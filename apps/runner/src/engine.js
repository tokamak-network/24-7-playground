const { Contract, JsonRpcProvider, Wallet } = require("ethers");
const fs = require("node:fs");
const path = require("node:path");
const { callLlm, defaultModelForProvider, normalizeProvider } = require("./llm");
const { writeCommunicationLog } = require("./communicationLog");
const {
  buildReportIssueBody,
  buildReportCommentIssueBody,
  buildReportCommentIssueTitle,
  buildReportIssueTitle,
  createGithubIssue,
} = require("./github");
const {
  createComment,
  createThread,
  fetchAgentGeneral,
  fetchContext,
  markCommentIssued,
  markThreadIssued,
  normalizeBaseUrl,
  setRequestStatus,
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
const PROMPTS_DIR = path.resolve(__dirname, "..", "prompts");
const SUPPLEMENT_PROMPTS_DIR = path.join(PROMPTS_DIR, "supplements");
const SUPPLEMENTARY_PROMPT_FILES = Object.freeze({
  "attack-defense": "attack-defense.md",
  optimization: "optimization.md",
  "ux-improvement": "ux-improvement.md",
  "scalability-compatibility": "scalability-compatibility.md",
});

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

function normalizeOptionalPositiveInt(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}

function normalizeSupplementaryPromptProfile(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized) return "";
  if (!Object.prototype.hasOwnProperty.call(SUPPLEMENTARY_PROMPT_FILES, normalized)) {
    return "";
  }
  return normalized;
}

function defaultSystemPrompt() {
  const fallback = [
    "You are a smart contract auditor and beta tester.",
    "Return strict JSON only.",
    "JSON schema:",
    "{ action: 'create_thread'|'comment'|'tx'|'set_request_status', communitySlug, threadId?, title?, body?, threadType?, contractAddress?, functionName?, args?, value?, status? }",
    "threadType can be DISCUSSION, REQUEST_TO_HUMAN, or REPORT_TO_HUMAN.",
  ].join("\n");
  return readPromptFile("agent.md", fallback);
}

function defaultUserPromptTemplate() {
  const fallback = [
    "Use this context to decide the next action.",
    "Return JSON only.",
    "Context:",
    "{{context}}",
  ].join("\n");
  return readPromptFile("user.md", fallback);
}

function readPromptFile(fileName, fallback) {
  try {
    const absolutePath = path.join(PROMPTS_DIR, fileName);
    const content = fs.readFileSync(absolutePath, "utf8").trim();
    return content || fallback;
  } catch {
    return fallback;
  }
}

function readSupplementarySystemPrompt(profile) {
  const normalized = normalizeSupplementaryPromptProfile(profile);
  if (!normalized) return "";
  const fileName = SUPPLEMENTARY_PROMPT_FILES[normalized];
  if (!fileName) return "";
  try {
    const absolutePath = path.join(SUPPLEMENT_PROMPTS_DIR, fileName);
    return fs.readFileSync(absolutePath, "utf8").trim();
  } catch {
    return "";
  }
}

function composeSystemPrompt(baseSystemPrompt, supplementaryProfile, extraSystemPrompt) {
  const sections = [String(baseSystemPrompt || "").trim()].filter(Boolean);
  const supplementaryPrompt = readSupplementarySystemPrompt(supplementaryProfile);
  if (supplementaryPrompt) {
    sections.push(
      ["Supplementary analysis profile guidance:", supplementaryPrompt].join("\n")
    );
  }
  const extra = String(extraSystemPrompt || "").trim();
  if (extra) {
    sections.push(["Additional runtime system guidance:", extra].join("\n"));
  }
  return sections.join("\n\n");
}

function composeUserPromptTemplate(baseUserTemplate, extraUserTemplate) {
  const base = String(baseUserTemplate || "").trim();
  const extra = String(extraUserTemplate || "").trim();
  if (!extra) return base;
  return [base, "Additional runtime user guidance:", extra].join("\n\n");
}

function parseDecision(output) {
  const payload = extractJsonPayload(output);
  const parsed = JSON.parse(payload);
  if (Array.isArray(parsed)) return parsed;
  return [parsed];
}

function sanitizeJsonPayload(input) {
  const normalized = String(input || "")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/,\s*([}\]])/g, "$1");
  let output = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === "\"") {
        inString = false;
      } else if (ch === "\n") {
        output += "\\n";
        continue;
      } else if (ch === "\r") {
        continue;
      }
    } else if (ch === "\"") {
      inString = true;
    }
    output += ch;
  }
  return output;
}

function parseDecisionWithFallback(output) {
  try {
    return parseDecision(output);
  } catch {
    const sanitized = sanitizeJsonPayload(extractJsonPayload(output));
    const parsed = JSON.parse(sanitized);
    return Array.isArray(parsed) ? parsed : [parsed];
  }
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
  const integrationInput =
    input.integrations && typeof input.integrations === "object"
      ? input.integrations
      : {};
  const promptInput =
    input.prompts && typeof input.prompts === "object" ? input.prompts : {};

  const runnerToken = String(input.runnerToken || "").trim();
  if (!runnerToken) {
    throw new Error("runnerToken is required");
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
    runnerToken,
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
      maxTokens: normalizeOptionalPositiveInt(
        runnerFromEncoded.maxTokens ?? runtimeInput.maxTokens
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
    integrations: {
      githubIssueToken: String(
        securityInput.githubIssueToken || integrationInput.githubIssueToken || ""
      ).trim(),
    },
    prompts: {
      system: String(promptInput.system || "").trim(),
      user: String(promptInput.user || "").trim(),
      supplementaryProfile: normalizeSupplementaryPromptProfile(
        runnerFromEncoded.supplementaryPromptProfile ??
          runnerFromEncoded.analysisProfile ??
          runtimeInput.supplementaryPromptProfile ??
          promptInput.supplementaryPromptProfile ??
          promptInput.supplementaryProfile
      ),
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
      maxTokens: config.runtime.maxTokens,
    },
    execution: {
      hasPrivateKey: Boolean(config.execution.privateKey),
      hasAlchemyApiKey: Boolean(config.execution.alchemyApiKey),
    },
    integrations: {
      hasGithubIssueToken: Boolean(
        config.integrations && config.integrations.githubIssueToken
      ),
    },
    encodedInput: Boolean(config.encodedInput),
    prompts: {
      hasSystemPrompt: Boolean(config.prompts.system),
      hasUserPrompt: Boolean(config.prompts.user),
      supplementaryProfile: config.prompts.supplementaryProfile || null,
    },
    auth: {
      hasRunnerToken: Boolean(config.runnerToken),
      hasAgentId: Boolean(config.agentId),
    },
  };
}

function resolveLoggerAgentId(logger) {
  if (!logger || typeof logger !== "object") return "";
  const value = logger.__runnerAgentId;
  return typeof value === "string" ? value.trim() : "";
}

function withLoggerAgentId(logger, agentId) {
  const scoped = Object.create(logger && typeof logger === "object" ? logger : console);
  Object.defineProperty(scoped, "__runnerAgentId", {
    value: String(agentId || "").trim(),
    writable: true,
    enumerable: false,
    configurable: true,
  });
  return scoped;
}

function trace(logger, label, payload) {
  const scopedAgentId = resolveLoggerAgentId(logger);
  if (!scopedAgentId) {
    logJson(logger, `[runner][engine] ${label}`, payload);
    return;
  }
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    if (typeof payload.agentId === "string" && payload.agentId.trim()) {
      logJson(logger, `[runner][engine] ${label}`, payload);
      return;
    }
    logJson(logger, `[runner][engine] ${label}`, {
      agentId: scopedAgentId,
      ...payload,
    });
    return;
  }
  logJson(logger, `[runner][engine] ${label}`, {
    agentId: scopedAgentId,
    payload,
  });
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
    this.logAgentId = "";
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
    this.logAgentId = this.config.agentId;
    this.logger = withLoggerAgentId(this.logger, this.logAgentId);
    trace(this.logger, "start:normalized-config", { config: this.config });
    this.state.running = true;
    this.state.startedAt = new Date().toISOString();
    this.state.lastError = null;
    logSummary(
      this.logger,
      `runner started (agentId=${this.config.agentId}, intervalSec=${this.config.runtime.intervalSec}, commentLimit=${this.config.runtime.commentLimit}, maxTokens=${this.config.runtime.maxTokens || "unlimited"})`
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
      prompts: { ...this.config.prompts, ...(patchInput.prompts || {}) },
    };
    this.config = normalizeConfig(merged);
    this.logAgentId = this.config.agentId;
    this.logger = withLoggerAgentId(this.logger, this.logAgentId);
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
        runnerToken: config.runnerToken,
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
      trace(this.logger, "cycle:general-data", {
        generalData,
        generalAgent,
        generalCommunity,
      });
      if (!generalAgent) {
        throw new Error("General agent data is missing");
      }
      const provider = normalizeProvider(generalAgent.llmProvider);
      const model = String(
        generalAgent.llmModel || defaultModelForProvider(provider)
      ).trim();
      const persistedBaseUrl = String(generalAgent.llmBaseUrl || "").trim();

      const contextData = await fetchContext({
        snsBaseUrl: config.snsBaseUrl,
        runnerToken: config.runnerToken,
        agentId: config.agentId,
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

      const system = composeSystemPrompt(
        defaultSystemPrompt(),
        config.prompts.supplementaryProfile,
        config.prompts.system
      );
      const userTemplate = composeUserPromptTemplate(
        defaultUserPromptTemplate(),
        config.prompts.user
      );
      const user = userTemplate.replace(
        "{{context}}",
        JSON.stringify(contextData.context)
      );
      trace(this.logger, "cycle:prompt", {
        system,
        supplementaryProfile: config.prompts.supplementaryProfile || null,
        userTemplate,
        user,
      });

      const llmOutput = await callLlm({
        provider,
        model: model || defaultModelForProvider(provider),
        apiKey: config.llm.apiKey,
        baseUrl: config.llm.baseUrl || persistedBaseUrl,
        maxTokens: config.runtime.maxTokens,
        system,
        user,
      });
      this.state.lastLlmOutput = llmOutput || "";
      trace(this.logger, "cycle:llm-output", { llmOutput });
      writeCommunicationLog(this.logger, {
        createdAt: new Date().toISOString(),
        direction: "agent_to_runner",
        actionTypes: extractActionTypes(llmOutput || ""),
        agentId: config.agentId,
        content: llmOutput || "",
      });

      let actions = [];
      let noActionMessage = false;
      try {
        actions = parseDecisionWithFallback(llmOutput || "");
      } catch (error) {
        const parseMessage = toErrorMessage(error, "Failed to parse LLM output");
        if (parseMessage === "No JSON object/array found in LLM output") {
          // Plain-text result without JSON actions is treated as an intentional no-op.
          noActionMessage = true;
          actions = [];
          logSummary(
            this.logger,
            `cycle accepted plain-text no-action response (agentId=${config.agentId})`
          );
        } else {
          throw error;
        }
      }
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
        noActionMessage,
      });

      if (!validActions.length && !noActionMessage) {
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
          let threadResponse = null;
          let autoShare = null;
          let createThreadError = "";
          try {
            threadResponse = await createThread({
              snsBaseUrl: config.snsBaseUrl,
              runnerToken: config.runnerToken,
              agentId: config.agentId,
              communityId: community.id,
              title: String(action.title || "Agent update"),
              body: String(action.body || ""),
              threadType: action.threadType,
            });
          } catch (error) {
            createThreadError = toErrorMessage(error, "Failed to create thread");
            threadResponse = { error: createThreadError };
          }
          const requestedThreadType = String(action.threadType || "")
            .trim()
            .toUpperCase();
          if (requestedThreadType === "REPORT_TO_HUMAN") {
            if (createThreadError) {
              autoShare = {
                ok: false,
                skipped: true,
                blocked: true,
                error: `Skipped because create_thread failed: ${createThreadError}`,
              };
            } else {
              autoShare = await this.#autoShareReportToGithub({
                config,
                community,
                action,
                generalAgent,
                threadResponse,
              });
            }
          }
          trace(this.logger, "cycle:action:create-thread:result", {
            action,
            threadResponse,
            autoShare,
          });
          if (autoShare && autoShare.skipped && autoShare.disabled) {
            logSummary(
              this.logger,
              `report auto-share disabled (community=${community.slug}, threadId=${autoShare.threadId || "-"}, reason=${autoShare.reason || "token not provided"})`
            );
          } else if (autoShare && autoShare.skipped && autoShare.blocked) {
            logSummary(
              this.logger,
              `report auto-share skipped (community=${community.slug}, reason=${autoShare.error})`
            );
          } else if (autoShare && autoShare.ok) {
            logSummary(
              this.logger,
              `report auto-share completed (community=${community.slug}, threadId=${autoShare.threadId || "-"})`
            );
          } else if (autoShare && autoShare.error) {
            logSummary(
              this.logger,
              `report auto-share failed (community=${community.slug}, reason=${autoShare.error})`
            );
          }
          if (createThreadError) {
            logSummary(
              this.logger,
              `action create_thread failed (community=${community.slug}, reason=${createThreadError})`
            );
          } else {
            const createdThreadId =
              threadResponse &&
              threadResponse.thread &&
              threadResponse.thread.id
                ? String(threadResponse.thread.id)
                : "-";
            logSummary(
              this.logger,
              `action create_thread completed (community=${community.slug}, threadId=${createdThreadId})`
            );
          }
          executionResults.push({
            action: "create_thread",
            community: community.slug,
            result: toJsonSafe(threadResponse),
            autoShare: toJsonSafe(autoShare),
          });
          continue;
        }

        if (actionType === "comment") {
          const threadId = String(action.threadId || "").trim();
          if (!threadId) continue;
          const targetThread = Array.isArray(community.threads)
            ? community.threads.find(
                (candidate) =>
                  candidate && String(candidate.id || "").trim() === threadId
              ) || null
            : null;
          const targetThreadType = String(
            (targetThread && targetThread.type) || ""
          )
            .trim()
            .toUpperCase();
          let commentResponse = null;
          let autoShare = null;
          try {
            commentResponse = await createComment({
              snsBaseUrl: config.snsBaseUrl,
              runnerToken: config.runnerToken,
              agentId: config.agentId,
              threadId,
              body: String(action.body || ""),
            });
          } catch (error) {
            commentResponse = { error: toErrorMessage(error, "Failed to create comment") };
          }
          if (targetThreadType === "REPORT_TO_HUMAN") {
            autoShare = await this.#autoShareReportCommentToGithub({
              config,
              community,
              threadId,
              thread: targetThread,
              action,
              generalAgent,
              commentResponse,
            });
          }
          trace(this.logger, "cycle:action:comment:result", {
            action,
            commentResponse,
            autoShare,
          });
          if (autoShare && autoShare.skipped && autoShare.disabled) {
            logSummary(
              this.logger,
              `report-comment auto-share disabled (community=${community.slug}, threadId=${threadId}, commentId=${autoShare.commentId || "-"}, reason=${autoShare.reason || "token not provided"})`
            );
          } else if (autoShare && autoShare.ok) {
            logSummary(
              this.logger,
              `report-comment auto-share completed (community=${community.slug}, threadId=${threadId}, commentId=${autoShare.commentId || "-"})`
            );
          } else if (autoShare && autoShare.error) {
            logSummary(
              this.logger,
              `report-comment auto-share failed (community=${community.slug}, threadId=${threadId}, reason=${autoShare.error})`
            );
          }
          logSummary(
            this.logger,
            `action comment completed (community=${community.slug}, threadId=${threadId})`
          );
          executionResults.push({
            action: "comment",
            community: community.slug,
            threadId,
            result: toJsonSafe(commentResponse),
            autoShare: toJsonSafe(autoShare),
          });
          continue;
        }

        if (actionType === "tx") {
          const requestedAddress = String(action.contractAddress || "").trim();
          const contracts = Array.isArray(community.contracts)
            ? community.contracts.filter(
                (contract) =>
                  contract &&
                  typeof contract === "object" &&
                  String(contract.address || "").trim()
              )
            : [];
          const fallbackContract = {
            name: null,
            chain: community.chain || null,
            address: community.address || null,
            abi: Array.isArray(community.abi) ? community.abi : [],
            source: community.source || null,
            abiFunctions: Array.isArray(community.abiFunctions)
              ? community.abiFunctions
              : [],
          };
          const selectedContract = requestedAddress
            ? contracts.find(
                (contract) =>
                  String(contract.address || "").trim().toLowerCase() ===
                  requestedAddress.toLowerCase()
              ) ||
              (fallbackContract.address &&
              String(fallbackContract.address).toLowerCase() ===
                requestedAddress.toLowerCase()
                ? fallbackContract
                : null)
            : contracts[0] || fallbackContract;
          const selectedAddress = String(
            (selectedContract && selectedContract.address) || ""
          ).trim();
          const functionName = String(action.functionName || "").trim();
          const allowedFunction = Array.isArray(selectedContract?.abiFunctions)
            ? selectedContract.abiFunctions.some(
                (fn) => fn && String(fn.name || "") === functionName
              )
            : false;

          let txResult;
          if (!config.execution.privateKey || !config.execution.alchemyApiKey) {
            txResult = { error: "Execution wallet or Alchemy key missing." };
          } else if (requestedAddress && !selectedContract) {
            txResult = { error: "Contract address not allowed." };
          } else if (!selectedAddress) {
            txResult = { error: "Contract address not available." };
          } else if (!Array.isArray(selectedContract?.abi) || !selectedContract.abi.length) {
            txResult = { error: "Contract ABI not available." };
          } else if (!functionName || !allowedFunction) {
            txResult = { error: "Function not allowed." };
          } else {
            try {
              txResult = await this.#executeTxAction(
                config,
                community,
                selectedContract,
                action
              );
            } catch (error) {
              txResult = { error: toErrorMessage(error, "Tx failed") };
            }
          }
          trace(this.logger, "cycle:action:tx:result", {
            action,
            txResult,
          });
          const feedbackPayload = {
            type: "tx_feedback",
            communitySlug: community.slug,
            threadId: action.threadId || null,
            contractAddress: selectedAddress || null,
            functionName: action.functionName || null,
            args: Array.isArray(action.args) ? action.args : [],
            value: action.value ?? null,
            result: toJsonSafe(txResult),
          };
          writeCommunicationLog(this.logger, {
            createdAt: new Date().toISOString(),
            direction: "runner_to_agent",
            actionTypes: ["tx"],
            agentId: config.agentId,
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
          continue;
        }

        if (actionType === "set_request_status") {
          const threadId = String(action.threadId || "").trim();
          if (!threadId) continue;
          const nextStatus = String(action.status || "").trim().toLowerCase();
          let statusResponse = null;
          try {
            statusResponse = await setRequestStatus({
              snsBaseUrl: config.snsBaseUrl,
              runnerToken: config.runnerToken,
              agentId: config.agentId,
              threadId,
              status: nextStatus,
            });
          } catch (error) {
            statusResponse = {
              error: toErrorMessage(error, "Failed to set request status"),
            };
          }
          trace(this.logger, "cycle:action:set-request-status:result", {
            action,
            statusResponse,
          });
          logSummary(
            this.logger,
            `action set_request_status completed (community=${community.slug}, threadId=${threadId}, status=${nextStatus || "pending"})`
          );
          executionResults.push({
            action: "set_request_status",
            community: community.slug,
            threadId,
            result: toJsonSafe(statusResponse),
          });
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

  async #autoShareReportToGithub(params) {
    const thread = params.threadResponse && params.threadResponse.thread;
    if (!thread || !thread.id) {
      return {
        ok: false,
        skipped: true,
        error: "Report thread not available for auto-share.",
      };
    }

    const issueToken = String(
      params.config &&
        params.config.integrations &&
        params.config.integrations.githubIssueToken
        ? params.config.integrations.githubIssueToken
        : ""
    ).trim();
    if (!issueToken) {
      return {
        ok: true,
        skipped: true,
        disabled: true,
        threadId: String(thread.id),
        reason: "GitHub issue token not provided.",
      };
    }

    const repositoryUrl = String(params.community.githubRepositoryUrl || "").trim();
    if (!repositoryUrl) {
      return {
        ok: false,
        skipped: true,
        threadId: String(thread.id),
        error: "Community GitHub repository is not configured.",
      };
    }

    const threadId = String(thread.id || "").trim();
    const threadSlug = String(params.community.slug || "").trim();
    const threadUrl = `${params.config.snsBaseUrl}/sns/${threadSlug}/threads/${threadId}`;
    const rawCreatedAt = String(thread.createdAt || "").trim();
    const parsedCreatedAt = new Date(rawCreatedAt);
    const createdAtIso = Number.isFinite(parsedCreatedAt.getTime())
      ? parsedCreatedAt.toISOString()
      : new Date().toISOString();
    const title = buildReportIssueTitle(thread.title || params.action.title);
    const body = buildReportIssueBody({
      communityName: params.community.name,
      threadId,
      threadUrl,
      author: params.generalAgent && params.generalAgent.handle,
      createdAtIso,
      threadBody: thread.body || params.action.body,
    });

    try {
      const issue = await createGithubIssue({
        repositoryUrl,
        issueToken,
        title,
        body,
      });
      await markThreadIssued({
        snsBaseUrl: params.config.snsBaseUrl,
        runnerToken: params.config.runnerToken,
        agentId: params.config.agentId,
        threadId,
        isIssued: true,
      });
      return {
        ok: true,
        threadId,
        repositoryUrl: issue.repositoryUrl,
        issueNumber: issue.issueNumber,
        issueUrl: issue.issueUrl,
      };
    } catch (error) {
      return {
        ok: false,
        threadId,
        error: toErrorMessage(
          error,
          "GitHub issue auto-share failed or issued state sync failed"
        ),
      };
    }
  }

  async #autoShareReportCommentToGithub(params) {
    const comment = params.commentResponse && params.commentResponse.comment;
    if (!comment || !comment.id) {
      return {
        ok: false,
        skipped: true,
        error: "Report comment not available for auto-share.",
      };
    }

    const issueToken = String(
      params.config &&
        params.config.integrations &&
        params.config.integrations.githubIssueToken
        ? params.config.integrations.githubIssueToken
        : ""
    ).trim();
    if (!issueToken) {
      return {
        ok: true,
        skipped: true,
        disabled: true,
        commentId: String(comment.id),
        reason: "GitHub issue token not provided.",
      };
    }

    const repositoryUrl = String(params.community.githubRepositoryUrl || "").trim();
    if (!repositoryUrl) {
      return {
        ok: false,
        skipped: true,
        commentId: String(comment.id),
        error: "Community GitHub repository is not configured.",
      };
    }

    const threadId = String(params.threadId || "").trim();
    const commentId = String(comment.id || "").trim();
    const threadSlug = String(params.community.slug || "").trim();
    const threadUrl = `${params.config.snsBaseUrl}/sns/${threadSlug}/threads/${threadId}`;
    const commentUrl = `${threadUrl}#comment-${commentId}`;
    const rawCreatedAt = String(comment.createdAt || "").trim();
    const parsedCreatedAt = new Date(rawCreatedAt);
    const createdAtIso = Number.isFinite(parsedCreatedAt.getTime())
      ? parsedCreatedAt.toISOString()
      : new Date().toISOString();
    const title = buildReportCommentIssueTitle(
      (params.thread && params.thread.title) || ""
    );
    const body = buildReportCommentIssueBody({
      communityName: params.community.name,
      threadId,
      threadUrl,
      commentId,
      commentUrl,
      author: (params.generalAgent && params.generalAgent.handle) || "SYSTEM",
      createdAtIso,
      threadTitle: (params.thread && params.thread.title) || "Report",
      threadBody: (params.thread && params.thread.body) || "",
      commentBody: String(comment.body || params.action.body || ""),
    });

    try {
      const issue = await createGithubIssue({
        repositoryUrl,
        issueToken,
        title,
        body,
      });
      await markCommentIssued({
        snsBaseUrl: params.config.snsBaseUrl,
        runnerToken: params.config.runnerToken,
        agentId: params.config.agentId,
        commentId,
        isIssued: true,
      });
      return {
        ok: true,
        threadId,
        commentId,
        repositoryUrl: issue.repositoryUrl,
        issueNumber: issue.issueNumber,
        issueUrl: issue.issueUrl,
      };
    } catch (error) {
      return {
        ok: false,
        threadId,
        commentId,
        error: toErrorMessage(
          error,
          "GitHub comment issue auto-share failed or issued state sync failed"
        ),
      };
    }
  }

  async #executeTxAction(config, community, contractContext, action) {
    trace(this.logger, "tx-action:start", {
      config,
      community,
      contractContext,
      action,
    });
    if (!config.execution.privateKey || !config.execution.alchemyApiKey) {
      throw new Error(
        "TX action requires execution.privateKey and execution.alchemyApiKey"
      );
    }
    if (!contractContext || !String(contractContext.address || "").trim()) {
      throw new Error("Community contract address is not available");
    }
    if (!Array.isArray(contractContext.abi) || !contractContext.abi.length) {
      throw new Error("Community ABI is not available");
    }

    const rpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${config.execution.alchemyApiKey}`;
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(config.execution.privateKey, provider);
    const contractAddress = String(contractContext.address || "").trim();
    const contract = new Contract(contractAddress, contractContext.abi, wallet);
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
        contractAddress,
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
      contractAddress,
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
