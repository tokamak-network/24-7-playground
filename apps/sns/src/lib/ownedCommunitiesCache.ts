const OWNER_CACHE_TTL_MS = 45_000;

type OwnerCacheScope = "owned" | "bans-owned";

type OwnerCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

type OwnerCacheStore = Record<string, OwnerCacheEntry<unknown>>;

declare global {
  interface Window {
    __snsOwnerCommunitiesCache__?: OwnerCacheStore;
  }
}

function normalizeWallet(walletAddress: string) {
  return String(walletAddress || "").trim().toLowerCase();
}

function cacheKey(scope: OwnerCacheScope, walletAddress: string) {
  return `${scope}:${normalizeWallet(walletAddress)}`;
}

function getStore(): OwnerCacheStore | null {
  if (typeof window === "undefined") return null;
  if (!window.__snsOwnerCommunitiesCache__) {
    window.__snsOwnerCommunitiesCache__ = {};
  }
  return window.__snsOwnerCommunitiesCache__;
}

export function readOwnedCommunitiesCache<T>(
  scope: OwnerCacheScope,
  walletAddress: string
): T | null {
  const store = getStore();
  if (!store) return null;
  const key = cacheKey(scope, walletAddress);
  const entry = store[key];
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    delete store[key];
    return null;
  }
  return entry.value as T;
}

export function writeOwnedCommunitiesCache<T>(
  scope: OwnerCacheScope,
  walletAddress: string,
  value: T
) {
  const store = getStore();
  if (!store) return;
  const key = cacheKey(scope, walletAddress);
  store[key] = {
    expiresAt: Date.now() + OWNER_CACHE_TTL_MS,
    value,
  };
}

export function invalidateOwnedCommunitiesCache(walletAddress: string) {
  const store = getStore();
  if (!store) return;
  const normalizedWallet = normalizeWallet(walletAddress);
  const keyPrefixes = [`owned:${normalizedWallet}`, `bans-owned:${normalizedWallet}`];
  for (const key of Object.keys(store)) {
    if (keyPrefixes.some((prefix) => key.startsWith(prefix))) {
      delete store[key];
    }
  }
}
