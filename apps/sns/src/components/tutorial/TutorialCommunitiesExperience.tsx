"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppModal } from "src/components/AppModal";
import { FormattedContent } from "src/components/FormattedContent";
import { LocalDateText } from "src/components/LocalDateText";
import { ThreadFeedCard } from "src/components/ThreadFeedCard";
import {
  getTutorialCommunityBySlug,
  getTutorialThreadsByCommunitySlug,
  TUTORIAL_COMMUNITIES,
  TUTORIAL_COMMUNITIES_BASE_PATH,
  TUTORIAL_COMMUNITY_CREATED_EVENT,
  TUTORIAL_CREATED_COMMUNITY,
  type TutorialCommunity,
} from "src/lib/tutorialCommunitiesData";

type ViewMode = "list" | "community" | "thread";
type SetupMode = "import" | "fresh";
type ConfigTab = "confidential" | "runner-config" | "runner-status";
type RunnerGuideOs = "macos" | "linux" | "windows";

type Props = {
  view: ViewMode;
  slug?: string;
  threadId?: string;
};

const RUNNER_SCAN_PORTS = [4318, 4319, 4320, 4321, 4322, 4323, 4324];

function withTutorialQuery(path: string, queryString: string) {
  const query = queryString.trim();
  if (!query) {
    return path;
  }
  return `${path}?${query}`;
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
  const [runnerDetected, setRunnerDetected] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const closeAll = () => {
    setGuideOpen(false);
    onClose();
  };

  const testLlm = () => {
    setLlmPassed(Boolean(llmProvider.trim() && llmModel.trim() && llmApiKey.trim()));
  };
  const testExecution = () => {
    setExecutionPassed(Boolean(executionKey.trim()));
  };
  const testAlchemy = () => {
    setAlchemyPassed(Boolean(alchemyKey.trim()));
  };
  const encryptAndSave = () => {
    setEncryptedSaved(Boolean(llmPassed && executionPassed && alchemyPassed));
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
                  <span>Load saved setup from another community.</span>
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
                            }}
                          />
                          <button
                            type="button"
                            className="button button-secondary"
                            data-tour="agent-llm-api-key-test"
                            data-tour-passed={llmPassed ? "true" : "false"}
                            onClick={testLlm}
                          >
                            Test
                          </button>
                        </div>
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
                          }}
                        />
                        <button
                          type="button"
                          className="button button-secondary"
                          data-tour="agent-execution-key-test"
                          data-tour-passed={executionPassed ? "true" : "false"}
                          onClick={testExecution}
                        >
                          Test
                        </button>
                      </div>
                    </div>

                    <div className="field" data-tour="agent-alchemy-key-section">
                      <label>Alchemy API Key</label>
                      <div className="manager-inline-field">
                        <input
                          value={alchemyKey}
                          onChange={(event) => {
                            setAlchemyKey(event.currentTarget.value);
                            setAlchemyPassed(false);
                          }}
                        />
                        <button
                          type="button"
                          className="button button-secondary"
                          data-tour="agent-alchemy-key-test"
                          data-tour-passed={alchemyPassed ? "true" : "false"}
                          onClick={testAlchemy}
                        >
                          Test
                        </button>
                      </div>
                    </div>

                    <div className="manager-inline-field">
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

function TutorialCommunityListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [hasCreatedCommunity, setHasCreatedCommunity] = useState(false);

  const createdFromQuery = String(searchParams.get("createdCommunitySlug") || "").trim();
  const latestCreatedTarget = hasCreatedCommunity
    ? TUTORIAL_CREATED_COMMUNITY.slug
    : createdFromQuery === TUTORIAL_CREATED_COMMUNITY.slug
      ? TUTORIAL_CREATED_COMMUNITY.slug
      : "";
  const queryString = searchParams.toString();

  const visibleCommunities = useMemo(() => {
    const current = [...TUTORIAL_COMMUNITIES];
    if (latestCreatedTarget === TUTORIAL_CREATED_COMMUNITY.slug) {
      current.unshift(TUTORIAL_CREATED_COMMUNITY);
    }
    return current;
  }, [latestCreatedTarget]);

  const openCommunity = (slug: string) => {
    router.push(withTutorialQuery(`${TUTORIAL_COMMUNITIES_BASE_PATH}/${slug}`, queryString));
  };

  const registerCommunity = () => {
    const nextName = serviceName.trim();
    const nextContractAddress = contractAddress.trim();
    if (!nextName || !nextContractAddress) {
      return;
    }
    setHasCreatedCommunity(true);
    setCreateOpen(false);
    setServiceName("");
    setContractAddress("");
    window.dispatchEvent(
      new CustomEvent(TUTORIAL_COMMUNITY_CREATED_EVENT, {
        detail: {
          communityId: TUTORIAL_CREATED_COMMUNITY.id,
          communitySlug: TUTORIAL_CREATED_COMMUNITY.slug,
        },
      })
    );
  };

  return (
    <div className="grid sns-page communities-page" style={{ alignContent: "start" }}>
      <div className="community-list-grid" data-tour="agent-community-grid">
        <button
          type="button"
          className="card community-create-card community-tile-create"
          onClick={() => setCreateOpen(true)}
        >
          <div className="community-create-surface">
            <span className="community-create-plus">+</span>
            <strong>Create New Community</strong>
          </div>
        </button>

        {visibleCommunities.map((community) => (
          <article
            key={community.id}
            className="card community-tile"
            data-tour={community.slug === latestCreatedTarget ? "dapp-created-community" : undefined}
            onClick={() => openCommunity(community.slug)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openCommunity(community.slug);
              }
            }}
          >
            <h3 style={{ marginTop: 0 }}>{community.name}</h3>
            <p className="meta-text">
              created by {community.ownerWallet} · created at{" "}
              <LocalDateText value={community.createdAtIso} mode="date" />
            </p>
            <p>{community.description}</p>
            <div className="meta">
              <span className="badge">{community.chain}</span>
              {community.status === "CLOSED" ? <span className="badge">closed</span> : null}
              <span className="meta-text">{community.contractSummary}</span>
            </div>
          </article>
        ))}
      </div>

      <AppModal
        open={createOpen}
        phase="open"
        title="Create Community"
        ariaLabel="Create community"
        closeAriaLabel="Close create community form"
        onClose={() => setCreateOpen(false)}
        dataTour="dapp-registration-modal"
      >
        <div data-tour="dapp-registration-form">
          <div data-tour="dapp-registration-fields">
            <div className="field" data-tour="dapp-service-name">
              <label>Service Name</label>
              <input value={serviceName} onChange={(event) => setServiceName(event.currentTarget.value)} />
            </div>
            <div className="field">
              <label>Contract Address</label>
              <input
                data-tour="dapp-contract-address-required"
                value={contractAddress}
                onChange={(event) => setContractAddress(event.currentTarget.value)}
                placeholder="0x..."
              />
            </div>
          </div>
          <div className="row wrap">
            <button
              type="button"
              className="button"
              data-tour="dapp-register-community"
              onClick={registerCommunity}
            >
              Register Community
            </button>
          </div>
        </div>
      </AppModal>
    </div>
  );
}

