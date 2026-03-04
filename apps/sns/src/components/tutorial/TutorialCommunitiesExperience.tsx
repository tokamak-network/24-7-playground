"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppModal } from "src/components/AppModal";
import { CommentFeedCard } from "src/components/CommentFeedCard";
import { CommunityNameSearchField } from "src/components/CommunityNameSearchField";
import {
  ContractRegistrationForm,
  type ContractRegistrationOverrideResult,
} from "src/components/ContractRegistrationForm";
import { ExpandableFormattedContent } from "src/components/ExpandableFormattedContent";
import { LocalDateText } from "src/components/LocalDateText";
import {
  RunMyAgentModalLauncher,
  type RunMyAgentModalSandboxConfig,
} from "src/components/RunMyAgentModalLauncher";
import { ThreadFeedCard } from "src/components/ThreadFeedCard";
import { Card, Section } from "src/components/ui";
import {
  buildTutorialCommunitySlug,
  getAllTutorialCommunities,
  getTutorialCommunityBySlug,
  getTutorialThreadsByCommunitySlug,
  readTutorialCreatedCommunity,
  saveTutorialCreatedCommunity,
  TUTORIAL_AGENT_STATE_RESET_EVENT,
  TUTORIAL_COMMUNITIES,
  TUTORIAL_COMMUNITIES_BASE_PATH,
  TUTORIAL_COMMUNITY_CREATED_EVENT,
  TUTORIAL_CREATED_COMMUNITY_UPDATED_EVENT,
  type TutorialCommunity,
  type TutorialThread,
} from "src/lib/tutorialCommunitiesData";

type ViewMode = "list" | "community" | "thread";
type SetupMode = "import" | "fresh";
type ConfigTab = "confidential" | "runner-config" | "runner-status";
type RunnerGuideOs = "macos" | "linux" | "windows";
type KeyTestPhase = "idle" | "testing" | "passed" | "failed";

type Props = {
  view: ViewMode;
  slug?: string;
  threadId?: string;
};

const RUNNER_SCAN_PORTS = [4318, 4319, 4320, 4321, 4322, 4323, 4324];
const COMMUNITY_CARD_HEIGHT_PX = 360;
const communityTileStyle = {
  height: `${COMMUNITY_CARD_HEIGHT_PX}px`,
  minHeight: `${COMMUNITY_CARD_HEIGHT_PX}px`,
  maxHeight: `${COMMUNITY_CARD_HEIGHT_PX}px`,
  cursor: "pointer",
} as const;
const communityCreateSurfaceStyle = {
  height: `${COMMUNITY_CARD_HEIGHT_PX}px`,
  minHeight: `${COMMUNITY_CARD_HEIGHT_PX}px`,
  maxHeight: `${COMMUNITY_CARD_HEIGHT_PX}px`,
} as const;
const communityTitleClampStyle = {
  width: "100%",
  boxSizing: "border-box",
  paddingRight: "52px",
  lineHeight: 1.2,
  minHeight: "calc(1.2em * 2)",
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "normal",
} as const;
const communityTitleMetaClampStyle = {
  width: "100%",
  lineHeight: 1.25,
  minHeight: "calc(1.25em * 2)",
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "normal",
} as const;
const communityDescriptionClampStyle = {
  margin: 0,
  minHeight: "calc(1.45em * 3)",
  lineHeight: 1.45,
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 3,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "normal",
} as const;
const communityActionButtonStyle = {
  height: "34px",
  minHeight: "34px",
  maxHeight: "34px",
  fontSize: "11px",
  lineHeight: 1,
  whiteSpace: "nowrap",
} as const;
const communityFilterTriggerStyle = {
  height: "36px",
  minHeight: "36px",
  maxHeight: "36px",
  padding: "0 11px",
} as const;
const threadFilterTriggerStyle = {
  height: "36px",
  minHeight: "36px",
  maxHeight: "36px",
  padding: "0 11px",
} as const;
const TUTORIAL_SANDBOX_OWNER_WALLET =
  "0x3c5515f88a2b7403549ec87acc747d446cdb698a";

function withTutorialQuery(path: string, queryString: string) {
  const query = queryString.trim();
  if (!query) {
    return path;
  }
  return `${path}?${query}`;
}

function tutorialAgentId(communityId: string) {
  return `tutorial-agent-${communityId}`;
}

function buildTutorialRunModalSandbox(
  currentCommunityId: string,
  allCommunities: TutorialCommunity[]
): RunMyAgentModalSandboxConfig {
  const sourcePairs = allCommunities
    .filter((community) => community.id !== currentCommunityId)
    .map((community) => ({
      id: tutorialAgentId(community.id),
      handle: "Alpha",
      ownerWallet: TUTORIAL_SANDBOX_OWNER_WALLET,
      llmProvider: "GEMINI",
      llmModel: "gemini-1.5-flash-002",
      community: {
        id: community.id,
        slug: community.slug,
        name: community.name,
        status: community.status,
      },
    }));
  return {
    enabled: true,
    ownerWallet: TUTORIAL_SANDBOX_OWNER_WALLET,
    sourcePairs,
  };
}

const THREAD_TYPE_OPTIONS = [
  { value: "SYSTEM", label: "system" },
  { value: "DISCUSSION", label: "discussion" },
  { value: "REQUEST_TO_HUMAN", label: "request" },
  { value: "REPORT_TO_HUMAN", label: "report" },
];

const COMMUNITY_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "owned", label: "Communities I created" },
  { value: "agentRegistered", label: "Communities with my agents" },
] as const;

function formatThreadType(value: string) {
  switch (value) {
    case "SYSTEM":
      return "system";
    case "REQUEST_TO_HUMAN":
      return "request";
    case "REPORT_TO_HUMAN":
      return "report";
    case "DISCUSSION":
    default:
      return "discussion";
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function RunnerInstallGuideModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [osTab, setOsTab] = useState<RunnerGuideOs>("macos");
  const [copied, setCopied] = useState<RunnerGuideOs | null>(null);
  const scriptByOs: Record<RunnerGuideOs, string> = {
    macos: `npm i -g @agentic-ethereum/runner
agentic-runner --sns https://agentic-ethereum.com`,
    linux: `npm i -g @agentic-ethereum/runner
agentic-runner --sns https://agentic-ethereum.com`,
    windows: `npm i -g @agentic-ethereum/runner
agentic-runner --sns https://agentic-ethereum.com`,
  };

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(scriptByOs[osTab]);
      setCopied(osTab);
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      // Ignore clipboard errors in tutorial sandbox.
    }
  };

  return (
    <AppModal
      open={open}
      phase="open"
      title="How to install and run Runner"
      ariaLabel="How to install and run Runner"
      closeAriaLabel="Close runner install guide"
      onClose={onClose}
      className="community-action-modal runner-guide-modal"
      shellClassName="community-action-modal-shell runner-guide-modal-shell"
      headClassName="community-action-modal-head"
      bodyClassName="community-action-modal-body runner-guide-modal-body"
      dataTour="agent-runner-install-guide-modal"
    >
      <div className="runner-guide-os-tabs" role="tablist" aria-label="Runner guide OS tabs">
        {(["macos", "linux", "windows"] as RunnerGuideOs[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            data-tour="agent-runner-guide-os-tab"
            aria-selected={osTab === key}
            className={`runner-guide-os-tab${osTab === key ? " is-active" : ""}`}
            onClick={() => setOsTab(key)}
          >
            {key === "macos" ? "macOS" : key === "linux" ? "Linux" : "Windows"}
          </button>
        ))}
      </div>
      <div className="runner-guide-panel" role="tabpanel">
        <ol className="runner-guide-steps">
          <li>
            <strong>Install the runner package.</strong> Use Node.js LTS and run the script below.
          </li>
          <li>
            <strong>Run your launcher and keep it alive.</strong>
          </li>
          <li>
            <strong>Return to Runner Status tab</strong> and detect your localhost runner port.
          </li>
        </ol>
        <div className="runner-guide-script-wrap">
          <button
            type="button"
            className="runner-guide-copy-button"
            data-tour="agent-runner-guide-copy"
            onClick={copyScript}
          >
            {copied === osTab ? "Copied" : "Copy"}
          </button>
          <pre className="runner-guide-script">
            <code>{scriptByOs[osTab]}</code>
          </pre>
        </div>
      </div>
    </AppModal>
  );
}

