import { prisma } from "src/db";

const TEXT_LIMIT_POLICY_KEY = "SNS_TEXT_LIMITS";
const CACHE_TTL_MS = 15 * 1000;

export type DosTextLimits = {
  community: {
    name: number;
    description: number;
    githubRepositoryUrl: number;
    confirmName: number;
  };
  serviceContract: {
    name: number;
    address: number;
    chain: number;
  };
  thread: {
    title: number;
    body: number;
  };
  comment: {
    body: number;
  };
  agent: {
    handle: number;
    llmProvider: number;
    llmModel: number;
    llmBaseUrl: number;
  };
  ids: {
    communityId: number;
    contractId: number;
  };
};

type TextLimitEntry = {
  field: string;
  value: string;
  max: number;
};

type CachedLimits = {
  expiresAt: number;
  updatedAtMs: number;
  limits: DosTextLimits;
};

let cachedLimits: CachedLimits | null = null;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asPositiveInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return null;
  }
  if (value <= 0 || value > 200000) {
    return null;
  }
  return value;
}

function readPositiveInt(
  record: Record<string, unknown>,
  key: string
): number | null {
  return asPositiveInt(record[key]);
}

function parseDosTextLimits(value: unknown): DosTextLimits | null {
  const root = asRecord(value);
  if (!root) return null;

  const community = asRecord(root.community);
  const serviceContract = asRecord(root.serviceContract);
  const thread = asRecord(root.thread);
  const comment = asRecord(root.comment);
  const agent = asRecord(root.agent);
  const ids = asRecord(root.ids);

  if (!community || !serviceContract || !thread || !comment || !agent || !ids) {
    return null;
  }

  const limits: DosTextLimits = {
    community: {
      name: readPositiveInt(community, "name") || 0,
      description: readPositiveInt(community, "description") || 0,
      githubRepositoryUrl: readPositiveInt(community, "githubRepositoryUrl") || 0,
      confirmName: readPositiveInt(community, "confirmName") || 0,
    },
    serviceContract: {
      name: readPositiveInt(serviceContract, "name") || 0,
      address: readPositiveInt(serviceContract, "address") || 0,
      chain: readPositiveInt(serviceContract, "chain") || 0,
    },
    thread: {
      title: readPositiveInt(thread, "title") || 0,
      body: readPositiveInt(thread, "body") || 0,
    },
    comment: {
      body: readPositiveInt(comment, "body") || 0,
    },
    agent: {
      handle: readPositiveInt(agent, "handle") || 0,
      llmProvider: readPositiveInt(agent, "llmProvider") || 0,
      llmModel: readPositiveInt(agent, "llmModel") || 0,
      llmBaseUrl: readPositiveInt(agent, "llmBaseUrl") || 0,
    },
    ids: {
      communityId: readPositiveInt(ids, "communityId") || 0,
      contractId: readPositiveInt(ids, "contractId") || 0,
    },
  };

  const allValues = [
    limits.community.name,
    limits.community.description,
    limits.community.githubRepositoryUrl,
    limits.community.confirmName,
    limits.serviceContract.name,
    limits.serviceContract.address,
    limits.serviceContract.chain,
    limits.thread.title,
    limits.thread.body,
    limits.comment.body,
    limits.agent.handle,
    limits.agent.llmProvider,
    limits.agent.llmModel,
    limits.agent.llmBaseUrl,
    limits.ids.communityId,
    limits.ids.contractId,
  ];

  if (allValues.some((item) => item <= 0)) {
    return null;
  }

  return limits;
}

export async function getDosTextLimits(): Promise<DosTextLimits> {
  const now = Date.now();
  if (cachedLimits && cachedLimits.expiresAt > now) {
    return cachedLimits.limits;
  }

  const policy = await prisma.policySetting.findUnique({
    where: { key: TEXT_LIMIT_POLICY_KEY },
    select: {
      value: true,
      updatedAt: true,
    },
  });

  if (!policy) {
    throw new Error("Text limit policy is not configured.");
  }

  const parsed = parseDosTextLimits(policy.value);
  if (!parsed) {
    throw new Error("Text limit policy is invalid.");
  }

  const updatedAtMs = policy.updatedAt.getTime();
  if (
    cachedLimits &&
    cachedLimits.updatedAtMs === updatedAtMs &&
    cachedLimits.expiresAt > now
  ) {
    return cachedLimits.limits;
  }

  cachedLimits = {
    limits: parsed,
    updatedAtMs,
    expiresAt: now + CACHE_TTL_MS,
  };

  return parsed;
}

export function firstTextLimitError(entries: TextLimitEntry[]) {
  for (const entry of entries) {
    if (entry.value.length > entry.max) {
      return `${entry.field} must be ${entry.max} characters or fewer`;
    }
  }
  return null;
}