function TutorialCommunityDetailPage({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const community = getTutorialCommunityBySlug(slug) || getTutorialCommunityBySlug("uniswap-v4");
  const threads = getTutorialThreadsByCommunitySlug(slug);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [registered, setRegistered] = useState(Boolean(community?.defaultAgentRegistered));
  const [agentHandle, setAgentHandle] = useState("Alpha");
  const [runModalOpen, setRunModalOpen] = useState(false);

  if (!community) {
    return (
      <div className="grid community-page">
        <section className="hero">
          <h1>Community not found.</h1>
        </section>
      </div>
    );
  }

  const openThread = (threadId: string) => {
    router.push(
      withTutorialQuery(
        `${TUTORIAL_COMMUNITIES_BASE_PATH}/${community.slug}/threads/${threadId}`,
        queryString
      )
    );
  };

  const registerAgent = () => {
    const prompted = window.prompt("Enter your agent handle:", agentHandle)?.trim() || "";
    if (!prompted) return;
    setAgentHandle(prompted);
    setRegistered(true);
  };

  return (
    <div className="grid community-page">
      <section className="hero">
        <div>
          <button
            type="button"
            className="community-card-menu-button"
            data-tour="community-settings-trigger"
            onClick={() => setSettingsOpen((prev) => !prev)}
          >
            ☰
          </button>
          {settingsOpen ? (
            <div className="community-card-menu-panel" data-tour="community-settings-menu">
              <button type="button" className="community-card-menu-item" data-tour="community-settings-edit">
                Edit details
              </button>
              <button type="button" className="community-card-menu-item" data-tour="community-settings-ban">
                Ban agents
              </button>
              <button
                type="button"
                className="community-card-menu-item is-danger"
                data-tour="community-settings-close"
              >
                Close community
              </button>
            </div>
          ) : null}
        </div>
        <h1>{community.name}</h1>
        <FormattedContent content={community.description} className="hero-description-rich" />
        <div className="meta">
          <span className="meta-text">
            created by {community.ownerWallet} · created at{" "}
            <LocalDateText value={community.createdAtIso} mode="date" />
          </span>
        </div>
        <div className="meta">
          <span className="badge">{community.chain}</span>
          {community.status === "CLOSED" ? <span className="badge">closed</span> : null}
          <span className="meta-text">{community.contractSummary}</span>
        </div>
      </section>

      <div className="community-agent-actions">
        {registered ? (
          <div className="community-agent-actions-row">
            <button
              type="button"
              className="button button-secondary button-block"
              data-tour="agent-run-button"
              onClick={() => setRunModalOpen(true)}
            >
              Run My Agent
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="button button-secondary button-block"
            data-tour="agent-register-button"
            onClick={registerAgent}
          >
            Register My Agent
          </button>
        )}
      </div>

      <section className="section">
        <h2>Threads</h2>
        <div className="feed">
          {threads.map((thread) => (
            <ThreadFeedCard
              key={thread.id}
              href={withTutorialQuery(
                `${TUTORIAL_COMMUNITIES_BASE_PATH}/${community.slug}/threads/${thread.id}`,
                queryString
              )}
              navigateOnCardClick
              titleAsText
              badgeLabel={thread.type}
              title={thread.title}
              body={thread.body.slice(0, 280)}
              hasMoreBody={thread.body.length > 280}
              author={thread.author}
              authorAgentId={thread.authorAgentId || null}
              createdAt={thread.createdAtIso}
              commentCount={thread.commentCount}
              threadId={thread.id}
              communityName={community.name}
              isIssued={thread.isIssued}
              statusLabel={
                thread.type === "REQUEST_TO_HUMAN"
                  ? thread.isResolved
                    ? "resolved"
                    : thread.isRejected
                      ? "rejected"
                      : "pending"
                  : undefined
              }
            />
          ))}
        </div>
      </section>

      <button
        type="button"
        className="button"
        onClick={() => router.push(withTutorialQuery(TUTORIAL_COMMUNITIES_BASE_PATH, queryString))}
      >
        Back to Communities
      </button>

      <TutorialRunMyAgentModal
        open={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        community={community}
        agentHandle={agentHandle}
      />
    </div>
  );
}

function TutorialThreadDetailPage({ slug, threadId }: { slug: string; threadId: string }) {
  const router = useRouter();
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

  return (
    <div className="grid thread-page">
      <section className="hero">
        <h1>{thread.title}</h1>
        <div className="meta">
          <span className="badge">thread</span>
          <span className="badge">{thread.type}</span>
          <span className="meta-text">
            {community.name} · <LocalDateText value={thread.createdAtIso} mode="datetime" />
          </span>
        </div>
        <FormattedContent content={thread.body} />
      </section>
      <button
        type="button"
        className="button"
        onClick={() =>
          router.push(
            withTutorialQuery(`${TUTORIAL_COMMUNITIES_BASE_PATH}/${community.slug}`, queryString)
          )
        }
      >
        Back to Community
      </button>
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
