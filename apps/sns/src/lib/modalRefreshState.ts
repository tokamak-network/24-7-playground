"use client";

type ModalPayload = Record<string, string>;

type ModalStoreEntry = {
  payload: ModalPayload;
  updatedAt: number;
};

type ModalStore = {
  path: string;
  entries: Record<string, ModalStoreEntry>;
};

const STORAGE_KEY = "sns.modal.refresh.v1";
const MAX_AGE_MS = 1000 * 60 * 60 * 6;

function currentPathname() {
  if (typeof window === "undefined") return "";
  return window.location.pathname;
}

function parseStore(raw: string | null): ModalStore | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ModalStore;
    if (!parsed || typeof parsed !== "object") return null;
    const path = typeof parsed.path === "string" ? parsed.path : "";
    const entries =
      parsed.entries && typeof parsed.entries === "object"
        ? (parsed.entries as Record<string, ModalStoreEntry>)
        : {};
    return { path, entries };
  } catch {
    return null;
  }
}

function readStore(): ModalStore | null {
  if (typeof window === "undefined") return null;
  return parseStore(window.sessionStorage.getItem(STORAGE_KEY));
}

function writeStore(store: ModalStore) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function saveModalRefreshState(modalId: string, payload?: ModalPayload) {
  if (typeof window === "undefined") return;
  const pathname = currentPathname();
  const previous = readStore();
  const next: ModalStore = {
    path: pathname,
    entries: pathname === previous?.path ? { ...(previous?.entries || {}) } : {},
  };
  next.entries[modalId] = {
    payload: payload || {},
    updatedAt: Date.now(),
  };
  writeStore(next);
}

export function readModalRefreshState(modalId: string): ModalPayload | null {
  const pathname = currentPathname();
  const store = readStore();
  if (!store || store.path !== pathname) return null;
  const entry = store.entries[modalId];
  if (!entry || typeof entry !== "object") return null;
  if (!Number.isFinite(entry.updatedAt) || Date.now() - entry.updatedAt > MAX_AGE_MS) {
    return null;
  }
  if (!entry.payload || typeof entry.payload !== "object") return {};
  const payload: ModalPayload = {};
  for (const [key, value] of Object.entries(entry.payload)) {
    if (typeof value === "string") {
      payload[key] = value;
    }
  }
  return payload;
}

export function clearModalRefreshState(modalId: string) {
  if (typeof window === "undefined") return;
  const pathname = currentPathname();
  const store = readStore();
  if (!store || store.path !== pathname) return;
  if (!store.entries[modalId]) return;
  const entries = { ...store.entries };
  delete entries[modalId];
  if (!Object.keys(entries).length) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  writeStore({ path: pathname, entries });
}
