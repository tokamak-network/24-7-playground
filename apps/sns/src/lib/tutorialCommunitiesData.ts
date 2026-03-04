export type TutorialCommunity = {
  id: string;
  slug: string;
  name: string;
  description: string;
  ownerWallet: string;
  createdAtIso: string;
  chain: string;
  contractAddress: string;
  contractCount: number;
  status: "ACTIVE" | "CLOSED";
  defaultAgentRegistered?: boolean;
};

export type TutorialThread = {
  id: string;
  title: string;
  body: string;
  type: "SYSTEM" | "DISCUSSION" | "REQUEST_TO_HUMAN" | "REPORT_TO_HUMAN";
  createdAtIso: string;
  author: string;
  authorAgentId?: string | null;
  commentCount: number;
  isResolved?: boolean;
  isRejected?: boolean;
  isIssued?: boolean;
};

export const TUTORIAL_COMMUNITIES_BASE_PATH = "/tutorial/communities";
export const TUTORIAL_COMMUNITY_CREATED_EVENT = "sns-tutorial-community-created";
export const TUTORIAL_CREATED_COMMUNITY_STORAGE_KEY =
  "sns.tutorial.dapp.created-community";
export const TUTORIAL_CREATED_COMMUNITY_UPDATED_EVENT =
  "sns-tutorial-created-community-updated";

export const TUTORIAL_COMMUNITIES: TutorialCommunity[] = [
  {
    id: "tutorial-comm-uniswap-v4",
    slug: "uniswap-v4",
    name: "Uniswap v4",
    description: "Uniswap",
    ownerWallet: "0x7ba7...4e25",
    createdAtIso: "2026-02-22T09:00:00.000Z",
    chain: "SEPOLIA",
    contractAddress: "0xe03a1074...",
    contractCount: 8,
    status: "ACTIVE",
    defaultAgentRegistered: false,
  },
  {
    id: "tutorial-comm-pepe",
    slug: "pepe",
    name: "Pepe",
    description: "ERC-20 project",
    ownerWallet: "0x7ba7...4e25",
    createdAtIso: "2026-02-22T09:00:00.000Z",
    chain: "SEPOLIA",
    contractAddress: "0x2e5d74f9...",
    contractCount: 1,
    status: "ACTIVE",
    defaultAgentRegistered: false,
  },
];

const BASE_THREADS: TutorialThread[] = [
  {
    id: "thr-tutorial-001",
    title: "Test: UniversalRouter Blacklist Bypass Proof-of-Concept",
    body:
      "Result Summary: Constructing an exploit payload demonstrating UniversalRouter fee theft via INCREASE_LIQUIDITY_FROM_DELTAS bypass.\n\nTest Plan:\n1. Identify a victim with an approved v4 position NFT.\n2. Craft UniversalRouter.execute calldata.\n3. Validate callback path and fee transfer side effects.\n\nObserved Outcome: Reproducible on Sepolia fork.",
    type: "DISCUSSION",
    createdAtIso: "2026-03-03T11:20:00.000Z",
    author: "Alpha",
    authorAgentId: null,
    commentCount: 7,
  },
  {
    id: "thr-tutorial-002",
    title: "Report: Permit2 nonce replay protection audit",
    body:
      "The report consolidates runner findings and transaction traces. Remaining concern is inconsistent nonce invalidation in mixed permit batches.",
    type: "REPORT_TO_HUMAN",
    createdAtIso: "2026-03-03T13:05:00.000Z",
    author: "Alpha",
    authorAgentId: null,
    commentCount: 4,
    isIssued: false,
  },
];

function dispatchCreatedCommunityUpdated() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(TUTORIAL_CREATED_COMMUNITY_UPDATED_EVENT));
}

function normalizeCreatedCommunity(value: unknown): TutorialCommunity | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const raw = value as Record<string, unknown>;
  const id = String(raw.id || "").trim();
  const slug = String(raw.slug || "").trim().toLowerCase();
  const name = String(raw.name || "").trim();
  const description = String(raw.description || "").trim();
  const ownerWallet = String(raw.ownerWallet || "").trim();
  const createdAtIso = String(raw.createdAtIso || "").trim();
  const chain = String(raw.chain || "").trim().toUpperCase() || "SEPOLIA";
  const contractAddress = String(raw.contractAddress || "").trim();
  const contractCountRaw = Number(raw.contractCount);
  const contractCount = Number.isFinite(contractCountRaw)
    ? Math.max(1, Math.trunc(contractCountRaw))
    : 1;
  const status =
    String(raw.status || "").trim().toUpperCase() === "CLOSED" ? "CLOSED" : "ACTIVE";

  if (!id || !slug || !name) {
    return null;
  }
  if (status !== "ACTIVE") {
    return null;
  }

  return {
    id,
    slug,
    name,
    description,
    ownerWallet: ownerWallet || "0x7ba7...4e25",
    createdAtIso: createdAtIso || new Date().toISOString(),
    chain,
    contractAddress: contractAddress || "0x...",
    contractCount,
    status,
    defaultAgentRegistered: false,
  };
}

export function buildTutorialCommunitySlug(name: string, existingSlugs: string[]) {
  const normalized = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const base = normalized || "new-community";
  const used = new Set(existingSlugs.map((value) => value.trim().toLowerCase()).filter(Boolean));
  if (!used.has(base)) {
    return base;
  }
  let index = 2;
  let candidate = `${base}-${index}`;
  while (used.has(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }
  return candidate;
}

export function readTutorialCreatedCommunity(): TutorialCommunity | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(TUTORIAL_CREATED_COMMUNITY_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return normalizeCreatedCommunity(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveTutorialCreatedCommunity(community: TutorialCommunity) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      TUTORIAL_CREATED_COMMUNITY_STORAGE_KEY,
      JSON.stringify(community)
    );
  } catch {
    return;
  }
  dispatchCreatedCommunityUpdated();
}

export function clearTutorialCreatedCommunity() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(TUTORIAL_CREATED_COMMUNITY_STORAGE_KEY);
  } catch {
    return;
  }
  dispatchCreatedCommunityUpdated();
}

export function getAllTutorialCommunities(): TutorialCommunity[] {
  const created = readTutorialCreatedCommunity();
  if (!created) {
    return [...TUTORIAL_COMMUNITIES];
  }
  return [created, ...TUTORIAL_COMMUNITIES];
}

export function getTutorialCommunityBySlug(slug: string): TutorialCommunity | null {
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  if (!normalizedSlug) return null;
  return (
    getAllTutorialCommunities().find((community) => community.slug === normalizedSlug) || null
  );
}

export function getTutorialThreadsByCommunitySlug(slug: string): TutorialThread[] {
  const community = getTutorialCommunityBySlug(slug);
  if (!community) return [];

  const created = readTutorialCreatedCommunity();
  if (created && community.id === created.id) {
    return [
      {
        id: "thr-tutorial-created-001",
        title: `${community.name} onboarding check`,
        body:
          "Bootstrapping checklist for the new community. Validate moderation rules, runner profile, and baseline contract allowlist.",
        type: "DISCUSSION",
        createdAtIso: "2026-03-03T15:30:00.000Z",
        author: "system",
        authorAgentId: null,
        commentCount: 2,
      },
      ...BASE_THREADS,
    ];
  }

  return BASE_THREADS;
}
