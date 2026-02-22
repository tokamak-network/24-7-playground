"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useOwnerSession } from "src/components/ownerSession";
import { validateAgentHandleFormat } from "src/lib/agentHandle";

type Props = {
  communityId: string;
  communitySlug: string;
  communityName: string;
  communityStatus: string;
};

export function CommunityAgentActionPanel({
  communityId,
  communitySlug,
  communityName,
  communityStatus,
}: Props) {
  const { connectedWallet } = useOwnerSession();
  const [registeredAgent, setRegisteredAgent] = useState<{
    id: string;
    handle: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const loadRegistration = useCallback(async () => {
    if (!connectedWallet) {
      setRegisteredAgent(null);
      setStatus("");
      return;
    }

    try {
      const response = await fetch(
        `/api/agents/lookup?walletAddress=${encodeURIComponent(connectedWallet)}`
      );
      if (!response.ok) {
        setRegisteredAgent(null);
        return;
      }

      const data = await response.json();
      const agents = Array.isArray(data?.agents) ? data.agents : [];
      const match = agents.find((entry: any) => {
        return String(entry?.agent?.communityId || "") === communityId;
      });
      if (!match) {
        setRegisteredAgent(null);
        return;
      }

      setRegisteredAgent({
        id: String(match.agent.id || ""),
        handle: String(match.agent.handle || ""),
      });
    } catch {
      setRegisteredAgent(null);
    }
  }, [communityId, connectedWallet]);

  useEffect(() => {
    void loadRegistration();
  }, [loadRegistration]);

  const readError = async (response: Response) => {
    const text = await response.text().catch(() => "");
    if (!text) return "Request failed.";
    try {
      const data = JSON.parse(text) as { error?: unknown };
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error;
      }
    } catch {
      // keep raw text
    }
    return text;
  };

  const signForCommunity = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      throw new Error("MetaMask not detected.");
    }
    if (!connectedWallet) {
      throw new Error("Connect MetaMask first.");
    }

    const message = `24-7-playground${communitySlug}`;
    return (await ethereum.request({
      method: "personal_sign",
      params: [message, connectedWallet],
    })) as string;
  };

  const register = async () => {
    const nextHandle = window.prompt("Enter your agent handle:", "")?.trim() || "";
    if (!nextHandle) {
      setStatus("Handle is required.");
      return;
    }
    const handleFormatError = validateAgentHandleFormat(nextHandle);
    if (handleFormatError) {
      setStatus(handleFormatError);
      return;
    }

    setBusy(true);
    setStatus("Registering handle...");
    try {
      const signature = await signForCommunity();
      const response = await fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: nextHandle,
          signature,
          communityId,
        }),
      });
      if (!response.ok) {
        setStatus(await readError(response));
        return;
      }
      const data = await response.json();
      await loadRegistration();
      setStatus(
        `Handle ${String(data?.agent?.handle || nextHandle)} is assigned to ${communityName}.`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  const unregister = async () => {
    setBusy(true);
    setStatus("Unregistering handle...");
    try {
      const signature = await signForCommunity();
      const response = await fetch("/api/agents/unregister", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature, communityId }),
      });
      if (!response.ok) {
        setStatus(await readError(response));
        return;
      }

      await loadRegistration();
      setStatus("The handle has been unregistered from this community.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unregister failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="community-agent-actions">
      {status ? <p className="status">{status}</p> : null}
      {registeredAgent ? (
        <div className="community-agent-actions-row">
          <Link className="button button-secondary button-block" href="/manage/agents/">
            Run My Agent
          </Link>
          <button
            type="button"
            className="button button-secondary button-danger button-block"
            onClick={() => void unregister()}
            disabled={busy}
          >
            {busy ? "Working..." : "Unregister My Agent"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="button button-secondary button-block"
          onClick={() => void register()}
          disabled={busy || communityStatus === "CLOSED"}
        >
          {busy ? "Working..." : "Register My Agent"}
        </button>
      )}
    </div>
  );
}
