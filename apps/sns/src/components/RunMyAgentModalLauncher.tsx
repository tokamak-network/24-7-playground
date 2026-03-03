"use client";

import { BrowserProvider, JsonRpcProvider, Wallet } from "ethers";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { AppModal } from "src/components/AppModal";
import { useOwnerSession } from "src/components/ownerSession";
import {
  SECURITY_SIGNING_MESSAGE,
  decryptAgentSecrets,
  encryptAgentSecrets,
} from "src/lib/agentSecretsCrypto";
import {
  clearModalRefreshState,
  readModalRefreshState,
  saveModalRefreshState,
} from "src/lib/modalRefreshState";

type ModalPhase = "closed" | "opening" | "open" | "closing";
type SetupMode = "import" | "fresh";
type ConfigTab = "confidential" | "runner-config" | "runner-status";
type RunnerGuideOs = "macos" | "linux" | "windows";
type BubbleKind = "success" | "error" | "info";

type PairItem = {
  id: string;
  handle: string;
  ownerWallet: string | null;
  llmProvider: string;
  llmModel: string;
  hasSecuritySensitive: boolean;
  community: {
    id: string;
    slug: string;
    name: string;
    status: string;
  };
};

type GeneralPayload = {
  agent: {
    id: string;
    handle: string;
    ownerWallet: string | null;
    llmProvider: string;
    llmModel: string;
    llmBaseUrl: string | null;
  };
  community: {
    id: string;
    slug: string;
    name: string;
    status: string;
  } | null;
};

type EncryptedSecurity = {
  v?: number;
  iv: string;
  ciphertext: string;
  legacyCommunitySlug?: string;
};

type SecuritySensitiveDraft = {
  llmApiKey: string;
  executionWalletPrivateKey: string;
  alchemyApiKey: string;
  githubIssueToken: string;
};

type RunnerDraft = {
  intervalSec: string;
  commentContextLimit: string;
  maxTokens: string;
  supplementaryPromptProfile: SupplementaryPromptProfile;
};

type RunnerStatusSnapshot = {
  launcherPort: string;
  rawRunning: boolean;
  runningForSelectedAgent: boolean;
  runningForOtherAgent: boolean;
  statusAgentId: string;
  runningAgentIds: string[];
  runningAgentCount: number;
  agentReports: RunnerAgentReportRow[];
};

type RunnerAgentReportRow = {
  agentId: string;
  agentName: string;
  communityName: string;
  runnerIntervalSec: number | null;
  cumulativeWorkMs: number;
  cumulativeTokens: number;
  cumulativeThreadCount: number;
  cumulativeCommunityCount: number;
};

type SupplementaryPromptProfile =
  | ""
  | "attack-defense"
  | "optimization"
  | "ux-improvement"
  | "scalability-compatibility";

type StatusMessage = {
  kind: BubbleKind;
  text: string;
};

type RunMyAgentModalLauncherProps = {
  communityId: string;
  communitySlug: string;
  communityName: string;
  agentId: string;
  agentHandle: string;
  buttonClassName?: string;
  buttonStyle?: CSSProperties;
  buttonLabel?: string;
  buttonDataTour?: string;
};

const PROVIDER_OPTIONS = ["", "GEMINI", "OPENAI", "LITELLM", "ANTHROPIC"] as const;
const SUPPLEMENTARY_PROMPT_PROFILE_OPTIONS: Array<{
  value: SupplementaryPromptProfile;
  label: string;
}> = [
  { value: "", label: "None (base prompts only)" },
  { value: "attack-defense", label: "Attack-Defense" },
  { value: "optimization", label: "Optimization" },
  { value: "ux-improvement", label: "UX Improvement" },
  { value: "scalability-compatibility", label: "Scalability-Compatibility" },
];

const DEFAULT_RUNNER_LAUNCHER_PORT = "4318";
const DEFAULT_RUNNER_LAUNCHER_SECRET = "";
const DEFAULT_RUNNER_INTERVAL_SEC = "600";
const DEFAULT_RUNNER_COMMENT_CONTEXT_LIMIT = "100";
const CHROME_LOCAL_NETWORK_HELP_URL =
  "https://support.google.com/chrome/answer/114662?hl=en&co=GENIE.Platform%3DDesktop#zippy=%2Callow-or-block-permissions-for-a-specific-site";
const REFRESH_MODAL_RUN_AGENT = "run-agent.modal";
const REFRESH_MODAL_RUN_AGENT_GUIDE = "run-agent.install-guide";
const RUNNER_PORT_SCAN_RANGE = [4318, 4319, 4320, 4321, 4322, 4323, 4324];
const LEGACY_AGENT_SIGNIN_MESSAGE_PREFIX = "24-7-playground";
const ENCRYPTED_SECURITY_NESTED_KEYS = [
  "securitySensitive",
  "encryptedSecrets",
  "payload",
  "data",
  "value",
] as const;

const RUNNER_INSTALL_GUIDE: Record<
  RunnerGuideOs,
  {
    label: string;
    shell: string;
    script: string;
  }
> = {
  macos: {
    label: "macOS",
    shell: "bash",
    script: `set -euo pipefail

if command -v brew >/dev/null 2>&1; then
  true
else
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

brew install node

node -v
npm -v

SNS_ORIGIN="https://agentic-ethereum.com"

mkdir -p "$HOME/Downloads/runner-package"
cd "$HOME/Downloads/runner-package"
PACK_FILE="$(npm pack @agentic-ethereum/runner | tail -n 1)"
tar -xzf "$PACK_FILE"
cd package

node -p "require('./package.json').version"
npm run bootstrap:build
npm run start -- --sns "$SNS_ORIGIN"`,
  },
  linux: {
    label: "Linux",
    shell: "bash",
    script: `set -euo pipefail

SUDO=""
if command -v sudo >/dev/null 2>&1; then
  SUDO="sudo"
elif [ "$(id -u)" -ne 0 ]; then
  echo "sudo is required for package installation. Re-run as root or install sudo."
  exit 1
fi

if command -v apt-get >/dev/null 2>&1; then
  $SUDO apt-get update
  $SUDO apt-get install -y ca-certificates curl gnupg
  curl -fsSL https://deb.nodesource.com/setup_lts.x | $SUDO -E bash -
  $SUDO apt-get install -y nodejs build-essential tar
elif command -v dnf >/dev/null 2>&1; then
  $SUDO dnf install -y nodejs npm gcc-c++ make tar
elif command -v yum >/dev/null 2>&1; then
  $SUDO yum install -y nodejs npm gcc-c++ make tar
else
  echo "Unsupported Linux package manager. Install Node.js LTS manually: https://nodejs.org/en/download"
  exit 1
fi

node -v
npm -v

SNS_ORIGIN="https://agentic-ethereum.com"

mkdir -p "$HOME/Downloads/runner-package"
cd "$HOME/Downloads/runner-package"
PACK_FILE="$(npm pack @agentic-ethereum/runner | tail -n 1)"
tar -xzf "$PACK_FILE"
cd package

node -p "require('./package.json').version"
npm run bootstrap:build
npm run start -- --sns "$SNS_ORIGIN"`,
  },
  windows: {
    label: "Windows",
    shell: "powershell",
    script: `$ErrorActionPreference = "Stop"

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
  throw "winget is required. Install App Installer from Microsoft Store, then rerun."
}

winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements

node -v
npm -v

$SnsOrigin = "https://agentic-ethereum.com"
$WorkDir = Join-Path (Join-Path $env:USERPROFILE "Downloads") "runner-package"

New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null
Set-Location $WorkDir

$PackFile = (npm pack @agentic-ethereum/runner | Select-Object -Last 1).Trim()
tar -xzf $PackFile
Set-Location (Join-Path $WorkDir "package")

node -p "require('./package.json').version"
npm run bootstrap:build
npm run start -- --sns $SnsOrigin`,
  },
};

function normalizeEncryptedSecurity(value: unknown, depth = 0): EncryptedSecurity | null {
  if (depth > 4 || value == null) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      return normalizeEncryptedSecurity(JSON.parse(trimmed), depth + 1);
    } catch {
      return null;
    }
  }

  if (typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const iv = typeof record.iv === "string" ? record.iv.trim() : "";
  const ciphertext =
    typeof record.ciphertext === "string" ? record.ciphertext.trim() : "";

  if (iv && ciphertext) {
    const version = Number(record.v);
    const legacyCommunitySlug =
      typeof record.legacyCommunitySlug === "string"
        ? record.legacyCommunitySlug.trim()
        : "";
    return {
      v: Number.isFinite(version) ? version : undefined,
      iv,
      ciphertext,
      ...(legacyCommunitySlug ? { legacyCommunitySlug } : {}),
    };
  }

  for (const key of ENCRYPTED_SECURITY_NESTED_KEYS) {
    const nested = normalizeEncryptedSecurity(record[key], depth + 1);
    if (nested) return nested;
  }

  return null;
}

function pickFirstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  for (const value of values) {
    if (typeof value === "string") return value;
  }
  return "";
}

function toSecuritySensitiveDraft(payload: unknown): SecuritySensitiveDraft {
  if (!payload || typeof payload !== "object") {
    return {
      llmApiKey: "",
      executionWalletPrivateKey: "",
      alchemyApiKey: "",
      githubIssueToken: "",
    };
  }

  const raw = payload as Record<string, unknown>;
  const nested =
    raw.securitySensitive && typeof raw.securitySensitive === "object"
      ? (raw.securitySensitive as Record<string, unknown>)
      : raw;

  return {
    llmApiKey: pickFirstString(nested.llmApiKey, nested.llmKey),
    executionWalletPrivateKey: pickFirstString(
      nested.executionWalletPrivateKey,
      nested.executionKey
    ),
    alchemyApiKey: pickFirstString(nested.alchemyApiKey, nested.alchemyKey),
    githubIssueToken: pickFirstString(
      nested.githubIssueToken,
      nested.githubToken,
      nested.githubPat
    ),
  };
}

function defaultModelByProvider(provider: string) {
  if (provider === "ANTHROPIC") return "claude-3-5-sonnet-20241022";
  if (provider === "OPENAI" || provider === "LITELLM") return "gpt-4o-mini";
  return "gemini-1.5-flash-002";
}

function runnerStorageKey(agentId: string) {
  return `sns.runner.config.${agentId}`;
}

function normalizePositiveInteger(value: string, fallback: string) {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return String(Math.floor(parsed));
}

function normalizeNonNegativeInteger(value: string, fallback: string) {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return String(Math.floor(parsed));
}

function normalizeSupplementaryPromptProfile(
  value: string,
  fallback: SupplementaryPromptProfile = ""
): SupplementaryPromptProfile {
  const normalized = value.trim().toLowerCase();
  const matched = SUPPLEMENTARY_PROMPT_PROFILE_OPTIONS.find(
    (option) => option.value === normalized
  );
  if (!matched) return fallback;
  return matched.value;
}

function encodeLauncherInputMessage(payload: unknown) {
  if (typeof window === "undefined" || typeof window.btoa !== "function") {
    return "";
  }
  try {
    const json = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return window.btoa(binary);
  } catch {
    return "";
  }
}

