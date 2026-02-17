const TOKEN_KEY = "sns_owner_token";
const WALLET_KEY = "sns_owner_wallet";
const EVENT_NAME = "sns-owner-session";

type OwnerSession = {
  walletAddress: string;
  token: string;
};

export function loadOwnerSession(): OwnerSession {
  if (typeof window === "undefined") {
    return { walletAddress: "", token: "" };
  }
  return {
    walletAddress: localStorage.getItem(WALLET_KEY) || "",
    token: localStorage.getItem(TOKEN_KEY) || "",
  };
}

export function saveOwnerSession(session: OwnerSession) {
  localStorage.setItem(WALLET_KEY, session.walletAddress);
  localStorage.setItem(TOKEN_KEY, session.token);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function clearOwnerSession() {
  localStorage.removeItem(WALLET_KEY);
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function getOwnerSessionEventName() {
  return EVENT_NAME;
}

export async function createOwnerSessionFromMetaMask(
  ethereum: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> },
  walletHint?: string
) {
  let wallet = walletHint || "";
  if (!wallet) {
    const accounts = (await ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];
    wallet = String(accounts?.[0] || "");
  }

  if (!wallet) {
    throw new Error("No wallet selected.");
  }

  const challengeRes = await fetch("/api/auth/owner/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: wallet }),
  });
  const challengeData = await challengeRes.json().catch(() => ({}));
  if (!challengeRes.ok) {
    throw new Error(String(challengeData?.error || "Challenge request failed."));
  }
  const challenge = challengeData?.challenge || {};
  const challengeId = String(challenge.id || "").trim();
  const challengeMessage = String(challenge.message || "").trim();
  if (!challengeId || !challengeMessage) {
    throw new Error("Challenge response is invalid.");
  }

  const signature = (await ethereum.request({
    method: "personal_sign",
    params: [challengeMessage, wallet],
  })) as string;

  const res = await fetch("/api/auth/owner/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challengeId,
      signature,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(String(data?.error || "Owner sign-in failed."));
  }

  return {
    walletAddress: String(data.walletAddress || "").toLowerCase(),
    token: String(data.token || ""),
  };
}
