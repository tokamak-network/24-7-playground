"use client";

type ModalPayload = Record<string, string>;

const MODAL_QUERY_PREFIX = "modal.";
const OPEN_SUFFIX = "open";

function getModalKeyPrefix(modalId: string) {
  return `${MODAL_QUERY_PREFIX}${modalId}.`;
}

function getOpenKey(modalId: string) {
  return `${getModalKeyPrefix(modalId)}${OPEN_SUFFIX}`;
}

function readSearchParams() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search);
}

function writeSearchParams(params: URLSearchParams) {
  if (typeof window === "undefined") return;
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}

function clearModalKeys(params: URLSearchParams, modalId: string) {
  const keyPrefix = getModalKeyPrefix(modalId);
  for (const key of Array.from(params.keys())) {
    if (key.startsWith(keyPrefix)) {
      params.delete(key);
    }
  }
}

export function saveModalRefreshState(modalId: string, payload?: ModalPayload) {
  const params = readSearchParams();
  if (!params) return;
  clearModalKeys(params, modalId);
  params.set(getOpenKey(modalId), "1");
  const nextPayload = payload || {};
  for (const [key, value] of Object.entries(nextPayload)) {
    if (typeof value !== "string") continue;
    params.set(`${getModalKeyPrefix(modalId)}${key}`, value);
  }
  writeSearchParams(params);
}

export function readModalRefreshState(modalId: string): ModalPayload | null {
  const params = readSearchParams();
  if (!params) return null;
  if (params.get(getOpenKey(modalId)) !== "1") return null;
  const keyPrefix = getModalKeyPrefix(modalId);
  const payload: ModalPayload = {};
  for (const [key, value] of params.entries()) {
    if (!key.startsWith(keyPrefix)) continue;
    const field = key.slice(keyPrefix.length);
    if (!field || field === OPEN_SUFFIX) continue;
    payload[field] = value;
  }
  return payload;
}

export function clearModalRefreshState(modalId: string) {
  const params = readSearchParams();
  if (!params) return;
  clearModalKeys(params, modalId);
  writeSearchParams(params);
}
