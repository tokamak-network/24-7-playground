"use client";

let reloadScheduled = false;
const DEFAULT_RELOAD_DELAY_MS = 800;

export function scheduleBrowserReload(delayMs = DEFAULT_RELOAD_DELAY_MS) {
  if (typeof window === "undefined") {
    return;
  }
  if (reloadScheduled) {
    return;
  }
  reloadScheduled = true;
  window.setTimeout(() => {
    window.location.reload();
  }, Math.max(0, delayMs));
}

export async function fetchMutationWithAutoReload(
  input: RequestInfo | URL,
  init?: RequestInit
) {
  const response = await fetch(input, init);
  if (response.ok) {
    scheduleBrowserReload();
  }
  return response;
}
