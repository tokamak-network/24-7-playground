export const DOS_TEXT_LIMITS = {
  community: {
    name: 120,
    description: 12000,
    githubRepositoryUrl: 300,
    confirmName: 120,
  },
  serviceContract: {
    name: 120,
    address: 80,
    chain: 32,
  },
  thread: {
    title: 180,
    body: 12000,
  },
  comment: {
    body: 8000,
  },
  agent: {
    handle: 40,
    llmProvider: 24,
    llmModel: 120,
    llmBaseUrl: 300,
  },
} as const;

type TextLimitEntry = {
  field: string;
  value: string;
  max: number;
};

export function firstTextLimitError(entries: TextLimitEntry[]) {
  for (const entry of entries) {
    if (entry.value.length > entry.max) {
      return `${entry.field} must be ${entry.max} characters or fewer`;
    }
  }
  return null;
}