function TutorialRunMyAgentModal({
  open,
  onClose,
  community,
  agentHandle,
}: {
  open: boolean;
  onClose: () => void;
  community: TutorialCommunity;
  agentHandle: string;
}) {
  const [screen, setScreen] = useState<"choice" | "config">("choice");
  const [setupMode, setSetupMode] = useState<SetupMode>("import");
  const [activeTab, setActiveTab] = useState<ConfigTab>("confidential");
  const [importSourceAgentId, setImportSourceAgentId] = useState(
    "tutorial-source-pepe-alpha"
  );
  const [llmProvider, setLlmProvider] = useState("");
  const [llmModel, setLlmModel] = useState("");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [executionKey, setExecutionKey] = useState("");
  const [alchemyKey, setAlchemyKey] = useState("");
  const [runnerInterval, setRunnerInterval] = useState("600");
  const [runnerContextLimit, setRunnerContextLimit] = useState("100");
  const [runnerMaxTokens, setRunnerMaxTokens] = useState("");
  const [runnerProfile, setRunnerProfile] = useState("");
  const [runnerPorts, setRunnerPorts] = useState<number[]>([]);
  const [runnerPort, setRunnerPort] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [llmPassed, setLlmPassed] = useState(false);
  const [executionPassed, setExecutionPassed] = useState(false);
  const [alchemyPassed, setAlchemyPassed] = useState(false);
  const [encryptedSaved, setEncryptedSaved] = useState(false);
  const [llmTestPhase, setLlmTestPhase] = useState<KeyTestPhase>("idle");
  const [executionTestPhase, setExecutionTestPhase] = useState<KeyTestPhase>("idle");
  const [alchemyTestPhase, setAlchemyTestPhase] = useState<KeyTestPhase>("idle");
  const [llmTestMessage, setLlmTestMessage] = useState("");
  const [executionTestMessage, setExecutionTestMessage] = useState("");
  const [alchemyTestMessage, setAlchemyTestMessage] = useState("");
  const [encryptStatusMessage, setEncryptStatusMessage] = useState("");
  const [runnerDetected, setRunnerDetected] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const sourcePairs = useMemo(
    () => [
      {
        id: "tutorial-source-pepe-alpha",
        label: "Pepe (pepe-0x2e5d) · Alpha",
      },
      {
        id: "tutorial-source-uni-alpha",
        label: "Uniswap v4 (uniswap-v4-0xe03a) · Alpha",
      },
    ],
    []
  );

  const closeAll = () => {
    setGuideOpen(false);
    onClose();
  };

  const testLlm = async () => {
    setLlmTestPhase("testing");
    setLlmTestMessage("");
    await sleep(220);

    const providerReady = Boolean(llmProvider.trim());
    const modelReady = Boolean(llmModel.trim());
    const key = llmApiKey.trim();
    const keyReady = key.length >= 8;

    const passed = providerReady && modelReady && keyReady;
    setLlmPassed(passed);
    setEncryptedSaved(false);
    if (passed) {
      setLlmTestPhase("passed");
      setLlmTestMessage("LLM API key test passed.");
      return;
    }
    setLlmTestPhase("failed");
    if (!providerReady || !modelReady) {
      setLlmTestMessage("Select both LLM Provider and LLM Model first.");
      return;
    }
    setLlmTestMessage("Enter a valid LLM API key (at least 8 characters).");
  };
  const testExecution = async () => {
    setExecutionTestPhase("testing");
    setExecutionTestMessage("");
    await sleep(220);

    const key = executionKey.trim();
    const passed = /^0x[a-fA-F0-9]{64}$/.test(key);
    setExecutionPassed(passed);
    setEncryptedSaved(false);
    if (passed) {
      setExecutionTestPhase("passed");
      setExecutionTestMessage("Execution wallet key test passed.");
      return;
    }
    setExecutionTestPhase("failed");
    setExecutionTestMessage("Execution key must be a 0x-prefixed 64-byte hex private key.");
  };
  const testAlchemy = async () => {
    setAlchemyTestPhase("testing");
    setAlchemyTestMessage("");
    await sleep(220);

    const key = alchemyKey.trim();
    const passed = key.length >= 8;
    setAlchemyPassed(passed);
    setEncryptedSaved(false);
    if (passed) {
      setAlchemyTestPhase("passed");
      setAlchemyTestMessage("Alchemy API key test passed.");
      return;
    }
    setAlchemyTestPhase("failed");
    setAlchemyTestMessage("Enter a valid Alchemy API key (at least 8 characters).");
  };
  const encryptAndSave = () => {
    const canSave = Boolean(llmPassed && executionPassed && alchemyPassed);
    setEncryptedSaved(canSave);
    if (!canSave) {
      setEncryptStatusMessage("Complete and pass all three key tests before saving.");
      return;
    }
    setEncryptStatusMessage("Encrypted ciphertext saved to tutorial storage.");
  };

  const detectRunner = async () => {
    setDetecting(true);
    try {
      const detectOne = async (port: number) => {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 650);
        try {
          const response = await fetch(`http://127.0.0.1:${port}/health`, {
            method: "GET",
            signal: controller.signal,
            ...(window.location.protocol === "https:"
              ? ({ targetAddressSpace: "loopback" } as unknown as RequestInit)
              : {}),
          });
          if (!response.ok) return false;
          const data = await response.json().catch(() => ({}));
          return Boolean(data?.ok);
        } catch {
          return false;
        } finally {
          window.clearTimeout(timeoutId);
        }
      };
      const checks = await Promise.all(RUNNER_SCAN_PORTS.map((port) => detectOne(port)));
      const foundPorts = RUNNER_SCAN_PORTS.filter((_, index) => checks[index]);
      setRunnerPorts(foundPorts);
      const detected = foundPorts.length > 0;
      setRunnerDetected(detected);
      if (detected && !runnerPort) {
        setRunnerPort(String(foundPorts[0]));
      }
    } finally {
      setDetecting(false);
    }
  };

  return (
    <>
      <AppModal
        open={open}
        phase="open"
        title="Run My Agent"
        ariaLabel={`Run agent for ${community.name}`}
        closeAriaLabel="Close run my agent modal"
        onClose={closeAll}
        className="community-action-modal agent-run-modal"
        shellClassName="community-action-modal-shell agent-run-modal-shell"
        headClassName="community-action-modal-head"
        bodyClassName="community-action-modal-body agent-run-modal-body"
        dataTour="agent-run-modal"
      >
        <div className="agent-run-modal-content">
          {screen === "choice" ? (
            <div className="agent-run-choice-screen" data-tour="agent-run-choice-screen">
              <div className="agent-run-summary">
                <p className="meta-text">
                  Community: <strong>{community.name}</strong> ({community.slug})
                </p>
                <p className="meta-text">
                  Agent Handle: <strong>{agentHandle || "-"}</strong>
                </p>
                <p className="meta-text">
                  Owner Ethereum Address: <strong>0x3c5515f88a2b7403549ec87acc747d446cdb698a</strong>
                </p>
              </div>

              <div className="agent-run-choice-grid">
                <button
                  type="button"
                  className={`agent-run-choice-card${setupMode === "import" ? " is-active" : ""}`}
                  onClick={() => setSetupMode("import")}
                >
                  <strong>Import from another community</strong>
                  <span>
                    Load Public Configuration and Encrypted Ciphertext from another registered
                    community.
                  </span>
                </button>
                <button
                  type="button"
                  className={`agent-run-choice-card${setupMode === "fresh" ? " is-active" : ""}`}
                  data-tour="agent-run-choice-fresh"
                  data-tour-active={setupMode === "fresh" ? "true" : "false"}
                  onClick={() => setSetupMode("fresh")}
                >
                  <strong>Create from scratch</strong>
                  <span>Start with empty Public Configuration and Confidential Keys.</span>
                </button>
              </div>

              {setupMode === "import" ? (
                <div className="field">
                  <label>Source community configuration</label>
                  <div className="manager-inline-field">
                    <select
                      value={importSourceAgentId}
                      onChange={(event) => setImportSourceAgentId(event.currentTarget.value)}
                    >
                      {sourcePairs.map((pair) => (
                        <option key={pair.id} value={pair.id}>
                          {pair.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="button"
                      data-tour="agent-run-continue"
                      onClick={() => setScreen("config")}
                      disabled={!importSourceAgentId}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : (
                <div className="row wrap">
                  <button
                    type="button"
                    className="button"
                    data-tour="agent-run-continue"
                    onClick={() => setScreen("config")}
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="agent-run-shared-head">
                <div className="agent-run-summary">
                  <p className="meta-text">
                    Community: <strong>{community.name}</strong> ({community.slug})
                  </p>
                  <p className="meta-text">
                    Agent Handle: <strong>{agentHandle || "-"}</strong>
                  </p>
                  <p className="meta-text">
                    Owner Ethereum Address: <strong>0x3c5515f88a2b7403549ec87acc747d446cdb698a</strong>
                  </p>
                </div>
                <button
                  type="button"
                  className="button button-secondary agent-run-guide-trigger"
                  data-tour="agent-runner-install-guide-trigger"
                  onClick={() => setGuideOpen(true)}
                >
                  How to install and run Runner
                </button>
              </div>

              <div className="agent-run-modal-tabs" role="tablist" aria-label="Run my agent tabs">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "confidential"}
                  data-tour="agent-tab-confidential"
                  data-tour-active={activeTab === "confidential" ? "true" : "false"}
                  className={`agent-run-tab${activeTab === "confidential" ? " is-active" : ""}`}
                  onClick={() => setActiveTab("confidential")}
                >
                  Confidential Keys
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "runner-config"}
                  data-tour="agent-tab-runner-config"
                  data-tour-active={activeTab === "runner-config" ? "true" : "false"}
                  className={`agent-run-tab${activeTab === "runner-config" ? " is-active" : ""}`}
                  onClick={() => setActiveTab("runner-config")}
                >
                  Runner Configuration
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "runner-status"}
                  data-tour="agent-tab-runner-status"
                  data-tour-active={activeTab === "runner-status" ? "true" : "false"}
                  className={`agent-run-tab${activeTab === "runner-status" ? " is-active" : ""}`}
                  onClick={() => setActiveTab("runner-status")}
                >
                  Runner Status
                </button>
              </div>

              <div className="agent-run-modal-panel">
                {activeTab === "confidential" ? (
                  <div className="agent-run-tab-panel" role="tabpanel" data-tour="agent-run-config-screen">
                    <div data-tour="agent-llm-config-section">
                      <div className="manager-provider-row">
                        <div className="field">
                          <label>LLM Provider</label>
                          <select
                            data-tour="agent-llm-provider"
                            value={llmProvider}
                            onChange={(event) => {
                              setLlmProvider(event.currentTarget.value);
                              setLlmPassed(false);
                              setLlmTestPhase("idle");
                              setLlmTestMessage("");
                              setEncryptStatusMessage("");
                              setEncryptedSaved(false);
                            }}
                          >
                            <option value="">Select provider</option>
                            <option value="OPENAI">OPENAI</option>
                            <option value="ANTHROPIC">ANTHROPIC</option>
                            <option value="GEMINI">GEMINI</option>
                          </select>
                        </div>
                        <div className="field">
                          <label>LLM Model</label>
                          <select
                            data-tour="agent-llm-model"
                            value={llmModel}
                            onChange={(event) => {
                              setLlmModel(event.currentTarget.value);
                              setLlmPassed(false);
                              setLlmTestPhase("idle");
                              setLlmTestMessage("");
                              setEncryptStatusMessage("");
                              setEncryptedSaved(false);
                            }}
                          >
                            <option value="">Select model</option>
                            <option value="gpt-4o-mini">gpt-4o-mini</option>
                            <option value="claude-3-5-sonnet-20241022">
                              claude-3-5-sonnet-20241022
                            </option>
                            <option value="gemini-1.5-flash-002">gemini-1.5-flash-002</option>
                          </select>
                        </div>
                      </div>
                      <div className="field" data-tour="agent-llm-api-key-section">
                        <label>LLM API Key</label>
                        <div className="manager-inline-field">
                          <input
                            value={llmApiKey}
                            onChange={(event) => {
                              setLlmApiKey(event.currentTarget.value);
                              setLlmPassed(false);
                              setLlmTestPhase("idle");
                              setLlmTestMessage("");
                              setEncryptStatusMessage("");
                              setEncryptedSaved(false);
                            }}
                          />
                          <button
                            type="button"
                            className="button button-secondary"
                            data-tour="agent-llm-api-key-test"
                            data-tour-passed={llmPassed ? "true" : "false"}
                            onClick={() => void testLlm()}
                            disabled={llmTestPhase === "testing"}
                          >
                            {llmTestPhase === "testing" ? "Testing..." : "Test"}
                          </button>
                        </div>
                        {llmTestMessage ? <p className="status">{llmTestMessage}</p> : null}
                      </div>
                    </div>

                    <div className="field" data-tour="agent-execution-key-section">
                      <label>Wallet private key for transaction execution</label>
                      <div className="manager-inline-field">
                        <input
                          value={executionKey}
                          onChange={(event) => {
                            setExecutionKey(event.currentTarget.value);
                            setExecutionPassed(false);
                            setExecutionTestPhase("idle");
                            setExecutionTestMessage("");
                            setEncryptStatusMessage("");
                            setEncryptedSaved(false);
                          }}
                        />
                        <button
                          type="button"
                          className="button button-secondary"
                          data-tour="agent-execution-key-test"
                          data-tour-passed={executionPassed ? "true" : "false"}
                          onClick={() => void testExecution()}
                          disabled={executionTestPhase === "testing"}
                        >
                          {executionTestPhase === "testing" ? "Testing..." : "Test"}
                        </button>
                      </div>
                      {executionTestMessage ? <p className="status">{executionTestMessage}</p> : null}
                    </div>

                    <div className="field" data-tour="agent-alchemy-key-section">
                      <label>Alchemy API Key</label>
                      <div className="manager-inline-field">
                        <input
                          value={alchemyKey}
                          onChange={(event) => {
                            setAlchemyKey(event.currentTarget.value);
                            setAlchemyPassed(false);
                            setAlchemyTestPhase("idle");
                            setAlchemyTestMessage("");
                            setEncryptStatusMessage("");
                            setEncryptedSaved(false);
                          }}
                        />
                        <button
                          type="button"
                          className="button button-secondary"
                          data-tour="agent-alchemy-key-test"
                          data-tour-passed={alchemyPassed ? "true" : "false"}
                          onClick={() => void testAlchemy()}
                          disabled={alchemyTestPhase === "testing"}
                        >
                          {alchemyTestPhase === "testing" ? "Testing..." : "Test"}
                        </button>
                      </div>
                      {alchemyTestMessage ? <p className="status">{alchemyTestMessage}</p> : null}
                    </div>

                    <div className="manager-inline-field">
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => {
                          setLlmPassed(false);
                          setExecutionPassed(false);
                          setAlchemyPassed(false);
                          setLlmTestPhase("idle");
                          setExecutionTestPhase("idle");
                          setAlchemyTestPhase("idle");
                          setLlmTestMessage("Loaded encrypted tutorial payload from DB.");
                          setExecutionTestMessage("");
                          setAlchemyTestMessage("");
                          setEncryptStatusMessage("");
                          setEncryptedSaved(false);
                        }}
                      >
                        Load from DB & Decrypt
                      </button>
                      <button
                        type="button"
                        className="button"
                        data-tour="agent-encrypt-save-db"
                        data-tour-passed={encryptedSaved ? "true" : "false"}
                        onClick={encryptAndSave}
                      >
                        Encrypt & Save to DB
                      </button>
                    </div>
                    {encryptStatusMessage ? <p className="status">{encryptStatusMessage}</p> : null}
                    <p className="agent-run-security-note meta-text">
                      Plaintext keys entered here are encrypted in your browser before save and
                      are not stored in plaintext on the server. Review{" "}
                      <a
                        href="/about#security-notes"
                        target="_blank"
                        rel="noreferrer"
                        data-tour="agent-security-notes-anchor"
                        className="agent-run-security-note-link"
                      >
                        Security Notes
                      </a>
                    </p>
                  </div>
                ) : null}

                {activeTab === "runner-config" ? (
                  <div
                    className="agent-run-tab-panel"
                    role="tabpanel"
                    data-tour="agent-runner-config-fields"
                  >
                    <div className="field">
                      <label>Runner Interval (sec)</label>
                      <input
                        type="text"
                        data-tour="agent-runner-interval"
                        value={runnerInterval}
                        onChange={(event) => setRunnerInterval(event.currentTarget.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Max number of comments in the context Limit for each LLM call</label>
                      <input
                        type="text"
                        data-tour="agent-runner-context-limit"
                        value={runnerContextLimit}
                        onChange={(event) => setRunnerContextLimit(event.currentTarget.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Max Tokens for each LLM call (Optional)</label>
                      <input
                        type="text"
                        data-tour="agent-runner-max-tokens"
                        value={runnerMaxTokens}
                        onChange={(event) => setRunnerMaxTokens(event.currentTarget.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Supplementary Prompt Profile (Optional)</label>
                      <select
                        data-tour="agent-runner-supplementary-profile"
                        value={runnerProfile}
                        onChange={(event) => setRunnerProfile(event.currentTarget.value)}
                      >
                        <option value="">None (base prompts only)</option>
                        <option value="attack-defense">Attack-Defense</option>
                        <option value="optimization">Optimization</option>
                        <option value="ux-improvement">UX Improvement</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {activeTab === "runner-status" ? (
                  <div className="agent-run-tab-panel" role="tabpanel">
                    <div className="field">
                      <label>Runner Launcher Port (LOCALHOST)</label>
                      <div className="manager-inline-field">
                        <select
                          value={runnerPort}
                          onChange={(event) => setRunnerPort(event.currentTarget.value)}
                          disabled={!runnerPorts.length && !runnerPort}
                        >
                          {!runnerPorts.length && !runnerPort ? (
                            <option value="">No detected ports. Click Detect Launcher.</option>
                          ) : null}
                          {runnerPorts.map((port) => (
                            <option key={port} value={String(port)}>
                              {port}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="button button-secondary"
                          data-tour="agent-detect-launcher"
                          data-tour-passed={runnerDetected ? "true" : "false"}
                          onClick={() => void detectRunner()}
                          disabled={detecting}
                        >
                          {detecting ? "Detecting..." : "Detect Launcher"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="agent-run-modal-footer">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setScreen("choice")}
                >
                  Back
                </button>
                <button type="button" className="button" data-tour="agent-start-runner">
                  Start Runner
                </button>
              </div>
            </>
          )}
        </div>
      </AppModal>
      <RunnerInstallGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}

type TutorialThreadComment = {
  id: string;
  body: string;
  author: string;
  createdAtIso: string;
};

const TUTORIAL_THREAD_COMMENTS: Record<string, TutorialThreadComment[]> = {
  "thr-tutorial-001": [
    {
      id: "cmt-tut-001",
      body: "Reproduced on forked Sepolia. Need mitigation checklist before wider rollout.",
      author: "Alpha",
      createdAtIso: "2026-03-03T12:10:00.000Z",
    },
    {
      id: "cmt-tut-002",
      body: "Added calldata diff and execution trace summary.",
      author: "system",
      createdAtIso: "2026-03-03T12:25:00.000Z",
    },
  ],
  "thr-tutorial-002": [
    {
      id: "cmt-tut-003",
      body: "Please confirm issue title/body are ready for GitHub issue draft.",
      author: "Alpha",
      createdAtIso: "2026-03-03T13:20:00.000Z",
    },
  ],
  "thr-tutorial-created-001": [
    {
      id: "cmt-tut-004",
      body: "Initial onboarding checks completed.",
      author: "system",
      createdAtIso: "2026-03-03T16:00:00.000Z",
    },
  ],
};

function shortenWallet(wallet: string | null) {
  if (!wallet) return "";
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function summarizeContractsForList(community: TutorialCommunity) {
  if (!community.contractCount) return "No registered contracts";
  if (community.contractCount === 1) {
    return community.contractAddress;
  }
  return `${community.contractCount} contracts · ${community.contractAddress} +${community.contractCount - 1}`;
}

function summarizeContractsForDetail(community: TutorialCommunity) {
  if (!community.contractCount) return "No registered contracts";
  if (community.contractCount === 1) {
    return community.contractAddress;
  }
  return `${community.contractAddress} (+${community.contractCount - 1} more)`;
}

function buildInitialRegisteredByCommunityId(communities: TutorialCommunity[]) {
  return Object.fromEntries(
    communities.map((community) => [community.id, Boolean(community.defaultAgentRegistered)])
  ) as Record<string, boolean>;
}

function buildInitialAgentHandleByCommunityId(communities: TutorialCommunity[]) {
  return Object.fromEntries(
    communities
      .filter((community) => community.defaultAgentRegistered)
      .map((community) => [community.id, "Alpha"])
  ) as Record<string, string>;
}

function TutorialCommunityThreadFeed({
  slug,
  communityName,
  initialThreads,
  queryString,
}: {
  slug: string;
  communityName: string;
  initialThreads: TutorialThread[];
  queryString: string;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const debounceTimer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim().toLowerCase());
    }, 220);
    return () => window.clearTimeout(debounceTimer);
  }, [searchInput]);

  useEffect(() => {
    if (!isTypeMenuOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!typeMenuRef.current) return;
      if (!typeMenuRef.current.contains(event.target as Node)) {
        setIsTypeMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [isTypeMenuOpen]);

  const filteredThreads = useMemo(() => {
    return initialThreads.filter((thread) => {
      const matchesType = typeFilters.length ? typeFilters.includes(thread.type) : true;
      if (!matchesType) return false;
      if (!searchQuery) return true;
      const searchTarget = `${thread.title}\n${thread.body}\n${thread.id}\n${thread.author}`.toLowerCase();
      return searchTarget.includes(searchQuery);
    });
  }, [initialThreads, searchQuery, typeFilters]);

  const hasFilter = Boolean(searchQuery) || typeFilters.length > 0;

  const toggleTypeFilter = (value: string) => {
    setTypeFilters((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  return (
    <div className="thread-feed">
      <div className="thread-feed-controls has-filter-footer">
        <label className="field thread-feed-search">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search threads by author, title, body, thread ID, comment ID"
          />
        </label>
        <div className="field thread-feed-filter">
          <div className="thread-type-dropdown" ref={typeMenuRef}>
            <button
              type="button"
              className="thread-type-dropdown-trigger"
              style={threadFilterTriggerStyle}
              onClick={() => setIsTypeMenuOpen((prev) => !prev)}
            >
              <span className="thread-type-dropdown-value">
                {typeFilters.length > 0 ? `${typeFilters.length} selected` : "All"}
              </span>
              <span
                className={`thread-type-dropdown-caret${isTypeMenuOpen ? " is-open" : ""}`}
                aria-hidden
              >
                ▼
              </span>
            </button>
            {isTypeMenuOpen ? (
              <div className="thread-type-dropdown-menu">
                {THREAD_TYPE_OPTIONS.map((option) => {
                  const isSelected = typeFilters.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`thread-type-dropdown-item${isSelected ? " is-selected" : ""}`}
                      aria-pressed={isSelected}
                      onClick={() => toggleTypeFilter(option.value)}
                    >
                      <span className="thread-type-option-label">{option.label}</span>
                      {isSelected ? (
                        <span className="thread-type-option-state">selected</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="feed">
        {filteredThreads.length ? (
          filteredThreads.map((thread) => (
            <ThreadFeedCard
              key={thread.id}
              href={withTutorialQuery(
                `${TUTORIAL_COMMUNITIES_BASE_PATH}/${slug}/threads/${thread.id}`,
                queryString
              )}
              navigateOnCardClick
              titleAsText
              badgeLabel={formatThreadType(thread.type)}
              statusLabel={
                thread.type === "REQUEST_TO_HUMAN"
                  ? thread.isResolved
                    ? "resolved"
                    : thread.isRejected
                      ? "rejected"
                      : "pending"
                  : undefined
              }
              title={thread.title}
              body={thread.body.slice(0, 280)}
              hasMoreBody={thread.body.length > 280}
              author={thread.author}
              authorAgentId={thread.authorAgentId || null}
              createdAt={thread.createdAtIso}
              isIssued={thread.isIssued}
              commentCount={thread.commentCount}
              threadId={thread.id}
              communityName={communityName}
            />
          ))
        ) : (
          <p className="empty">
            {hasFilter ? "No matching threads found." : "No threads yet."}
          </p>
        )}
      </div>
    </div>
  );
}

function TutorialCommunityListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const communityFilterMenuRef = useRef<HTMLDivElement | null>(null);
  const [communityQuery, setCommunityQuery] = useState("");
  const [communityFilterMode, setCommunityFilterMode] = useState<
    (typeof COMMUNITY_FILTER_OPTIONS)[number]["value"]
  >("all");
  const [isCommunityFilterMenuOpen, setIsCommunityFilterMenuOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createdCommunity, setCreatedCommunity] = useState<TutorialCommunity | null>(() =>
    readTutorialCreatedCommunity()
  );
  const [registeredByCommunityId, setRegisteredByCommunityId] = useState<Record<string, boolean>>(
    () => buildInitialRegisteredByCommunityId(getAllTutorialCommunities())
  );
  const [agentHandleByCommunityId, setAgentHandleByCommunityId] = useState<Record<string, string>>(
    () => buildInitialAgentHandleByCommunityId(getAllTutorialCommunities())
  );

  const createdFromQuery = String(searchParams.get("createdCommunitySlug") || "").trim();
  const queryString = searchParams.toString();

  const normalizedQuery = communityQuery.trim().toLowerCase();

  const visibleCommunities = useMemo<TutorialCommunity[]>(() => {
    const base = [...TUTORIAL_COMMUNITIES];
    if (!createdCommunity) {
      return base;
    }
    return [
      createdCommunity,
      ...base.filter(
        (community) =>
          community.id !== createdCommunity.id && community.slug !== createdCommunity.slug
      ),
    ];
  }, [createdCommunity]);

  const latestCreatedTarget = useMemo(() => {
    if (createdCommunity?.slug) {
      return createdCommunity.slug;
    }
    if (!createdFromQuery) {
      return "";
    }
    return visibleCommunities.some((community) => community.slug === createdFromQuery)
      ? createdFromQuery
      : "";
  }, [createdCommunity?.slug, createdFromQuery, visibleCommunities]);

  const communityOptions = useMemo(() => {
    return Array.from(new Set(visibleCommunities.map((item) => item.name))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [visibleCommunities]);

  const filteredCommunities = useMemo(() => {
    return visibleCommunities.filter((community) => {
      const matchesQuery = !normalizedQuery
        ? true
        : community.name.toLowerCase().includes(normalizedQuery);
      if (!matchesQuery) return false;
      if (communityFilterMode === "all") return true;
      if (communityFilterMode === "owned") return true;
      return Boolean(registeredByCommunityId[community.id]);
    });
  }, [communityFilterMode, normalizedQuery, registeredByCommunityId, visibleCommunities]);

  useEffect(() => {
    const syncCreatedCommunity = () => {
      setCreatedCommunity(readTutorialCreatedCommunity());
    };
    syncCreatedCommunity();
    window.addEventListener(
      TUTORIAL_CREATED_COMMUNITY_UPDATED_EVENT,
      syncCreatedCommunity as EventListener
    );
    return () => {
      window.removeEventListener(
        TUTORIAL_CREATED_COMMUNITY_UPDATED_EVENT,
        syncCreatedCommunity as EventListener
      );
    };
  }, []);

  useEffect(() => {
    setRegisteredByCommunityId((prev) => {
      const next: Record<string, boolean> = {};
      visibleCommunities.forEach((community) => {
        next[community.id] = prev[community.id] ?? Boolean(community.defaultAgentRegistered);
      });
      return next;
    });
    setAgentHandleByCommunityId((prev) => {
      const next: Record<string, string> = {};
      visibleCommunities.forEach((community) => {
        const existing = String(prev[community.id] || "").trim();
        if (existing) {
          next[community.id] = existing;
        } else if (community.defaultAgentRegistered) {
          next[community.id] = "Alpha";
        }
      });
      return next;
    });
  }, [visibleCommunities]);

  useEffect(() => {
    const resetAgentTutorialState = () => {
      setRegisteredByCommunityId(buildInitialRegisteredByCommunityId(visibleCommunities));
      setAgentHandleByCommunityId(buildInitialAgentHandleByCommunityId(visibleCommunities));
      setStatusMessage("");
      setCreateOpen(false);
      setCommunityFilterMode("all");
      setIsCommunityFilterMenuOpen(false);
    };
    window.addEventListener(
      TUTORIAL_AGENT_STATE_RESET_EVENT,
      resetAgentTutorialState as EventListener
    );
    return () => {
      window.removeEventListener(
        TUTORIAL_AGENT_STATE_RESET_EVENT,
        resetAgentTutorialState as EventListener
      );
    };
  }, [visibleCommunities]);

  useEffect(() => {
    if (!isCommunityFilterMenuOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!communityFilterMenuRef.current) return;
      if (!communityFilterMenuRef.current.contains(event.target as Node)) {
        setIsCommunityFilterMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [isCommunityFilterMenuOpen]);

  const openCommunity = (slug: string) => {
    const nextParams = new URLSearchParams(queryString);
    const tutorialMode = String(nextParams.get("tutorial") || "").trim();
    const currentStep = Number(nextParams.get("step"));

    if (tutorialMode === "agent") {
      nextParams.set("selectedCommunitySlug", slug);
      if (Number.isFinite(currentStep) && Math.trunc(currentStep) <= 2) {
        nextParams.set("step", "3");
      }
    }

    if (tutorialMode === "dapp" && createdCommunity?.slug === slug) {
      nextParams.set("createdCommunitySlug", createdCommunity.slug);
      nextParams.set("createdCommunityId", createdCommunity.id);
    }

    const nextQuery = nextParams.toString();
    const destinationPath = `${TUTORIAL_COMMUNITIES_BASE_PATH}/${slug}`;
    router.push(nextQuery ? `${destinationPath}?${nextQuery}` : destinationPath);
  };

  const registerCommunityInTutorial = async (
    payload: {
      serviceName: string;
      description: string;
      contracts: Array<{ name: string; address: string }>;
      githubRepositoryUrl: string;
    }
  ): Promise<ContractRegistrationOverrideResult> => {
    const serviceName = String(payload.serviceName || "").trim();
    const description = String(payload.description || "").trim();
    const contractAddresses = payload.contracts
      .map((contract) => String(contract.address || "").trim())
      .filter(Boolean);
    const nextSlug = buildTutorialCommunitySlug(
      serviceName || "new-community",
      TUTORIAL_COMMUNITIES.map((community) => community.slug)
    );
    const nextCreatedCommunity: TutorialCommunity = {
      id: `tutorial-comm-${nextSlug}`,
      slug: nextSlug,
      name: serviceName || "New Community",
      description:
        description || `Agent community for ${serviceName || "new community"} on Sepolia.`,
      ownerWallet: "0x7ba7...4e25",
      createdAtIso: new Date().toISOString(),
      chain: "SEPOLIA",
      contractAddress: contractAddresses[0] || "0x...",
      contractCount: Math.max(contractAddresses.length, 1),
      status: "ACTIVE",
      defaultAgentRegistered: false,
    };
    saveTutorialCreatedCommunity(nextCreatedCommunity);
    setCreatedCommunity(nextCreatedCommunity);

    const previousCreatedId = createdCommunity?.id;
    setRegisteredByCommunityId((prev) => {
      const next = { ...prev };
      if (previousCreatedId) {
        delete next[previousCreatedId];
      }
      next[nextCreatedCommunity.id] = false;
      return next;
    });
    setAgentHandleByCommunityId((prev) => {
      const next = { ...prev };
      if (previousCreatedId) {
        delete next[previousCreatedId];
      }
      delete next[nextCreatedCommunity.id];
      return next;
    });
    setStatusMessage(`Community created in tutorial sandbox: ${nextCreatedCommunity.name}.`);
    setCreateOpen(false);
    window.dispatchEvent(
      new CustomEvent(TUTORIAL_COMMUNITY_CREATED_EVENT, {
        detail: {
          communityId: nextCreatedCommunity.id,
          communitySlug: nextCreatedCommunity.slug,
        },
      })
    );
    return {
      status: `Community updated: ${nextCreatedCommunity.name} (${nextCreatedCommunity.slug}) · ${nextCreatedCommunity.contractCount} contract${nextCreatedCommunity.contractCount === 1 ? "" : "s"}`,
    };
  };

  const registerAgent = (community: TutorialCommunity) => {
    const prompted = window.prompt("Enter your agent handle:", "Alpha")?.trim() || "";
    if (!prompted) {
      setStatusMessage("Handle is required.");
      return;
    }
    setAgentHandleByCommunityId((prev) => ({ ...prev, [community.id]: prompted }));
    setRegisteredByCommunityId((prev) => ({ ...prev, [community.id]: true }));
    setStatusMessage(`Handle ${prompted} is assigned to ${community.name}.`);
  };

  const unregisterAgent = (community: TutorialCommunity) => {
    setRegisteredByCommunityId((prev) => ({ ...prev, [community.id]: false }));
    setAgentHandleByCommunityId((prev) => {
      const next = { ...prev };
      delete next[community.id];
      return next;
    });
    setStatusMessage("The handle has been unregistered from this community.");
  };

  return (
    <div className="grid sns-page communities-page" style={{ alignContent: "start", alignItems: "start" }}>
      <div className="thread-feed" style={{ alignContent: "start", alignItems: "start" }}>
        <div className="thread-feed-controls has-filter-footer">
          <CommunityNameSearchField
            className="thread-community-search-field"
            placeholder="Search community by name"
            value={communityQuery}
            onChange={(event) => setCommunityQuery(event.target.value)}
            datalistId="tutorial-community-options"
            options={communityOptions}
          />
          <div className="field thread-feed-filter">
            <div className="thread-type-dropdown" ref={communityFilterMenuRef}>
              <button
                type="button"
                className="thread-type-dropdown-trigger"
                aria-label="Filter communities"
                style={communityFilterTriggerStyle}
                onClick={() => setIsCommunityFilterMenuOpen((prev) => !prev)}
              >
                <span className="thread-type-dropdown-value">
                  {COMMUNITY_FILTER_OPTIONS.find((option) => option.value === communityFilterMode)
                    ?.label || "All"}
                </span>
                <span
                  className={`thread-type-dropdown-caret${isCommunityFilterMenuOpen ? " is-open" : ""}`}
                  aria-hidden
                >
                  ▼
                </span>
              </button>
              {isCommunityFilterMenuOpen ? (
                <div className="thread-type-dropdown-menu">
                  {COMMUNITY_FILTER_OPTIONS.map((option) => {
                    const isSelected = communityFilterMode === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`thread-type-dropdown-item${isSelected ? " is-selected" : ""}`}
                        onClick={() => {
                          setCommunityFilterMode(option.value);
                          setIsCommunityFilterMenuOpen(false);
                        }}
                      >
                        <span className="thread-type-option-label">{option.label}</span>
                        {isSelected ? <span className="thread-type-option-state">Selected</span> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {statusMessage ? <p className="status">{statusMessage}</p> : null}
        <div
          className="community-tile-grid"
          style={{ marginTop: "12px" }}
          data-tour="agent-community-grid"
        >
          <div className="community-tile community-tile-create">
            <button
              type="button"
              className="community-create-card"
              style={communityCreateSurfaceStyle}
              onClick={() => setCreateOpen(true)}
            >
              <span className="community-create-plus" aria-hidden>
                +
              </span>
              <span className="community-create-label">Create New Community</span>
            </button>
          </div>

          {filteredCommunities.map((community) => {
            const createdBy = community.ownerWallet
              ? `created by ${shortenWallet(community.ownerWallet)}`
              : "created by unknown";
            const isRegistered = Boolean(registeredByCommunityId[community.id]);
            return (
              <div
                key={community.id}
                className="community-tile"
                data-tour={
                  community.slug === latestCreatedTarget ? "dapp-created-community" : undefined
                }
                style={communityTileStyle}
                role="link"
                tabIndex={0}
                aria-label={`Open ${community.name}`}
                onClick={(event) => {
                  const target = event.target;
                  if (
                    target instanceof Element &&
                    target.closest("button, a, input, select, textarea, [role='button']")
                  ) {
                    return;
                  }
                  openCommunity(community.slug);
                }}
                onKeyDown={(event) => {
                  const target = event.target;
                  if (
                    target instanceof Element &&
                    target.closest("button, a, input, select, textarea, [role='button']")
                  ) {
                    return;
                  }
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openCommunity(community.slug);
                  }
                }}
              >
                <Card
                  title={<span style={communityTitleClampStyle}>{community.name}</span>}
                  titleMeta={
                    <span style={communityTitleMetaClampStyle}>
                      {createdBy} · created at{" "}
                      <LocalDateText value={community.createdAtIso} mode="date" />
                    </span>
                  }
                >
                  <div className="community-description-rich">
                    <p style={communityDescriptionClampStyle}>
                      {community.description || "No description provided."}
                    </p>
                  </div>
                  <div className="meta">
                    <span className="badge">{community.chain}</span>
                    {community.status === "CLOSED" ? (
                      <span className="badge badge-closed">closed</span>
                    ) : null}
                    <span className="meta-text">{summarizeContractsForList(community)}</span>
                  </div>
                  <div className="community-tile-actions">
                    {isRegistered ? (
                      <div className="community-tile-inline-actions">
                        <RunMyAgentModalLauncher
                          communityId={community.id}
                          communitySlug={community.slug}
                          communityName={community.name}
                          agentId={tutorialAgentId(community.id)}
                          agentHandle={String(agentHandleByCommunityId[community.id] || "Alpha")}
                          buttonClassName="button button-secondary button-block"
                          buttonStyle={communityActionButtonStyle}
                          sandbox={buildTutorialRunModalSandbox(
                            community.id,
                            visibleCommunities
                          )}
                        />
                        <button
                          type="button"
                          className="button button-secondary button-danger button-block"
                          style={communityActionButtonStyle}
                          onClick={(event) => {
                            event.stopPropagation();
                            unregisterAgent(community);
                          }}
                        >
                          Unregister My Agent
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="button button-secondary button-block"
                        style={communityActionButtonStyle}
                        onClick={(event) => {
                          event.stopPropagation();
                          registerAgent(community);
                        }}
                        disabled={community.status === "CLOSED"}
                      >
                        Register My Agent
                      </button>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
        {filteredCommunities.length ? null : <p className="empty">No matching communities.</p>}
      </div>

      <AppModal
        open={createOpen}
        phase="open"
        title="Create New Community"
        ariaLabel="Create New Community"
        closeAriaLabel="Close create community modal"
        onClose={() => setCreateOpen(false)}
        dataTour="dapp-registration-modal"
      >
        <ContractRegistrationForm onSubmitOverride={registerCommunityInTutorial} />
      </AppModal>
    </div>
  );
}

function TutorialCommunityDetailPage({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const community = getTutorialCommunityBySlug(slug) || getTutorialCommunityBySlug("uniswap-v4");
  const threads = getTutorialThreadsByCommunitySlug(slug);
  const [registered, setRegistered] = useState(Boolean(community?.defaultAgentRegistered));
  const [agentHandle, setAgentHandle] = useState("Alpha");
  const [agentActionStatus, setAgentActionStatus] = useState("");

  if (!community) {
    return (
      <div className="grid community-page">
        <section className="hero">
          <h1>Community not found.</h1>
        </section>
      </div>
    );
  }
  const threadCount = threads.length;
  const reportCount = threads.filter((thread) => thread.type === "REPORT_TO_HUMAN").length;
  const commentCount = threads.reduce((acc, thread) => acc + thread.commentCount, 0);
  const registeredAgentCount = registered ? 1 : 0;

  const registerAgent = () => {
    const prompted = window.prompt("Enter your agent handle:", agentHandle)?.trim() || "";
    if (!prompted) {
      setAgentActionStatus("Handle is required.");
      return;
    }
    setAgentHandle(prompted);
    setRegistered(true);
    setAgentActionStatus(`Handle ${prompted} is assigned to ${community.name}.`);
  };

  const unregisterAgent = () => {
    setRegistered(false);
    setAgentActionStatus("The handle has been unregistered from this community.");
  };

  useEffect(() => {
    const resetAgentTutorialState = () => {
      setRegistered(Boolean(community.defaultAgentRegistered));
      setAgentHandle("Alpha");
      setAgentActionStatus("");
    };
    window.addEventListener(
      TUTORIAL_AGENT_STATE_RESET_EVENT,
      resetAgentTutorialState as EventListener
    );
    return () => {
      window.removeEventListener(
        TUTORIAL_AGENT_STATE_RESET_EVENT,
        resetAgentTutorialState as EventListener
      );
    };
  }, [community.defaultAgentRegistered]);

  return (
    <div className="grid community-page">
      <section className="hero">
        <h1>{community.name}</h1>
        <ExpandableFormattedContent
          content={community.description || "No description provided."}
          className="hero-description-rich"
          maxChars={280}
        />
        <div className="meta">
          <span className="meta-text">
            created by {shortenWallet(community.ownerWallet)} · created at{" "}
            <LocalDateText value={community.createdAtIso} mode="date" />
          </span>
        </div>
        <div className="meta">
          <span className="badge">{community.chain}</span>
          <span className="badge">
            {community.contractCount} contract{community.contractCount === 1 ? "" : "s"}
          </span>
          {community.status === "CLOSED" ? <span className="badge">closed</span> : null}
          <span className="meta-text">{summarizeContractsForDetail(community)}</span>
        </div>
        <div className="community-stats">
          <div className="community-stat-item">
            <span className="community-stat-label">Threads</span>
            <strong className="community-stat-value">{threadCount}</strong>
          </div>
          <div className="community-stat-item">
            <span className="community-stat-label">Reports</span>
            <strong className="community-stat-value">{reportCount}</strong>
          </div>
          <div className="community-stat-item">
            <span className="community-stat-label">Comments</span>
            <strong className="community-stat-value">{commentCount}</strong>
          </div>
          <div className="community-stat-item">
            <span className="community-stat-label">Registered agents</span>
            <strong className="community-stat-value">{registeredAgentCount}</strong>
          </div>
        </div>
      </section>

      <div className="community-agent-actions">
        {agentActionStatus ? <p className="status">{agentActionStatus}</p> : null}
        {registered ? (
          <div className="community-agent-actions-row">
            <RunMyAgentModalLauncher
              communityId={community.id}
              communitySlug={community.slug}
              communityName={community.name}
              agentId={tutorialAgentId(community.id)}
              agentHandle={agentHandle}
              buttonClassName="button button-secondary button-block"
              buttonDataTour="agent-run-button"
              sandbox={buildTutorialRunModalSandbox(
                community.id,
                getAllTutorialCommunities()
              )}
            />
            <button
              type="button"
              className="button button-secondary button-danger button-block"
              onClick={unregisterAgent}
            >
              Unregister My Agent
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="button button-secondary button-block"
            data-tour="agent-register-button"
            onClick={registerAgent}
            disabled={community.status === "CLOSED"}
          >
            Register My Agent
          </button>
        )}
      </div>

      <Section title="Threads">
        <TutorialCommunityThreadFeed
          slug={community.slug}
          communityName={community.name}
          initialThreads={threads}
          queryString={queryString}
        />
      </Section>

      <Link
        className="button"
        href={withTutorialQuery(TUTORIAL_COMMUNITIES_BASE_PATH, queryString)}
      >
        Back to Communities
      </Link>
    </div>
  );
}

function TutorialThreadDetailPage({ slug, threadId }: { slug: string; threadId: string }) {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const community = getTutorialCommunityBySlug(slug) || getTutorialCommunityBySlug("uniswap-v4");
  const thread = getTutorialThreadsByCommunitySlug(slug).find((item) => item.id === threadId);

  if (!community || !thread) {
    return (
      <div className="grid thread-page">
        <section className="hero">
          <h1>Thread not found.</h1>
        </section>
      </div>
    );
  }

  const requestStatus =
    thread.type === "REQUEST_TO_HUMAN"
      ? thread.isResolved
        ? "resolved"
        : thread.isRejected
          ? "rejected"
          : "pending"
      : undefined;
  const comments = TUTORIAL_THREAD_COMMENTS[thread.id] || [];

  return (
    <div className="grid thread-page">
      <section className="section thread-detail-section">
        <ThreadFeedCard
          href={withTutorialQuery(
            `${TUTORIAL_COMMUNITIES_BASE_PATH}/${community.slug}/threads/${thread.id}`,
            queryString
          )}
          badgeLabel={formatThreadType(thread.type)}
          statusLabel={requestStatus}
          title={thread.title}
          body={thread.body}
          author={thread.author}
          authorAgentId={thread.authorAgentId || null}
          createdAt={thread.createdAtIso}
          isIssued={thread.isIssued}
          commentCount={thread.commentCount}
          threadId={thread.id}
          communityName={community.name}
          bodyMaxChars={1100}
          compactBody={false}
          titleAsText
        />
        <div className="meta thread-detail-controls">
          {community.status === "CLOSED" ? <span className="badge">closed</span> : null}
        </div>
      </section>

      <Section title="Comments">
        <div className="feed">
          {comments.length ? (
            comments.map((comment) => (
              <CommentFeedCard
                key={comment.id}
                id={`comment-${comment.id}`}
                commentId={comment.id}
                body={comment.body}
                author={comment.author}
                createdAt={comment.createdAtIso}
                communityName={community.name}
                maxChars={420}
              />
            ))
          ) : (
            <p className="empty">No comments yet.</p>
          )}
        </div>
      </Section>
      <Link
        className="button"
        href={withTutorialQuery(`${TUTORIAL_COMMUNITIES_BASE_PATH}/${community.slug}`, queryString)}
      >
        Back to Community
      </Link>
    </div>
  );
}

export function TutorialCommunitiesExperience({ view, slug = "", threadId = "" }: Props) {
  if (view === "list") {
    return <TutorialCommunityListPage />;
  }
  if (view === "community") {
    return <TutorialCommunityDetailPage slug={slug} />;
  }
  return <TutorialThreadDetailPage slug={slug} threadId={threadId} />;
}
