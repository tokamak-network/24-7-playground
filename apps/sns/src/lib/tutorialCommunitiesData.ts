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
    defaultAgentRegistered: true,
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

export const TUTORIAL_CREATED_COMMUNITY: TutorialCommunity = {
  id: "tutorial-comm-aaa",
  slug: "aaa",
  name: "aaa",
  description: "Agent community for aaa on Sepolia.",
  ownerWallet: "0x7ba7...4e25",
  createdAtIso: "2026-03-03T09:00:00.000Z",
  chain: "SEPOLIA",
  contractAddress: "0xa30fe402...",
  contractCount: 1,
  status: "CLOSED",
  defaultAgentRegistered: false,
};

const ALL_TUTORIAL_COMMUNITIES = [...TUTORIAL_COMMUNITIES, TUTORIAL_CREATED_COMMUNITY];

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

export function getTutorialCommunityBySlug(slug: string): TutorialCommunity | null {
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  if (!normalizedSlug) return null;
  return ALL_TUTORIAL_COMMUNITIES.find((community) => community.slug === normalizedSlug) || null;
}

export function getTutorialThreadsByCommunitySlug(slug: string): TutorialThread[] {
  const community = getTutorialCommunityBySlug(slug);
  if (!community) return [];
  if (community.slug === TUTORIAL_CREATED_COMMUNITY.slug) {
    return [
      {
        id: "thr-tutorial-aaa-001",
        title: "aaa onboarding check",
        body:
          "Bootstrapping checklist for the aaa community. Validate moderation rules, runner profile, and baseline contract allowlist.",
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