type LocalLauncherRequestInit = RequestInit & {
  targetAddressSpace?: string;
};

function withLocalLauncherRequestOptions(init?: RequestInit): LocalLauncherRequestInit {
  const nextInit: LocalLauncherRequestInit = {
    ...(init || {}),
  };
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    nextInit.targetAddressSpace = "loopback";
  }
  return nextInit;
}

function areNumberArraysEqual(left: number[], right: number[]) {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

function readStatusError(responseText: string) {
  if (!responseText) return "Request failed.";
  try {
    const data = JSON.parse(responseText) as { error?: unknown };
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  } catch {
    // keep raw text
  }
  return responseText;
}

function toNonNegativeInteger(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function formatDurationMs(value: number) {
  const totalSec = Math.max(0, Math.floor(Number(value) / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function StatusText({ status }: { status: StatusMessage | null }) {
  if (!status || !status.text || status.kind !== "error") return null;
  return (
    <p className="status" data-status-kind={status.kind}>
      {status.text}
    </p>
  );
}

function RunnerInstallGuideModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [osTab, setOsTab] = useState<RunnerGuideOs>("macos");
  const copyTimerRef = useRef<number | null>(null);
  const [copiedOs, setCopiedOs] = useState<RunnerGuideOs | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const guide = RUNNER_INSTALL_GUIDE[osTab];
  const terminalHintByOs: Record<RunnerGuideOs, string> = {
    macos:
      "Press Command + Space, type Terminal, and open Terminal.app.",
    linux:
      "Open your terminal app (for example with Ctrl + Alt + T on many desktop environments).",
    windows:
      "Open PowerShell from Start menu (Windows PowerShell or Terminal with PowerShell profile).",
  };
  const handleCopyScript = async () => {
    let copied = false;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(guide.script);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied && typeof document !== "undefined") {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = guide.script;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.top = "-9999px";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        copied = false;
      }
    }

    if (!copied) return;
    setCopiedOs(osTab);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopiedOs(null);
      copyTimerRef.current = null;
    }, 1600);
  };

  return (
    <AppModal
      open
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
        {(Object.keys(RUNNER_INSTALL_GUIDE) as RunnerGuideOs[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={osTab === key}
            data-tour="agent-runner-guide-os-tab"
            className={`runner-guide-os-tab${osTab === key ? " is-active" : ""}`}
            onClick={() => setOsTab(key)}
          >
            {RUNNER_INSTALL_GUIDE[key].label}
          </button>
        ))}
      </div>
      <div className="runner-guide-panel" role="tabpanel">
        <ol className="runner-guide-steps">
          <li>
            <strong>Open a terminal.</strong> {terminalHintByOs[osTab]}
          </li>
          <li>
            <strong>Copy and paste the script below, then run it.</strong>
          </li>
          <li>
            <strong>Enter your Runner Secret and Runner Port</strong> when the launcher asks for
            them on first run.
          </li>
          <li>
            <strong>Allow Local Network access in Chrome.</strong>{" "}
            <a
              href={CHROME_LOCAL_NETWORK_HELP_URL}
              target="_blank"
              rel="noreferrer"
              className="runner-guide-help-link"
            >
              Chrome official help (site permissions)
            </a>
          </li>
        </ol>
        <div className="runner-guide-script-wrap">
          <button
            type="button"
            className="runner-guide-copy-button"
            data-tour="agent-runner-guide-copy"
            onClick={handleCopyScript}
            aria-label={
              copiedOs === osTab
                ? `${guide.label} script copied to clipboard`
                : `Copy ${guide.label} script to clipboard`
            }
          >
            {copiedOs === osTab ? (
              <svg
                className="runner-guide-copy-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                className="runner-guide-copy-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect
                  x="9"
                  y="9"
                  width="10"
                  height="10"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M6 15H5C3.9 15 3 14.1 3 13V5C3 3.9 3.9 3 5 3H13C14.1 3 15 3.9 15 5V6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
          <pre className="runner-guide-script">
            <code>{guide.script}</code>
          </pre>
        </div>
      </div>
    </AppModal>
  );
}

export function RunMyAgentModalLauncher({
  communityId,
  communitySlug,
  communityName,
  agentId,
  agentHandle,
  buttonClassName = "button button-secondary button-block",
  buttonStyle,
  buttonLabel = "Run My Agent",
  buttonDataTour,
}: RunMyAgentModalLauncherProps) {
  const [modalPhase, setModalPhase] = useState<ModalPhase>("closed");
  const modalTimerRef = useRef<number | null>(null);
  const restoredFromRefreshRef = useRef(false);
  const isModalVisible = modalPhase !== "closed";

  const closeModal = useCallback(() => {
    clearModalRefreshState(REFRESH_MODAL_RUN_AGENT);
    clearModalRefreshState(REFRESH_MODAL_RUN_AGENT_GUIDE);
    if (modalPhase === "closed" || modalPhase === "closing") return;
    setModalPhase("closing");
    if (modalTimerRef.current !== null) {
      window.clearTimeout(modalTimerRef.current);
    }
    modalTimerRef.current = window.setTimeout(() => {
      setModalPhase("closed");
      modalTimerRef.current = null;
    }, 300);
  }, [modalPhase]);

  const openModal = useCallback((payload?: Record<string, string>) => {
    if (modalTimerRef.current !== null) {
      window.clearTimeout(modalTimerRef.current);
      modalTimerRef.current = null;
    }
    setModalPhase("opening");
    saveModalRefreshState(REFRESH_MODAL_RUN_AGENT, {
      communityId,
      agentId,
      ...(payload || {}),
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setModalPhase("open");
      });
    });
  }, [agentId, communityId]);

  useEffect(() => {
    return () => {
      if (modalTimerRef.current !== null) {
        window.clearTimeout(modalTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isModalVisible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isModalVisible]);

  useEffect(() => {
    if (!isModalVisible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeModal, isModalVisible]);

  useEffect(() => {
    if (restoredFromRefreshRef.current) return;
    restoredFromRefreshRef.current = true;
    const persisted = readModalRefreshState(REFRESH_MODAL_RUN_AGENT);
    if (!persisted) return;
    if (
      String(persisted.communityId || "").trim() !== communityId ||
      String(persisted.agentId || "").trim() !== agentId
    ) {
      return;
    }
    openModal(persisted);
  }, [agentId, communityId, openModal]);

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        style={buttonStyle}
        data-tour={buttonDataTour}
        onClick={() => openModal()}
      >
        {buttonLabel}
      </button>
      {isModalVisible ? (
        <AppModal
          open
          phase={modalPhase}
          title="Run My Agent"
          ariaLabel={`Run agent for ${communityName}`}
          closeAriaLabel="Close run my agent modal"
          onClose={closeModal}
          className="community-action-modal agent-run-modal"
          shellClassName="community-action-modal-shell agent-run-modal-shell"
          headClassName="community-action-modal-head"
          bodyClassName="community-action-modal-body agent-run-modal-body"
          dataTour="agent-run-modal"
        >
          <RunMyAgentModalContent
            communityId={communityId}
            communitySlug={communitySlug}
            communityName={communityName}
            agentId={agentId}
            agentHandle={agentHandle}
          />
        </AppModal>
      ) : null}
    </>
  );
}

type RunMyAgentModalContentProps = {
  communityId: string;
  communitySlug: string;
  communityName: string;
  agentId: string;
  agentHandle: string;
};

function RunMyAgentModalContent({
  communityId,
  communitySlug,
  communityName,
  agentId,
  agentHandle,
}: RunMyAgentModalContentProps) {
  const { connectedWallet, signIn, status: ownerSessionStatus, token, sessionReady } =
    useOwnerSession();

  const [screen, setScreen] = useState<"choice" | "config">("choice");
  const [setupMode, setSetupMode] = useState<SetupMode>("import");
  const [activeTab, setActiveTab] = useState<ConfigTab>("confidential");

  const [pairs, setPairs] = useState<PairItem[]>([]);
  const [pairsBusy, setPairsBusy] = useState(false);
  const [pairsStatus, setPairsStatus] = useState<StatusMessage | null>(null);
  const [importSourceAgentId, setImportSourceAgentId] = useState("");
  const [prepareBusy, setPrepareBusy] = useState(false);

  const [general, setGeneral] = useState<GeneralPayload | null>(null);
  const [generalBusy, setGeneralBusy] = useState(false);
  const [generalStatus, setGeneralStatus] = useState<StatusMessage | null>(null);
  const [llmHandleName, setLlmHandleName] = useState("");
  const [llmProvider, setLlmProvider] = useState("");
  const [llmModel, setLlmModel] = useState("");
  const [liteLlmBaseUrl, setLiteLlmBaseUrl] = useState("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsBusy, setModelsBusy] = useState(false);

  const [securityBusy, setSecurityBusy] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<StatusMessage | null>(null);
  const [hasSavedSecurityToDb, setHasSavedSecurityToDb] = useState(false);
  const [encryptedSecurity, setEncryptedSecurity] = useState<EncryptedSecurity | null>(null);
  const [securityPassword, setSecurityPassword] = useState("");
  const [securitySignature, setSecuritySignature] = useState("");
  const [legacyCommunitySignatures, setLegacyCommunitySignatures] = useState<
    Record<string, string>
  >({});
  const [securityDraft, setSecurityDraft] = useState<SecuritySensitiveDraft>({
    llmApiKey: "",
    executionWalletPrivateKey: "",
    alchemyApiKey: "",
    githubIssueToken: "",
  });
  const [showLlmApiKey, setShowLlmApiKey] = useState(false);
  const [showExecutionKey, setShowExecutionKey] = useState(false);
  const [showAlchemyKey, setShowAlchemyKey] = useState(false);
  const [showGithubIssueToken, setShowGithubIssueToken] = useState(false);

  const [runnerDraft, setRunnerDraft] = useState<RunnerDraft>({
    intervalSec: DEFAULT_RUNNER_INTERVAL_SEC,
    commentContextLimit: DEFAULT_RUNNER_COMMENT_CONTEXT_LIMIT,
    maxTokens: "",
    supplementaryPromptProfile: "",
  });
  const [runnerLauncherPort, setRunnerLauncherPort] = useState("");
  const [runnerLauncherSecret, setRunnerLauncherSecret] = useState("");
  const [detectedRunnerPorts, setDetectedRunnerPorts] = useState<number[]>([]);
  const [runnerStatus, setRunnerStatus] = useState<StatusMessage | null>(null);
  const [detectRunnerBusy, setDetectRunnerBusy] = useState(false);
  const [startRunnerBusy, setStartRunnerBusy] = useState(false);
  const [stopRunnerBusy, setStopRunnerBusy] = useState(false);
  const [runnerRunning, setRunnerRunning] = useState(false);
  const [runnerAgentReports, setRunnerAgentReports] = useState<RunnerAgentReportRow[] | null>(
    null
  );
  const [isRunnerGuideOpen, setIsRunnerGuideOpen] = useState(false);
  const runAgentModalStateRestoredRef = useRef(false);
  const [runAgentModalStateReady, setRunAgentModalStateReady] = useState(false);
  const runnerGuideRestoreCheckedRef = useRef(false);

  const [tested, setTested] = useState({
    llmApiKey: false,
    executionWalletPrivateKey: false,
    alchemyApiKey: false,
    runnerLauncher: false,
  });

  const authHeaders = useMemo(
    () =>
      token
        ? ({ Authorization: `Bearer ${token}` } as Record<string, string>)
        : undefined,
    [token]
  );

  const currentPair = useMemo(() => {
    return (
      pairs.find((pair) => pair.id === agentId) ||
      pairs.find((pair) => pair.community.id === communityId) ||
      null
    );
  }, [agentId, communityId, pairs]);

  const sourcePairs = useMemo(() => {
    return pairs.filter((pair) => pair.id !== agentId && pair.community.id !== communityId);
  }, [agentId, communityId, pairs]);

  const modelOptions = useMemo(() => {
    const set = new Set<string>();
    if (llmModel.trim()) set.add(llmModel.trim());
    for (const model of availableModels) {
      const value = String(model || "").trim();
      if (value) set.add(value);
    }
    return Array.from(set);
  }, [availableModels, llmModel]);

  const currentCommunityName =
    general?.community?.name || currentPair?.community?.name || communityName;
  const currentCommunitySlug =
    general?.community?.slug || currentPair?.community?.slug || communitySlug;
  const currentOwnerWallet =
    general?.agent?.ownerWallet || currentPair?.ownerWallet || connectedWallet || "";
  const currentAgentHandle = useMemo(() => {
    const fromState = String(llmHandleName || "").trim();
    if (fromState) return fromState;
    return String(agentHandle || general?.agent?.handle || currentPair?.handle || "").trim();
  }, [agentHandle, currentPair?.handle, general?.agent?.handle, llmHandleName]);

  const readError = useCallback(async (response: Response) => {
    const text = await response.text().catch(() => "");
    return readStatusError(text);
  }, []);

  const fetchLocalLauncher = useCallback(
    (input: RequestInfo | URL, init?: RequestInit) => {
      return fetch(input, withLocalLauncherRequestOptions(init) as RequestInit);
    },
    []
  );

  const acquireSecuritySignature = useCallback(
    async (setStatus: (message: StatusMessage) => void) => {
      const cachedSignature = securitySignature.trim();
      if (cachedSignature) return cachedSignature;

      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        setStatus({ kind: "error", text: "MetaMask not detected." });
        return null;
      }

      try {
        const provider = new BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const signature = await signer.signMessage(SECURITY_SIGNING_MESSAGE);
        setSecuritySignature(signature);
        return signature;
      } catch {
        setStatus({ kind: "error", text: "Failed to generate signature." });
        return null;
      }
    },
    [securitySignature]
  );

  const acquireLegacyCommunitySignature = useCallback(
    async (communitySlugInput: string) => {
      const slug = String(communitySlugInput || "").trim();
      if (!slug) return null;
      const cacheKey = slug.toLowerCase();
      const cachedSignature = String(legacyCommunitySignatures[cacheKey] || "").trim();
      if (cachedSignature) {
        return cachedSignature;
      }

      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        return null;
      }

      try {
        const provider = new BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const signature = await signer.signMessage(
          `${LEGACY_AGENT_SIGNIN_MESSAGE_PREFIX}${slug}`
        );
        setLegacyCommunitySignatures((prev) => ({
          ...prev,
          [cacheKey]: signature,
        }));
        return signature;
      } catch {
        return null;
      }
    },
    [legacyCommunitySignatures]
  );

  const loadPairs = useCallback(async () => {
    if (!sessionReady) {
      return;
    }
    if (!token || !authHeaders) {
      setPairs([]);
      setPairsStatus(null);
      return;
    }

    setPairsBusy(true);
    try {
      const response = await fetch("/api/agents/mine", {
        headers: authHeaders,
      });
      if (!response.ok) {
        setPairs([]);
        setPairsStatus({ kind: "error", text: await readError(response) });
        return;
      }

      const data = await response.json();
      const nextPairs = Array.isArray(data?.pairs) ? (data.pairs as PairItem[]) : [];
      setPairs(nextPairs);
      if (!nextPairs.length) {
        setPairsStatus({ kind: "error", text: "No registered agents found." });
        return;
      }
      setPairsStatus(null);
    } catch {
      setPairs([]);
      setPairsStatus({ kind: "error", text: "Failed to load registered agents." });
    } finally {
      setPairsBusy(false);
    }
  }, [authHeaders, readError, sessionReady, token]);

  const loadCurrentGeneral = useCallback(async () => {
    if (!token || !agentId || !authHeaders) return;
    try {
      const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/general`, {
        headers: authHeaders,
      });
      if (!response.ok) return;
      const data = (await response.json()) as GeneralPayload;
      setGeneral(data);
    } catch {
      // noop
    }
  }, [agentId, authHeaders, token]);

  const loadRunnerConfig = useCallback(() => {
    if (!agentId || typeof window === "undefined") {
      setRunnerDraft({
        intervalSec: DEFAULT_RUNNER_INTERVAL_SEC,
        commentContextLimit: DEFAULT_RUNNER_COMMENT_CONTEXT_LIMIT,
        maxTokens: "",
        supplementaryPromptProfile: "",
      });
      setRunnerLauncherPort("");
      setRunnerLauncherSecret("");
      setRunnerStatus(null);
      return;
    }

    try {
      const raw = window.localStorage.getItem(runnerStorageKey(agentId));
      if (!raw) {
        setRunnerDraft({
          intervalSec: DEFAULT_RUNNER_INTERVAL_SEC,
          commentContextLimit: DEFAULT_RUNNER_COMMENT_CONTEXT_LIMIT,
          maxTokens: "",
          supplementaryPromptProfile: "",
        });
        setRunnerLauncherPort("");
        setRunnerLauncherSecret("");
        setRunnerStatus(null);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<RunnerDraft> & {
        runnerLauncherPort?: string;
        runnerLauncherSecret?: string;
      };
      setRunnerDraft({
        intervalSec: normalizePositiveInteger(
          String(parsed.intervalSec || ""),
          DEFAULT_RUNNER_INTERVAL_SEC
        ),
        commentContextLimit: normalizeNonNegativeInteger(
          String(parsed.commentContextLimit || ""),
          DEFAULT_RUNNER_COMMENT_CONTEXT_LIMIT
        ),
        maxTokens: String(parsed.maxTokens || ""),
        supplementaryPromptProfile: normalizeSupplementaryPromptProfile(
          String(parsed.supplementaryPromptProfile || ""),
          ""
        ),
      });
      setRunnerLauncherPort(String(parsed.runnerLauncherPort || ""));
      setRunnerLauncherSecret(String(parsed.runnerLauncherSecret || ""));
      setRunnerStatus({ kind: "info", text: "Runner settings loaded from local cache." });
    } catch {
      setRunnerDraft({
        intervalSec: DEFAULT_RUNNER_INTERVAL_SEC,
        commentContextLimit: DEFAULT_RUNNER_COMMENT_CONTEXT_LIMIT,
        maxTokens: "",
        supplementaryPromptProfile: "",
      });
      setRunnerLauncherPort("");
      setRunnerLauncherSecret("");
      setRunnerStatus({ kind: "error", text: "Failed to parse runner cache." });
    }
  }, [agentId]);

  const saveRunnerConfig = useCallback((secretOverride?: string) => {
    if (!agentId || typeof window === "undefined") return;

    const nextDraft = {
      intervalSec: normalizePositiveInteger(
        runnerDraft.intervalSec,
        DEFAULT_RUNNER_INTERVAL_SEC
      ),
      commentContextLimit: normalizeNonNegativeInteger(
        runnerDraft.commentContextLimit,
        DEFAULT_RUNNER_COMMENT_CONTEXT_LIMIT
      ),
      maxTokens: normalizePositiveInteger(runnerDraft.maxTokens, ""),
      supplementaryPromptProfile: normalizeSupplementaryPromptProfile(
        runnerDraft.supplementaryPromptProfile,
        ""
      ),
    };
    const nextPort = normalizePositiveInteger(runnerLauncherPort, DEFAULT_RUNNER_LAUNCHER_PORT);

    try {
      window.localStorage.setItem(
        runnerStorageKey(agentId),
        JSON.stringify({
          ...nextDraft,
          runnerLauncherPort: nextPort,
          runnerLauncherSecret:
            typeof secretOverride === "string" ? secretOverride : runnerLauncherSecret,
        })
      );
    } catch {
      // noop
    }
  }, [agentId, runnerDraft, runnerLauncherPort, runnerLauncherSecret]);

  const fetchModelsByApiKey = useCallback(
    async (showSuccess = true) => {
      const llmApiKey = securityDraft.llmApiKey.trim();
      const provider = llmProvider.trim();
      const baseUrl = liteLlmBaseUrl.trim();
      if (!llmApiKey) {
        setSecurityStatus({ kind: "error", text: "LLM API key is required." });
        return false;
      }
      if (!provider) {
        setGeneralStatus({ kind: "error", text: "LLM provider is required." });
        return false;
      }
      if (provider === "LITELLM" && !baseUrl) {
        setGeneralStatus({ kind: "error", text: "Base URL is required for LiteLLM." });
        return false;
      }

      setModelsBusy(true);
      try {
        let models: string[] = [];
        if (provider === "GEMINI") {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(llmApiKey)}`
          );
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            setSecurityStatus({
              kind: "error",
              text: String(data?.error?.message || "Gemini request failed."),
            });
            return false;
          }
          models = Array.isArray(data?.models)
            ? data.models
                .filter((item: any) =>
                  Array.isArray(item?.supportedGenerationMethods)
                    ? item.supportedGenerationMethods.includes("generateContent")
                    : false
                )
                .map((item: any) => String(item?.name || "").replace("models/", ""))
                .filter(Boolean)
            : [];
        } else if (provider === "OPENAI") {
          const response = await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${llmApiKey}` },
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            setSecurityStatus({
              kind: "error",
              text: String(data?.error?.message || "OpenAI request failed."),
            });
            return false;
          }
          models = Array.isArray(data?.data)
            ? data.data.map((item: any) => String(item?.id || "")).filter(Boolean)
            : [];
        } else if (provider === "LITELLM") {
          const normalized = baseUrl.replace(/\/+$/, "");
          const apiBase = normalized.endsWith("/v1") ? normalized : `${normalized}/v1`;
          const response = await fetch(`${apiBase}/models`, {
            headers: { Authorization: `Bearer ${llmApiKey}` },
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            setSecurityStatus({
              kind: "error",
              text: String(data?.error?.message || "LiteLLM request failed."),
            });
            return false;
          }
          models = Array.isArray(data?.data)
            ? data.data.map((item: any) => String(item?.id || "")).filter(Boolean)
            : [];
        } else if (provider === "ANTHROPIC") {
          const response = await fetch("https://api.anthropic.com/v1/models", {
            headers: {
              "x-api-key": llmApiKey,
              "anthropic-version": "2023-06-01",
            },
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            setSecurityStatus({
              kind: "error",
              text: String(data?.error?.message || data?.error?.type || "Anthropic request failed."),
            });
            return false;
          }
          models = Array.isArray(data?.data)
            ? data.data.map((item: any) => String(item?.id || "")).filter(Boolean)
            : [];
        }

        if (!models.length) {
          setSecurityStatus({ kind: "error", text: "No models returned from provider." });
          return false;
        }

        setAvailableModels(models);
        setLlmModel((prev) => {
          const current = String(prev || "").trim();
          if (current && models.includes(current)) return current;
          return models[0];
        });
        setTested((prev) => ({ ...prev, llmApiKey: true }));
        if (showSuccess) {
          setSecurityStatus({ kind: "success", text: `Loaded ${models.length} models.` });
        }
        return true;
      } catch {
        setSecurityStatus({ kind: "error", text: "Failed to load model list." });
        return false;
      } finally {
        setModelsBusy(false);
      }
    },
    [llmProvider, liteLlmBaseUrl, securityDraft.llmApiKey]
  );

  const saveGeneral = useCallback(async () => {
    if (!token || !agentId || !authHeaders) {
      setGeneralStatus({ kind: "error", text: "Sign in first." });
      return false;
    }

    const handle = currentAgentHandle.trim();
    const provider = llmProvider.trim().toUpperCase();
    const model = llmModel.trim();
    const baseUrl = liteLlmBaseUrl.trim().replace(/\/+$/, "");

    if (!handle || !provider || !model) {
      setGeneralStatus({ kind: "error", text: "Handle, provider, and model are required." });
      return false;
    }
    if (provider === "LITELLM" && !baseUrl) {
      setGeneralStatus({ kind: "error", text: "Base URL is required for LiteLLM." });
      return false;
    }

    setGeneralBusy(true);
    setGeneralStatus({ kind: "info", text: "Saving public configuration..." });
    try {
      const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/general`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          handle,
          llmProvider: provider,
          llmModel: model,
          llmBaseUrl: provider === "LITELLM" ? baseUrl : null,
        }),
      });
      if (!response.ok) {
        setGeneralStatus({ kind: "error", text: await readError(response) });
        return false;
      }
      const data = (await response.json()) as GeneralPayload;
      setGeneral(data);
      setGeneralStatus({ kind: "success", text: "Public configuration saved." });
      return true;
    } catch {
      setGeneralStatus({ kind: "error", text: "Failed to save public configuration." });
      return false;
    } finally {
      setGeneralBusy(false);
    }
  }, [
    agentId,
    authHeaders,
    currentAgentHandle,
    llmModel,
    llmProvider,
    liteLlmBaseUrl,
    readError,
    token,
  ]);

  const loadGeneralFromDb = useCallback(async () => {
    if (!token || !agentId || !authHeaders) {
      setGeneralStatus({ kind: "error", text: "Sign in first." });
      return false;
    }

    setGeneralBusy(true);
    setGeneralStatus({ kind: "info", text: "Loading public configuration..." });
    try {
      const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/general`, {
        headers: authHeaders,
      });
      if (!response.ok) {
        setGeneralStatus({ kind: "error", text: await readError(response) });
        return false;
      }
      const data = (await response.json()) as GeneralPayload;
      setGeneral(data);
      setLlmHandleName(data?.agent?.handle || "");
      setLlmProvider(data?.agent?.llmProvider || "");
      setLlmModel(data?.agent?.llmModel || "");
      setLiteLlmBaseUrl(data?.agent?.llmBaseUrl || "");
      setGeneralStatus({ kind: "success", text: "Public configuration loaded." });
      return true;
    } catch {
      setGeneralStatus({ kind: "error", text: "Failed to load public configuration." });
      return false;
    } finally {
      setGeneralBusy(false);
    }
  }, [agentId, authHeaders, readError, token]);

  const loadEncryptedSecurity = useCallback(async () => {
    if (!token || !agentId || !authHeaders) {
      setSecurityStatus({ kind: "error", text: "Sign in first." });
      return null;
    }

    try {
      const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/secrets`, {
        headers: authHeaders,
      });
      if (!response.ok) {
        setSecurityStatus({ kind: "error", text: await readError(response) });
        setEncryptedSecurity(null);
        return null;
      }
      const data = await response.json().catch(() => ({}));
      const encrypted = normalizeEncryptedSecurity(data?.securitySensitive);
      setEncryptedSecurity(encrypted);
      if (!encrypted && data?.securitySensitive != null) {
        setSecurityStatus({
          kind: "error",
          text: "Unsupported ciphertext format. Re-enter values and save again.",
        });
        return null;
      }
      return encrypted;
    } catch {
      setEncryptedSecurity(null);
      setSecurityStatus({ kind: "error", text: "Failed to load encrypted ciphertext." });
      return null;
    }
  }, [agentId, authHeaders, readError, token]);

  const promptSecurityPassword = useCallback(
    (purpose: "decrypt" | "encrypt") => {
      const promptMessage =
        purpose === "decrypt"
          ? "Enter security password to decrypt confidential keys."
          : "Enter security password to encrypt and save confidential keys.";
      const prompted = window.prompt(promptMessage, securityPassword);
      if (prompted == null) return null;
      const normalized = prompted.trim();
      if (!normalized) {
        setSecurityStatus({
          kind: "error",
          text:
            purpose === "decrypt"
              ? "Password is required to decrypt."
              : "Password is required to encrypt.",
        });
        return null;
      }
      setSecurityPassword(normalized);
      return normalized;
    },
    [securityPassword]
  );

  const decryptEncryptedSecurity = useCallback(
    async (
      encrypted: EncryptedSecurity,
      password: string,
      options?: {
        fallbackLegacySlug?: string;
        successMessage?: string;
      }
    ) => {
      const normalizedPassword = password.trim();
      if (!normalizedPassword) {
        setSecurityStatus({ kind: "error", text: "Password is required to decrypt." });
        return false;
      }

      const signature = await acquireSecuritySignature(setSecurityStatus);
      if (!signature) return false;

      const applyDraft = (payload: unknown) => {
        const normalizedDraft = toSecuritySensitiveDraft(payload);
        setSecurityDraft(normalizedDraft);
        setHasSavedSecurityToDb(false);
        setTested((prev) => ({
          ...prev,
          llmApiKey: false,
          executionWalletPrivateKey: false,
          alchemyApiKey: false,
        }));
      };

      try {
        const decrypted = await decryptAgentSecrets(signature, normalizedPassword, encrypted);
        applyDraft(decrypted);
        setSecurityStatus({
          kind: "success",
          text: options?.successMessage || "Decrypted ciphertext successfully.",
        });
        return true;
      } catch {
        const candidateLegacySlugs: string[] = [];
        const seenLegacy = new Set<string>();
        for (const raw of [
          encrypted.legacyCommunitySlug,
          options?.fallbackLegacySlug,
          currentCommunitySlug,
          ...Object.keys(legacyCommunitySignatures),
        ]) {
          const slug = String(raw || "").trim();
          if (!slug) continue;
          const key = slug.toLowerCase();
          if (seenLegacy.has(key)) continue;
          seenLegacy.add(key);
          candidateLegacySlugs.push(slug);
        }

        for (const slug of candidateLegacySlugs) {
          const legacySignature = await acquireLegacyCommunitySignature(slug);
          if (!legacySignature) continue;
          try {
            const decrypted = await decryptAgentSecrets(
              legacySignature,
              normalizedPassword,
              encrypted
            );
            applyDraft(decrypted);
            setSecurityStatus({
              kind: "success",
              text: options?.successMessage || "Decrypted ciphertext successfully.",
            });
            return true;
          } catch {
            // try next
          }
        }

        setSecurityStatus({ kind: "error", text: "Decryption failed." });
        return false;
      }
    },
    [
      acquireLegacyCommunitySignature,
      acquireSecuritySignature,
      currentCommunitySlug,
      legacyCommunitySignatures,
    ]
  );

  const loadAndDecryptSecurityFromDb = useCallback(async (password: string) => {
    if (!token || !agentId || !authHeaders) {
      setSecurityStatus({ kind: "error", text: "Sign in first." });
      return false;
    }
    const generalLoaded = await loadGeneralFromDb();
    if (!generalLoaded) return false;

    setSecurityBusy(true);
    try {
      setSecurityStatus({ kind: "info", text: "Loading encrypted ciphertext..." });
      const encrypted = await loadEncryptedSecurity();
      if (!encrypted) {
        return false;
      }

      setSecurityStatus({ kind: "info", text: "Decrypting ciphertext..." });
      return await decryptEncryptedSecurity(
        encrypted,
        password,
        {
          successMessage: "Loaded from DB and decrypted successfully.",
        }
      );
    } finally {
      setSecurityBusy(false);
    }
  }, [
    agentId,
    authHeaders,
    decryptEncryptedSecurity,
    loadGeneralFromDb,
    loadEncryptedSecurity,
    token,
  ]);

  const encryptAndSaveSecurity = useCallback(async (password: string) => {
    if (!token || !agentId || !authHeaders) {
      setSecurityStatus({ kind: "error", text: "Sign in first." });
      return false;
    }
    const generalSaved = await saveGeneral();
    if (!generalSaved) return false;
    const normalizedPassword = password.trim();
    if (!normalizedPassword) {
      setSecurityStatus({ kind: "error", text: "Password is required to encrypt." });
      return false;
    }

    const signature = await acquireSecuritySignature(setSecurityStatus);
    if (!signature) return false;

    setHasSavedSecurityToDb(false);
    setSecurityBusy(true);
    setSecurityStatus({ kind: "info", text: "Encrypting and saving ciphertext..." });
    try {
      const encrypted = await encryptAgentSecrets(
        signature,
        normalizedPassword,
        securityDraft
      );
      const response = await fetch(`/api/agents/${encodeURIComponent(agentId)}/secrets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ securitySensitive: encrypted }),
      });
      if (!response.ok) {
        setSecurityStatus({ kind: "error", text: await readError(response) });
        return false;
      }
      setEncryptedSecurity(encrypted);
      setHasSavedSecurityToDb(true);
      setSecurityStatus({ kind: "success", text: "Encrypted ciphertext saved." });
      return true;
    } catch {
      setHasSavedSecurityToDb(false);
      setSecurityStatus({ kind: "error", text: "Failed to encrypt and save ciphertext." });
      return false;
    } finally {
      setSecurityBusy(false);
    }
  }, [
    acquireSecuritySignature,
    agentId,
    authHeaders,
    readError,
    saveGeneral,
    securityDraft,
    token,
  ]);

  const handleLoadAndDecryptSecurityFromDb = useCallback(async () => {
    const password = promptSecurityPassword("decrypt");
    if (!password) return;
    await loadAndDecryptSecurityFromDb(password);
  }, [loadAndDecryptSecurityFromDb, promptSecurityPassword]);

  const handleEncryptAndSaveSecurity = useCallback(async () => {
    const password = promptSecurityPassword("encrypt");
    if (!password) return;
    await encryptAndSaveSecurity(password);
  }, [encryptAndSaveSecurity, promptSecurityPassword]);

  const testExecutionWalletKey = useCallback(async () => {
    const privateKey = securityDraft.executionWalletPrivateKey.trim();
    if (!privateKey) {
      setSecurityStatus({
        kind: "error",
        text: "Wallet private key for transaction execution is required.",
      });
      return;
    }

    try {
      const wallet = new Wallet(privateKey);
      const address = await wallet.getAddress();
      setTested((prev) => ({ ...prev, executionWalletPrivateKey: true }));
      setSecurityStatus({ kind: "success", text: `Execution key valid: ${address}` });
    } catch {
      setTested((prev) => ({ ...prev, executionWalletPrivateKey: false }));
      setSecurityStatus({
        kind: "error",
        text: "Wallet private key for transaction execution is invalid.",
      });
    }
  }, [securityDraft.executionWalletPrivateKey]);

  const testAlchemyApiKey = useCallback(async () => {
    const alchemyApiKey = securityDraft.alchemyApiKey.trim();
    if (!alchemyApiKey) {
      setSecurityStatus({ kind: "error", text: "Alchemy API key is required." });
      return;
    }

    try {
      const provider = new JsonRpcProvider(
        `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`
      );
      const network = await provider.getNetwork();
      setTested((prev) => ({ ...prev, alchemyApiKey: true }));
      setSecurityStatus({
        kind: "success",
        text: `Alchemy key test passed (chainId: ${String(network.chainId)}).`,
      });
    } catch {
      setTested((prev) => ({ ...prev, alchemyApiKey: false }));
      setSecurityStatus({ kind: "error", text: "Alchemy API key test failed." });
    }
  }, [securityDraft.alchemyApiKey]);

  const testGithubIssueToken = useCallback(async () => {
    const githubIssueToken = securityDraft.githubIssueToken.trim();
    if (!githubIssueToken) {
      setSecurityStatus({ kind: "error", text: "GitHub personal access token is missing." });
      return;
    }

    try {
      const response = await fetch("https://api.github.com/user", {
        method: "GET",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubIssueToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSecurityStatus({
          kind: "error",
          text: String(data?.message || "GitHub token test failed."),
        });
        return;
      }
      const login = String(data?.login || "").trim();
      setSecurityStatus({
        kind: "success",
        text: login
          ? `GitHub token test passed (account: ${login}).`
          : "GitHub token test passed.",
      });
    } catch {
      setSecurityStatus({ kind: "error", text: "GitHub token test failed." });
    }
  }, [securityDraft.githubIssueToken]);

  const fetchRunnerStatus = useCallback(
    async (options?: {
      preferredPort?: string;
      silent?: boolean;
      includeAgentReport?: boolean;
      secretOverride?: string;
    }): Promise<RunnerStatusSnapshot | null> => {
      const launcherPort = String(options?.preferredPort || runnerLauncherPort).trim();
      const launcherSecret = String(
        options?.secretOverride ?? runnerLauncherSecret
      ).trim();
      if (!launcherPort) {
        setRunnerRunning(false);
        if (!options?.silent) {
          setRunnerStatus({ kind: "error", text: "Runner launcher port is required." });
        }
        return null;
      }
      if (!launcherSecret) {
        setRunnerRunning(false);
        if (!options?.silent) {
          setRunnerStatus({ kind: "error", text: "Runner launcher secret is required." });
        }
        return null;
      }

      try {
        const response = await fetchLocalLauncher(
          `http://127.0.0.1:${launcherPort}/runner/status?agentId=${encodeURIComponent(agentId)}`,
          {
            method: "GET",
            headers: {
              "x-runner-secret": launcherSecret,
            },
          }
        );
        if (!response.ok) {
          const message = await readError(response);
          setRunnerRunning(false);
          if (!options?.silent) {
            setRunnerStatus({ kind: "error", text: message });
          }
          return null;
        }

        const data = await response.json().catch(() => ({}));
        const status = (data?.status || {}) as Record<string, unknown>;

        const rawRunning = Boolean(status.runningAny || status.running);
        const runningForSelectedAgent = Boolean(
          status.selectedAgentRunning ||
            (status.selectedAgentId && String(status.selectedAgentId) === agentId && status.running)
        );
        const runningAgentIds = Array.isArray(status.runningAgentIds)
          ? status.runningAgentIds.map((entry) => String(entry || "")).filter(Boolean)
          : [];
        const runningAgentCount = Number.isFinite(Number(status.agentCount))
          ? Number(status.agentCount)
          : runningAgentIds.length;
        const agentReports = Array.isArray(status.agents)
          ? status.agents
              .map((rawAgent) => {
                const entry =
                  rawAgent && typeof rawAgent === "object"
                    ? (rawAgent as Record<string, unknown>)
                    : null;
                if (!entry) return null;
                const rowAgentId = String(entry.agentId || "").trim();
                if (!rowAgentId) return null;
                const usage =
                  entry.llmUsageCumulative && typeof entry.llmUsageCumulative === "object"
                    ? (entry.llmUsageCumulative as Record<string, unknown>)
                    : null;
                const runtime =
                  entry.config &&
                  typeof entry.config === "object" &&
                  (entry.config as Record<string, unknown>).runtime &&
                  typeof (entry.config as Record<string, unknown>).runtime === "object"
                    ? ((entry.config as Record<string, unknown>).runtime as Record<
                        string,
                        unknown
                      >)
                    : null;
                const startedAtMs = Date.parse(String(entry.startedAt || ""));
                const inferredElapsedMs = Number.isFinite(startedAtMs)
                  ? Math.max(0, Date.now() - startedAtMs)
                  : 0;
                const elapsedRunningMs = toNonNegativeInteger(
                  entry.elapsedRunningMs,
                  inferredElapsedMs
                );
                return {
                  agentId: rowAgentId,
                  agentName: String(entry.agentHandle || "").trim() || rowAgentId,
                  communityName:
                    String(entry.activeCommunityName || "").trim() ||
                    String(entry.activeCommunitySlug || "").trim() ||
                    "-",
                  runnerIntervalSec: Number.isFinite(Number(runtime?.intervalSec))
                    ? Math.floor(Number(runtime?.intervalSec))
                    : null,
                  cumulativeWorkMs: elapsedRunningMs,
                  cumulativeTokens: toNonNegativeInteger(usage?.totalTokens, 0),
                  cumulativeThreadCount: toNonNegativeInteger(
                    entry.cumulativeThreadCreateCount,
                    0
                  ),
                  cumulativeCommunityCount: toNonNegativeInteger(
                    entry.cumulativeWrittenCommunityCount,
                    0
                  ),
                } satisfies RunnerAgentReportRow;
              })
              .filter((entry): entry is RunnerAgentReportRow => Boolean(entry))
          : [];

        setRunnerRunning(runningForSelectedAgent);
        if (options?.includeAgentReport) {
          setRunnerAgentReports(agentReports);
        }
        if (!options?.silent) {
          if (runningForSelectedAgent) {
            setRunnerStatus({
              kind: "info",
              text: `Runner is running on localhost:${launcherPort}.`,
            });
          } else if (rawRunning) {
            setRunnerStatus({
              kind: "error",
              text: `Runner is active on localhost:${launcherPort} for another agent.`,
            });
          } else {
            setRunnerStatus({
              kind: "info",
              text: `Runner is stopped on localhost:${launcherPort}.`,
            });
          }
        }

        return {
          launcherPort,
          rawRunning,
          runningForSelectedAgent,
          runningForOtherAgent: rawRunning && !runningForSelectedAgent,
          statusAgentId: String(status.selectedAgentId || "").trim(),
          runningAgentIds,
          runningAgentCount,
          agentReports,
        };
      } catch {
        setRunnerRunning(false);
        if (options?.includeAgentReport) {
          setRunnerAgentReports(null);
        }
        if (!options?.silent) {
          setRunnerStatus({
            kind: "error",
            text: "Could not reach local runner launcher. Start apps/runner first.",
          });
        }
        return null;
      }
    },
    [agentId, fetchLocalLauncher, readError, runnerLauncherPort, runnerLauncherSecret]
  );

  const detectRunnerLauncherPorts = useCallback(async () => {
    setDetectRunnerBusy(true);
    try {
      const currentPort = Number.parseInt(
        String(runnerLauncherPort || DEFAULT_RUNNER_LAUNCHER_PORT),
        10
      );
      const ports = Array.from(
        new Set(
          [
            Number.isFinite(currentPort) ? currentPort : null,
            ...RUNNER_PORT_SCAN_RANGE,
          ].filter((value): value is number => Number.isFinite(value))
        )
      );

      const probe = async (port: number) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 800);
        try {
          const response = await fetchLocalLauncher(`http://127.0.0.1:${port}/health`, {
            method: "GET",
            signal: controller.signal,
          });
          if (!response.ok) {
            const bodyText = await response.text().catch(() => "");
            return {
              port,
              ok: false as const,
              status: response.status,
              message: readStatusError(bodyText),
            };
          }
          const data = await response.json().catch(() => ({}));
          if (data?.ok) {
            return {
              port,
              ok: true as const,
              status: response.status,
              message: "",
            };
          }
          return {
            port,
            ok: false as const,
            status: response.status,
            message: "Unexpected /health response.",
          };
        } catch {
          return {
            port,
            ok: false as const,
            status: 0,
            message: "Network error",
          };
        } finally {
          clearTimeout(timeout);
        }
      };

      const results = await Promise.all(ports.map((port) => probe(port)));
      const matched = results
        .filter((entry) => entry.ok)
        .map((entry) => entry.port)
        .sort((a, b) => a - b);
      const blockedByOrigin = results
        .filter((entry) => !entry.ok && entry.status === 403)
        .map((entry) => entry.port);

      setDetectedRunnerPorts((prev) => (areNumberArraysEqual(prev, matched) ? prev : matched));

      if (matched.length) {
        setRunnerLauncherPort((prev) => {
          const current = String(prev || "").trim();
          if (current && matched.includes(Number(current))) return current;
          return String(matched[0]);
        });
        setTested((prev) => ({ ...prev, runnerLauncher: true }));
        setRunnerStatus({
          kind: "success",
          text: `Detected launcher port: ${matched.join(", ")}`,
        });
        return;
      }

      setTested((prev) => ({ ...prev, runnerLauncher: false }));
      setRunnerRunning(false);
      if (blockedByOrigin.length) {
        const currentOrigin =
          typeof window !== "undefined" ? window.location.origin : "current browser origin";
        setRunnerStatus({
          kind: "error",
          text: `Launcher is reachable on localhost:${blockedByOrigin.join(
            ", "
          )} but blocked by CORS origin policy. Restart runner with --sns ${currentOrigin}.`,
        });
        return;
      }
      setRunnerStatus({ kind: "error", text: "No running runner launcher detected." });
    } finally {
      setDetectRunnerBusy(false);
    }
  }, [fetchLocalLauncher, runnerLauncherPort]);

  const stopRunnerLauncher = useCallback(async () => {
    const launcherPort = String(runnerLauncherPort || "").trim();
    const launcherSecret = runnerLauncherSecret.trim();
    if (!launcherPort) {
      setRunnerStatus({ kind: "error", text: "Runner launcher port is required." });
      return;
    }
    if (!launcherSecret) {
      setRunnerStatus({ kind: "error", text: "Runner launcher secret is required." });
      return;
    }

    setStopRunnerBusy(true);
    try {
      const response = await fetchLocalLauncher(
        `http://127.0.0.1:${launcherPort}/runner/stop`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-runner-secret": launcherSecret,
          },
          body: JSON.stringify({ agentId }),
        }
      );
      if (!response.ok) {
        setRunnerStatus({ kind: "error", text: await readError(response) });
        return;
      }

      setRunnerRunning(false);
      setRunnerStatus({
        kind: "success",
        text: `Runner stopped on localhost:${launcherPort}.`,
      });
    } catch {
      setRunnerStatus({
        kind: "error",
        text: "Could not reach local runner launcher. Start apps/runner first.",
      });
    } finally {
      setStopRunnerBusy(false);
    }
  }, [agentId, fetchLocalLauncher, readError, runnerLauncherPort, runnerLauncherSecret]);

  const handleCheckRunnerStatus = useCallback(async () => {
    await fetchRunnerStatus({ includeAgentReport: true });
  }, [fetchRunnerStatus]);

  const promptRunnerLauncherSecret = useCallback(() => {
    const prompted = window.prompt(
      "Enter Runner Launcher Secret.",
      runnerLauncherSecret
    );
    if (prompted == null) {
      setRunnerStatus({ kind: "error", text: "Runner start cancelled." });
      return null;
    }
    const normalized = prompted.trim();
    if (!normalized) {
      setRunnerStatus({ kind: "error", text: "Runner launcher secret is required." });
      return null;
    }
    return normalized;
  }, [runnerLauncherSecret]);

  const startRunnerLauncher = useCallback(async (secretInput?: string) => {
    if (!token || !authHeaders) {
      setRunnerStatus({ kind: "error", text: "Sign in first." });
      return;
    }

    const launcherPort = String(runnerLauncherPort || "").trim();
    if (!launcherPort) {
      setRunnerStatus({ kind: "error", text: "Runner launcher port is required." });
      return;
    }
    const launcherSecret = String(secretInput ?? runnerLauncherSecret).trim();
    if (!launcherSecret) {
      setRunnerStatus({ kind: "error", text: "Runner launcher secret is required." });
      return;
    }

    const normalizedInterval = normalizePositiveInteger(
      runnerDraft.intervalSec,
      DEFAULT_RUNNER_INTERVAL_SEC
    );
    const normalizedLimit = normalizeNonNegativeInteger(
      runnerDraft.commentContextLimit,
      DEFAULT_RUNNER_COMMENT_CONTEXT_LIMIT
    );
    const normalizedMaxTokens = normalizePositiveInteger(runnerDraft.maxTokens, "");
    const normalizedSupplementaryPromptProfile = normalizeSupplementaryPromptProfile(
      runnerDraft.supplementaryPromptProfile,
      ""
    );

    const encodedInput = encodeLauncherInputMessage({
      securitySensitive: {
        llmApiKey: securityDraft.llmApiKey.trim(),
        executionWalletPrivateKey: securityDraft.executionWalletPrivateKey.trim(),
        alchemyApiKey: securityDraft.alchemyApiKey.trim(),
        githubIssueToken: securityDraft.githubIssueToken.trim(),
      },
      runner: {
        intervalSec: Number(normalizedInterval),
        commentContextLimit: Number(normalizedLimit),
        runnerLauncherPort: Number(launcherPort),
        ...(normalizedSupplementaryPromptProfile
          ? { supplementaryPromptProfile: normalizedSupplementaryPromptProfile }
          : {}),
        ...(normalizedMaxTokens ? { maxTokens: Number(normalizedMaxTokens) } : {}),
      },
    });

    if (!encodedInput) {
      setRunnerStatus({ kind: "error", text: "Failed to encode launcher input payload." });
      return;
    }

    setStartRunnerBusy(true);
    try {
      setRunnerLauncherSecret(launcherSecret);
      const preflight = await fetchRunnerStatus({
        preferredPort: launcherPort,
        silent: true,
        secretOverride: launcherSecret,
      });
      if (!preflight) {
        setRunnerStatus({
          kind: "error",
          text: `Runner status preflight failed on localhost:${launcherPort}.`,
        });
        return;
      }
      if (preflight.runningForSelectedAgent) {
        setRunnerStatus({
          kind: "info",
          text: `Runner is already running on localhost:${launcherPort}.`,
        });
        return;
      }
      if (preflight.runningForOtherAgent) {
        setRunnerStatus({
          kind: "error",
          text: `Runner is already active for another agent on localhost:${launcherPort}.`,
        });
        return;
      }

      const credentialResponse = await fetch(
        `/api/agents/${encodeURIComponent(agentId)}/runner-credential`,
        {
          method: "POST",
          headers: authHeaders,
        }
      );
      if (!credentialResponse.ok) {
        setRunnerStatus({ kind: "error", text: await readError(credentialResponse) });
        return;
      }
      const credentialData = await credentialResponse.json().catch(() => ({}));
      const runnerToken = String(credentialData?.runnerToken || "").trim();
      if (!runnerToken) {
        setRunnerStatus({ kind: "error", text: "Runner credential issuance failed." });
        return;
      }

      const response = await fetchLocalLauncher(
        `http://127.0.0.1:${launcherPort}/runner/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-runner-secret": launcherSecret,
          },
          body: JSON.stringify({
            config: {
              snsBaseUrl: window.location.origin,
              runnerToken,
              agentId,
              encodedInput,
              llm: {
                apiKey: securityDraft.llmApiKey.trim(),
                baseUrl: llmProvider === "LITELLM" ? liteLlmBaseUrl.trim() : "",
              },
            },
          }),
        }
      );
      if (!response.ok) {
        setRunnerStatus({ kind: "error", text: await readError(response) });
        return;
      }

      setRunnerRunning(true);
      saveRunnerConfig(launcherSecret);
      setRunnerStatus({
        kind: "success",
        text: `Runner started on localhost:${launcherPort}.`,
      });
    } catch {
      setRunnerStatus({
        kind: "error",
        text: "Could not reach local runner launcher. Start apps/runner first.",
      });
    } finally {
      setStartRunnerBusy(false);
    }
  }, [
    agentId,
    authHeaders,
    fetchLocalLauncher,
    fetchRunnerStatus,
    liteLlmBaseUrl,
    llmProvider,
    readError,
    runnerDraft.commentContextLimit,
    runnerDraft.intervalSec,
    runnerDraft.maxTokens,
    runnerDraft.supplementaryPromptProfile,
    runnerLauncherPort,
    runnerLauncherSecret,
    saveRunnerConfig,
    securityDraft.alchemyApiKey,
    securityDraft.executionWalletPrivateKey,
    securityDraft.githubIssueToken,
    securityDraft.llmApiKey,
    token,
  ]);

  const prepareFromSource = useCallback(async (password: string) => {
    if (!token || !authHeaders) {
      setPairsStatus({ kind: "error", text: "Sign in first." });
      return false;
    }

    const sourceId = String(importSourceAgentId || "").trim();
    if (!sourceId) {
      setPairsStatus({ kind: "error", text: "Select a source community configuration." });
      return false;
    }

    const sourcePair = sourcePairs.find((pair) => pair.id === sourceId);
    const sourceName = sourcePair
      ? `${sourcePair.community.name} (${sourcePair.community.slug})`
      : "selected source";

    setPrepareBusy(true);
    setPairsStatus({
      kind: "info",
      text: `Importing configuration from ${sourceName}...`,
    });

    try {
      const [sourceGeneralResponse, sourceSecurityResponse] = await Promise.all([
        fetch(`/api/agents/${encodeURIComponent(sourceId)}/general`, {
          headers: authHeaders,
        }),
        fetch(`/api/agents/${encodeURIComponent(sourceId)}/secrets`, {
          headers: authHeaders,
        }),
      ]);

      if (!sourceGeneralResponse.ok) {
        setPairsStatus({ kind: "error", text: await readError(sourceGeneralResponse) });
        return false;
      }
      if (!sourceSecurityResponse.ok) {
        setPairsStatus({ kind: "error", text: await readError(sourceSecurityResponse) });
        return false;
      }

      const sourceGeneral = (await sourceGeneralResponse.json()) as GeneralPayload;
      const sourceSecurityData = await sourceSecurityResponse.json().catch(() => ({}));
      const sourceEncrypted = normalizeEncryptedSecurity(sourceSecurityData?.securitySensitive);

      const currentHandle = String(
        agentHandle || general?.agent?.handle || currentPair?.handle || ""
      ).trim();

      setLlmHandleName(currentHandle);
      setLlmProvider(sourceGeneral.agent.llmProvider || "");
      setLlmModel(sourceGeneral.agent.llmModel || defaultModelByProvider("GEMINI"));
      setLiteLlmBaseUrl(sourceGeneral.agent.llmBaseUrl || "");
      setEncryptedSecurity(sourceEncrypted);
      setSecurityDraft({
        llmApiKey: "",
        executionWalletPrivateKey: "",
        alchemyApiKey: "",
        githubIssueToken: "",
      });
      setHasSavedSecurityToDb(false);
      setTested({
        llmApiKey: false,
        executionWalletPrivateKey: false,
        alchemyApiKey: false,
        runnerLauncher: false,
      });
      if (!sourceEncrypted) {
        setPairsStatus({
          kind: "error",
          text: `No encrypted confidential keys were found in ${sourceName}.`,
        });
        return false;
      }
      const normalizedPassword = password.trim();
      if (!normalizedPassword) {
        setPairsStatus({
          kind: "error",
          text: "Security password is required for import and decrypt.",
        });
        setSecurityStatus({
          kind: "error",
          text: "Security password is required to decrypt.",
        });
        return false;
      }
      const decrypted = await decryptEncryptedSecurity(
        sourceEncrypted,
        normalizedPassword,
        {
          fallbackLegacySlug: sourcePair?.community?.slug || "",
          successMessage: `Imported and decrypted confidential keys from ${sourceName}.`,
        }
      );
      if (!decrypted) {
        setPairsStatus({
          kind: "error",
          text: `Failed to decrypt confidential keys from ${sourceName}.`,
        });
        return false;
      }
      setPairsStatus({
        kind: "success",
        text: `Configuration imported from ${sourceName}, including confidential key decryption.`,
      });
      return true;
    } catch {
      setPairsStatus({
        kind: "error",
        text: "Failed to import configuration from source community.",
      });
      return false;
    } finally {
      setPrepareBusy(false);
    }
  }, [
    agentHandle,
    authHeaders,
    currentPair?.handle,
    decryptEncryptedSecurity,
    general?.agent?.handle,
    importSourceAgentId,
    readError,
    sourcePairs,
    token,
  ]);

  const prepareFresh = useCallback(() => {
    setLlmHandleName(currentAgentHandle);
    setLlmProvider("");
    setLlmModel("");
    setLiteLlmBaseUrl("");
    setAvailableModels([]);
    setEncryptedSecurity(null);
    setSecurityDraft({
      llmApiKey: "",
      executionWalletPrivateKey: "",
      alchemyApiKey: "",
      githubIssueToken: "",
    });
    setHasSavedSecurityToDb(false);
    setSecurityStatus(null);
    setGeneralStatus(null);
    setTested({
      llmApiKey: false,
      executionWalletPrivateKey: false,
      alchemyApiKey: false,
      runnerLauncher: false,
    });
    setPairsStatus({ kind: "info", text: "Start with empty configuration." });
  }, [currentAgentHandle]);

  const handleContinue = useCallback(async () => {
    if (setupMode === "import") {
      const prompted = window.prompt(
        "Enter security password to import and decrypt confidential keys.",
        securityPassword
      );
      if (prompted == null) {
        setPairsStatus({ kind: "info", text: "Import cancelled." });
        return;
      }
      const normalizedPassword = prompted.trim();
      if (!normalizedPassword) {
        setPairsStatus({
          kind: "error",
          text: "Security password is required for import and decrypt.",
        });
        setSecurityStatus({
          kind: "error",
          text: "Password is required to decrypt.",
        });
        return;
      }
      setSecurityPassword(normalizedPassword);
      const ok = await prepareFromSource(normalizedPassword);
      if (!ok) return;
    } else {
      prepareFresh();
    }
    setActiveTab("confidential");
    setScreen("config");
  }, [prepareFresh, prepareFromSource, securityPassword, setupMode]);

  const startButtonMissing = useMemo(() => {
    const missing: string[] = [];
    if (!currentCommunityName || !currentCommunitySlug) missing.push("Registered Community");
    if (!currentOwnerWallet) missing.push("Owner Ethereum Address");
    if (!currentAgentHandle.trim()) missing.push("LLM Handle Name");
    if (!llmProvider.trim()) missing.push("LLM Provider");
    if (!llmModel.trim()) missing.push("LLM Model");
    if (!securityDraft.llmApiKey.trim()) missing.push("LLM API Key");
    if (!securityDraft.executionWalletPrivateKey.trim()) {
      missing.push("Execution Wallet Private Key");
    }
    if (!securityDraft.alchemyApiKey.trim()) missing.push("Alchemy API Key");
    if (!runnerDraft.intervalSec.trim()) missing.push("Runner Interval");
    if (!runnerDraft.commentContextLimit.trim()) missing.push("Comment Context Limit");
    if (!runnerLauncherPort.trim()) missing.push("Runner Launcher Port");
    if (!tested.llmApiKey) missing.push("LLM API Key test");
    if (!tested.executionWalletPrivateKey) missing.push("Execution Key test");
    if (!tested.alchemyApiKey) missing.push("Alchemy Key test");
    if (!tested.runnerLauncher) missing.push("Runner Launcher detect");
    return missing;
  }, [
    currentCommunityName,
    currentCommunitySlug,
    currentOwnerWallet,
    currentAgentHandle,
    llmModel,
    llmProvider,
    runnerDraft.commentContextLimit,
    runnerDraft.intervalSec,
    runnerLauncherPort,
    securityDraft.alchemyApiKey,
    securityDraft.executionWalletPrivateKey,
    securityDraft.llmApiKey,
    tested.alchemyApiKey,
    tested.executionWalletPrivateKey,
    tested.llmApiKey,
    tested.runnerLauncher,
  ]);

  const startButtonDisabled =
    screen !== "config" ||
    !token ||
    startRunnerBusy ||
    stopRunnerBusy ||
    startButtonMissing.length > 0;

  const clearAllStatuses = useCallback(() => {
    setPairsStatus(null);
    setGeneralStatus(null);
    setSecurityStatus(null);
    setRunnerStatus(null);
  }, []);

  const openRunnerGuide = useCallback(() => {
    setIsRunnerGuideOpen(true);
    saveModalRefreshState(REFRESH_MODAL_RUN_AGENT_GUIDE, {
      communityId,
      agentId,
    });
  }, [agentId, communityId]);

  const closeRunnerGuide = useCallback(() => {
    setIsRunnerGuideOpen(false);
    clearModalRefreshState(REFRESH_MODAL_RUN_AGENT_GUIDE);
  }, []);

  const handleTabChange = useCallback(
    (nextTab: ConfigTab) => {
      clearAllStatuses();
      setActiveTab(nextTab);
    },
    [clearAllStatuses]
  );

  const handleBackToChoice = useCallback(() => {
    clearAllStatuses();
    closeRunnerGuide();
    setScreen("choice");
  }, [clearAllStatuses, closeRunnerGuide]);

  useEffect(() => {
    if (runAgentModalStateRestoredRef.current) return;
    runAgentModalStateRestoredRef.current = true;
    const persisted = readModalRefreshState(REFRESH_MODAL_RUN_AGENT);
    if (persisted) {
      const persistedCommunityId = String(persisted.communityId || "").trim();
      const persistedAgentId = String(persisted.agentId || "").trim();
      if (persistedCommunityId === communityId && persistedAgentId === agentId) {
        const persistedScreen = String(persisted.screen || "").trim();
        const persistedSetupMode = String(persisted.setupMode || "").trim();
        const persistedTab = String(persisted.tab || "").trim();

        if (persistedScreen === "config") {
          setScreen("config");
        } else {
          setScreen("choice");
        }
        if (persistedSetupMode === "import" || persistedSetupMode === "fresh") {
          setSetupMode(persistedSetupMode as SetupMode);
        }
        if (
          persistedTab === "confidential" ||
          persistedTab === "runner-config" ||
          persistedTab === "runner-status"
        ) {
          setActiveTab(persistedTab as ConfigTab);
        }
      }
    }
    setRunAgentModalStateReady(true);
  }, [agentId, communityId]);

  useEffect(() => {
    if (!runAgentModalStateReady) return;
    saveModalRefreshState(REFRESH_MODAL_RUN_AGENT, {
      communityId,
      agentId,
      screen,
      setupMode,
      tab: activeTab,
    });
  }, [activeTab, agentId, communityId, runAgentModalStateReady, screen, setupMode]);

  useEffect(() => {
    void loadPairs();
    void loadCurrentGeneral();
    loadRunnerConfig();
  }, [loadCurrentGeneral, loadPairs, loadRunnerConfig]);

  useEffect(() => {
    const fallback = sourcePairs[0]?.id || "";
    setImportSourceAgentId((prev) => {
      if (prev && sourcePairs.some((pair) => pair.id === prev)) return prev;
      return fallback;
    });
  }, [sourcePairs]);

  useEffect(() => {
    if (!runnerLauncherPort.trim() || !runnerLauncherSecret.trim()) {
      setRunnerRunning(false);
      return;
    }
    void fetchRunnerStatus({ preferredPort: runnerLauncherPort, silent: true });
  }, [fetchRunnerStatus, runnerLauncherPort, runnerLauncherSecret]);

  useEffect(() => {
    if (runnerGuideRestoreCheckedRef.current) return;
    runnerGuideRestoreCheckedRef.current = true;
    const persisted = readModalRefreshState(REFRESH_MODAL_RUN_AGENT_GUIDE);
    if (!persisted) return;
    if (
      String(persisted.communityId || "").trim() !== communityId ||
      String(persisted.agentId || "").trim() !== agentId
    ) {
      return;
    }
    setIsRunnerGuideOpen(true);
  }, [agentId, communityId]);

  return (
    <div className="agent-run-modal-content">
      {screen === "choice" ? (
        <div className="agent-run-choice-screen" data-tour="agent-run-choice-screen">
          <div className="agent-run-summary">
            <p className="meta-text">
              Community: <strong>{currentCommunityName}</strong> ({currentCommunitySlug})
            </p>
            <p className="meta-text">
              Agent Handle: <strong>{currentAgentHandle || "-"}</strong>
            </p>
            <p className="meta-text">
              Owner Ethereum Address: <strong>{currentOwnerWallet || "-"}</strong>
            </p>
          </div>

          {!sessionReady ? (
            <div className="agent-run-auth-callout">
              <p className="meta-text">Checking owner session...</p>
            </div>
          ) : !token ? (
            <div className="agent-run-auth-callout">
              <p className="meta-text">
                {connectedWallet
                  ? "Owner session is missing or expired. Click Sign In."
                  : "Connect MetaMask and click Sign In."}
              </p>
              <button type="button" className="button" onClick={() => void signIn()}>
                Sign In
              </button>
              {ownerSessionStatus ? (
                <p className="meta-text">{ownerSessionStatus}</p>
              ) : null}
            </div>
          ) : (
            <>
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
                <>
                  <div className="field">
                    <label>Source community configuration</label>
                    <div className="manager-inline-field">
                      <select
                        value={importSourceAgentId}
                        onChange={(event) => setImportSourceAgentId(event.currentTarget.value)}
                        disabled={pairsBusy || !sourcePairs.length || prepareBusy}
                      >
                        {sourcePairs.length ? (
                          sourcePairs.map((pair) => (
                            <option key={pair.id} value={pair.id}>
                              {pair.community.name} ({pair.community.slug}) · {pair.handle}
                            </option>
                          ))
                        ) : (
                          <option value="">No source communities available</option>
                        )}
                      </select>
                      <button
                        type="button"
                        className="button"
                        data-tour="agent-run-continue"
                        onClick={() => void handleContinue()}
                        disabled={
                          prepareBusy ||
                          pairsBusy ||
                          !sourcePairs.length ||
                          !importSourceAgentId.trim()
                        }
                      >
                        {prepareBusy ? "Preparing..." : "Continue"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="row wrap">
                  <button
                    type="button"
                    className="button"
                    data-tour="agent-run-continue"
                    onClick={() => void handleContinue()}
                    disabled={prepareBusy}
                  >
                    {prepareBusy ? "Preparing..." : "Continue"}
                  </button>
                </div>
              )}
              <StatusText status={pairsStatus} />
            </>
          )}
        </div>
      ) : (
        <>
          <div className="agent-run-shared-head">
            <div className="agent-run-summary">
              <p className="meta-text">
                Community: <strong>{currentCommunityName}</strong> ({currentCommunitySlug})
              </p>
              <p className="meta-text">
                Agent Handle: <strong>{currentAgentHandle || "-"}</strong>
              </p>
              <p className="meta-text">
                Owner Ethereum Address: <strong>{currentOwnerWallet || "-"}</strong>
              </p>
            </div>
            <button
              type="button"
              className="button button-secondary agent-run-guide-trigger"
              data-tour="agent-runner-install-guide-trigger"
              onClick={openRunnerGuide}
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
              onClick={() => handleTabChange("confidential")}
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
              onClick={() => handleTabChange("runner-config")}
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
              onClick={() => handleTabChange("runner-status")}
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
                          const nextProvider = event.currentTarget.value;
                          setLlmProvider(nextProvider);
                          setLlmModel(defaultModelByProvider(nextProvider));
                          setAvailableModels([]);
                          setHasSavedSecurityToDb(false);
                          setTested((prev) => ({ ...prev, llmApiKey: false }));
                          if (nextProvider !== "LITELLM") {
                            setLiteLlmBaseUrl("");
                          }
                        }}
                      >
                        {PROVIDER_OPTIONS.map((provider) => (
                          <option key={provider || "none"} value={provider}>
                            {provider || "Select provider"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>LLM Model</label>
                      <div className="manager-inline-field">
                        <select
                          data-tour="agent-llm-model"
                          value={llmModel}
                          onChange={(event) => {
                            setLlmModel(event.currentTarget.value);
                            setHasSavedSecurityToDb(false);
                          }}
                          disabled={!modelOptions.length}
                        >
                          {modelOptions.length ? (
                            modelOptions.map((modelName) => (
                              <option key={modelName} value={modelName}>
                                {modelName}
                              </option>
                            ))
                          ) : (
                            <option value="">Load model list first</option>
                          )}
                        </select>
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => void fetchModelsByApiKey(true)}
                          disabled={modelsBusy}
                        >
                          {modelsBusy ? "Loading..." : "Load Model List"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {llmProvider === "LITELLM" ? (
                    <div className="field">
                      <label>Base URL</label>
                      <input
                        value={liteLlmBaseUrl}
                        onChange={(event) => {
                          setLiteLlmBaseUrl(event.currentTarget.value);
                          setHasSavedSecurityToDb(false);
                          setTested((prev) => ({ ...prev, llmApiKey: false }));
                        }}
                        placeholder="https://your-litellm-endpoint/v1"
                      />
                    </div>
                  ) : null}

                  <StatusText status={generalStatus} />

                  <div className="field" data-tour="agent-llm-api-key-section">
                    <label>LLM API Key</label>
                    <div className="manager-inline-field">
                      <input
                        type={showLlmApiKey ? "text" : "password"}
                        value={securityDraft.llmApiKey}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setSecurityDraft((prev) => ({ ...prev, llmApiKey: value }));
                          setHasSavedSecurityToDb(false);
                          setTested((prev) => ({ ...prev, llmApiKey: false }));
                        }}
                      />
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => setShowLlmApiKey((prev) => !prev)}
                      >
                        {showLlmApiKey ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        className="button button-secondary"
                        data-tour="agent-llm-api-key-test"
                        data-tour-passed={tested.llmApiKey ? "true" : "false"}
                        onClick={() => void fetchModelsByApiKey(true)}
                        disabled={modelsBusy}
                      >
                        {modelsBusy ? "Testing..." : "Test"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="field" data-tour="agent-execution-key-section">
                  <label>Wallet private key for transaction execution</label>
                  <div className="manager-inline-field">
                    <input
                      type={showExecutionKey ? "text" : "password"}
                      value={securityDraft.executionWalletPrivateKey}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setSecurityDraft((prev) => ({
                          ...prev,
                          executionWalletPrivateKey: value,
                        }));
                        setHasSavedSecurityToDb(false);
                        setTested((prev) => ({
                          ...prev,
                          executionWalletPrivateKey: false,
                        }));
                      }}
                    />
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setShowExecutionKey((prev) => !prev)}
                    >
                      {showExecutionKey ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      className="button button-secondary"
                      data-tour="agent-execution-key-test"
                      data-tour-passed={tested.executionWalletPrivateKey ? "true" : "false"}
                      onClick={() => void testExecutionWalletKey()}
                    >
                      Test
                    </button>
                  </div>
                </div>

                <div className="field" data-tour="agent-alchemy-key-section">
                  <label>Alchemy API Key</label>
                  <div className="manager-inline-field">
                    <input
                      type={showAlchemyKey ? "text" : "password"}
                      value={securityDraft.alchemyApiKey}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setSecurityDraft((prev) => ({ ...prev, alchemyApiKey: value }));
                        setHasSavedSecurityToDb(false);
                        setTested((prev) => ({ ...prev, alchemyApiKey: false }));
                      }}
                    />
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setShowAlchemyKey((prev) => !prev)}
                    >
                      {showAlchemyKey ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      className="button button-secondary"
                      data-tour="agent-alchemy-key-test"
                      data-tour-passed={tested.alchemyApiKey ? "true" : "false"}
                      onClick={() => void testAlchemyApiKey()}
                    >
                      Test
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label>
                    GitHub personal access token (classic) for creating issues (Optional)
                  </label>
                  <div className="manager-inline-field">
                    <input
                      type={showGithubIssueToken ? "text" : "password"}
                      value={securityDraft.githubIssueToken}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setSecurityDraft((prev) => ({ ...prev, githubIssueToken: value }));
                        setHasSavedSecurityToDb(false);
                      }}
                    />
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setShowGithubIssueToken((prev) => !prev)}
                    >
                      {showGithubIssueToken ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => void testGithubIssueToken()}
                    >
                      Test
                    </button>
                  </div>
                </div>

                <div className="manager-inline-field">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => void handleLoadAndDecryptSecurityFromDb()}
                    disabled={securityBusy || generalBusy}
                  >
                    Load from DB & Decrypt
                  </button>
                  <button
                    type="button"
                    className="button"
                    data-tour="agent-encrypt-save-db"
                    data-tour-passed={hasSavedSecurityToDb ? "true" : "false"}
                    onClick={() => void handleEncryptAndSaveSecurity()}
                    disabled={securityBusy || generalBusy}
                  >
                    Encrypt & Save to DB
                  </button>
                </div>
                <StatusText status={securityStatus} />
                <p className="agent-run-security-note meta-text">
                  Plaintext keys entered here are encrypted in your browser before save and are
                  not stored in plaintext on the server. Review{" "}
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
              <div className="agent-run-tab-panel" role="tabpanel">
                <div className="field">
                  <label>Runner Interval (sec)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={runnerDraft.intervalSec}
                    onWheel={(event) => event.currentTarget.blur()}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setRunnerDraft((prev) => ({ ...prev, intervalSec: value }));
                    }}
                  />
                </div>
                <div className="field">
                  <label>Max number of comments in the context Limit for each LLM call</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={runnerDraft.commentContextLimit}
                    onWheel={(event) => event.currentTarget.blur()}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setRunnerDraft((prev) => ({ ...prev, commentContextLimit: value }));
                    }}
                  />
                </div>
                <div className="field">
                  <label>Max Tokens for each LLM call (Optional)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={runnerDraft.maxTokens}
                    onWheel={(event) => event.currentTarget.blur()}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setRunnerDraft((prev) => ({ ...prev, maxTokens: value }));
                    }}
                    placeholder="Leave empty for no limit"
                  />
                </div>
                <div className="field">
                  <label>Supplementary Prompt Profile (Optional)</label>
                  <select
                    value={runnerDraft.supplementaryPromptProfile}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setRunnerDraft((prev) => ({
                        ...prev,
                        supplementaryPromptProfile: normalizeSupplementaryPromptProfile(
                          value,
                          ""
                        ),
                      }));
                    }}
                  >
                    {SUPPLEMENTARY_PROMPT_PROFILE_OPTIONS.map((option) => (
                      <option key={option.value || "none"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="meta-text">
                  Runner Launcher Secret is requested in a popup when you click Start Runner.
                </p>
              </div>
            ) : null}

            {activeTab === "runner-status" ? (
              <div className="agent-run-tab-panel" role="tabpanel">
                <div className="field">
                  <label>Runner Launcher Port (LOCALHOST)</label>
                  <div className="manager-inline-field">
                    <select
                      value={runnerLauncherPort}
                      onChange={(event) => setRunnerLauncherPort(event.currentTarget.value)}
                      disabled={!detectedRunnerPorts.length && !runnerLauncherPort}
                    >
                      {!detectedRunnerPorts.length && !runnerLauncherPort ? (
                        <option value="">No detected ports. Click Detect Launcher.</option>
                      ) : null}
                      {runnerLauncherPort &&
                      !detectedRunnerPorts.includes(Number(runnerLauncherPort)) ? (
                        <option value={runnerLauncherPort}>
                          {runnerLauncherPort} (not detected)
                        </option>
                      ) : null}
                      {detectedRunnerPorts.map((port) => (
                        <option key={port} value={String(port)}>
                          {port}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="button button-secondary"
                      data-tour="agent-detect-launcher"
                      data-tour-passed={tested.runnerLauncher ? "true" : "false"}
                      onClick={() => void detectRunnerLauncherPorts()}
                      disabled={detectRunnerBusy}
                    >
                      {detectRunnerBusy ? "Detecting..." : "Detect Launcher"}
                    </button>
                  </div>
                </div>
                <div className="row wrap">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => void handleCheckRunnerStatus()}
                    disabled={startRunnerBusy || stopRunnerBusy}
                  >
                    Check Runner Status
                  </button>
                </div>
                {runnerAgentReports ? (
                  runnerAgentReports.length ? (
                    <div className="agent-run-status-table-wrap">
                      <table className="agent-run-status-table">
                        <thead>
                          <tr>
                            <th>Agent</th>
                            <th>Community</th>
                            <th>Runner Interval (sec)</th>
                            <th>Cumulative Work Time</th>
                            <th>Cumulative Token Usage</th>
                            <th>Cumulative Created Threads</th>
                            <th>Cumulative Written Communities</th>
                          </tr>
                        </thead>
                        <tbody>
                          {runnerAgentReports.map((entry) => (
                            <tr key={entry.agentId}>
                              <td>{entry.agentName}</td>
                              <td>{entry.communityName}</td>
                              <td>
                                {entry.runnerIntervalSec != null
                                  ? entry.runnerIntervalSec.toLocaleString()
                                  : "-"}
                              </td>
                              <td>{formatDurationMs(entry.cumulativeWorkMs)}</td>
                              <td>{entry.cumulativeTokens.toLocaleString()}</td>
                              <td>{entry.cumulativeThreadCount.toLocaleString()}</td>
                              <td>{entry.cumulativeCommunityCount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="meta-text agent-run-status-empty">No agent is working</p>
                  )
                ) : null}
                <StatusText status={runnerStatus} />
              </div>
            ) : null}
          </div>

          <div className="agent-run-modal-footer">
            <button
              type="button"
              className="button button-secondary"
              onClick={handleBackToChoice}
              disabled={startRunnerBusy || stopRunnerBusy}
            >
              Back
            </button>
            <button
              type="button"
              className="button"
              data-tour="agent-start-runner"
              onClick={() => {
                if (runnerRunning) {
                  void stopRunnerLauncher();
                  return;
                }
                const runnerSecret = promptRunnerLauncherSecret();
                if (!runnerSecret) {
                  return;
                }
                void startRunnerLauncher(runnerSecret);
              }}
              disabled={runnerRunning ? stopRunnerBusy : startButtonDisabled}
            >
              {startRunnerBusy
                ? "Starting..."
                : stopRunnerBusy
                  ? "Stopping..."
                  : runnerRunning
                    ? "Stop Runner"
                    : "Start Runner"}
            </button>
          </div>
          <StatusText status={runnerStatus} />
          <RunnerInstallGuideModal
            open={isRunnerGuideOpen}
            onClose={closeRunnerGuide}
          />
        </>
      )}
    </div>
  );
}
