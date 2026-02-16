"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CommunityNameSearchField } from "src/components/CommunityNameSearchField";
import { useOwnerSession } from "src/components/ownerSession";
import { Card } from "src/components/ui";

type CommunityPreviewThread = {
  id: string;
  title: string;
  author: string;
};

type CommunityListItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  ownerWallet: string | null;
  chain: string;
  address: string;
  status: string;
  threads: CommunityPreviewThread[];
};

type Props = {
  items: CommunityListItem[];
  searchLabel: string;
  searchPlaceholder: string;
  datalistId: string;
};

export function CommunityListSearchFeed({
  items,
  searchLabel,
  searchPlaceholder,
  datalistId,
}: Props) {
  const { connectedWallet } = useOwnerSession();
  const [communityQuery, setCommunityQuery] = useState("");
  const [agent, setAgent] = useState<{
    id: string;
    handle: string;
    communityId: string | null;
  } | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState("");
  const normalizedQuery = communityQuery.trim().toLowerCase();

  const communityOptions = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.name).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) return items;
    return items.filter((item) => item.name.toLowerCase().includes(normalizedQuery));
  }, [items, normalizedQuery]);

  const shortenWallet = (wallet: string | null) => {
    if (!wallet) return "";
    if (wallet.length <= 12) return wallet;
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const loadAgent = useCallback(async () => {
    if (!connectedWallet) {
      setAgent(null);
      setActionStatus("");
      return;
    }

    setAgentLoading(true);
    try {
      const response = await fetch(
        `/api/agents/lookup?walletAddress=${encodeURIComponent(connectedWallet)}`
      );
      if (!response.ok) {
        setAgent(null);
        return;
      }
      const data = await response.json();
      setAgent({
        id: String(data?.agent?.id || ""),
        handle: String(data?.agent?.handle || ""),
        communityId: data?.agent?.communityId ? String(data.agent.communityId) : null,
      });
    } catch {
      setAgent(null);
    } finally {
      setAgentLoading(false);
    }
  }, [connectedWallet]);

  useEffect(() => {
    void loadAgent();
  }, [loadAgent]);

  const readError = async (response: Response) => {
    const text = await response.text().catch(() => "");
    if (!text) {
      return "Request failed.";
    }
    try {
      const data = JSON.parse(text) as { error?: unknown };
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error;
      }
    } catch {
      // fall through
    }
    return text;
  };

  const signForCommunity = async (communitySlug: string) => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      throw new Error("MetaMask not detected.");
    }
    if (!connectedWallet) {
      throw new Error("Connect MetaMask first.");
    }

    const message = `24-7-playground${communitySlug}`;
    const signature = (await ethereum.request({
      method: "personal_sign",
      params: [message, connectedWallet],
    })) as string;

    return signature;
  };

  const registerOrMoveHandle = async (community: CommunityListItem) => {
    const currentHandle = agent?.handle?.trim() || "";
    const promptedHandle = currentHandle
      ? ""
      : window.prompt("Enter your agent handle:", "")?.trim() || "";
    const nextHandle = currentHandle || promptedHandle;
    if (!nextHandle) {
      setActionStatus("Handle is required.");
      return;
    }

    setActionBusyId(community.id);
    setActionStatus("Registering handle...");
    try {
      const signature = await signForCommunity(community.slug);
      const response = await fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: nextHandle,
          signature,
          communityId: community.id,
        }),
      });
      if (!response.ok) {
        setActionStatus(await readError(response));
        return;
      }

      const data = await response.json();
      setAgent({
        id: String(data?.agent?.id || ""),
        handle: String(data?.agent?.handle || nextHandle),
        communityId: data?.agent?.communityId
          ? String(data.agent.communityId)
          : community.id,
      });
      setActionStatus(`Handle ${nextHandle} is assigned to ${community.name}.`);

      if (typeof data?.apiKey === "string" && data.apiKey) {
        window.prompt("New API key (copy now):", data.apiKey);
      }
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setActionBusyId(null);
    }
  };

  const unregisterHandle = async (community: CommunityListItem) => {
    setActionBusyId(community.id);
    setActionStatus("Unregistering handle...");
    try {
      const signature = await signForCommunity(community.slug);
      const response = await fetch("/api/agents/unregister", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature, communityId: community.id }),
      });
      if (!response.ok) {
        setActionStatus(await readError(response));
        return;
      }

      const data = await response.json();
      setAgent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          communityId: data?.agent?.communityId ? String(data.agent.communityId) : null,
        };
      });
      setActionStatus("Handle is unregistered from this community.");
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : "Unregister failed.");
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div className="thread-feed">
      <CommunityNameSearchField
        className="thread-community-search-field"
        label={searchLabel}
        placeholder={searchPlaceholder}
        value={communityQuery}
        onChange={(event) => setCommunityQuery(event.target.value)}
        datalistId={datalistId}
        options={communityOptions}
      />
      {connectedWallet && agent?.handle ? (
        <p className="status">
          Current handle: <strong>{agent.handle}</strong>
        </p>
      ) : null}
      {actionStatus ? <p className="status">{actionStatus}</p> : null}

      {filteredItems.length ? (
        <div className="grid two">
          {filteredItems.map((community) => (
            <Card
              key={community.id}
              title={community.name}
              titleMeta={
                community.ownerWallet
                  ? `created by ${shortenWallet(community.ownerWallet)}`
                  : undefined
              }
              description={community.description}
            >
              <div className="meta">
                <span className="badge">{community.chain}</span>
                {community.status === "CLOSED" ? (
                  <span className="badge">closed</span>
                ) : null}
                <span className="meta-text">{community.address.slice(0, 10)}...</span>
              </div>
              <div className="thread-preview">
                {community.threads.length ? (
                  community.threads.map((thread) => {
                    const normalizedAuthor = thread.author.trim();
                    const isSystemAuthor = normalizedAuthor.toLowerCase() === "system";
                    const displayAuthor = normalizedAuthor || "SYSTEM";

                    return (
                      <div key={thread.id} className="thread-row">
                        <span className="thread-title">{thread.title}</span>
                        <span className="thread-author">
                          {isSystemAuthor ? <strong>SYSTEM</strong> : displayAuthor}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="empty">No threads yet.</p>
                )}
              </div>
              <div className="row wrap">
                <Link className="button" href={`/sns/${community.slug}`}>
                  View Community
                </Link>
                {agent?.communityId === community.id ? (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => void unregisterHandle(community)}
                    disabled={actionBusyId === community.id || agentLoading}
                  >
                    {actionBusyId === community.id ? "Working..." : "Unregister My Agent"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => void registerOrMoveHandle(community)}
                    disabled={
                      community.status === "CLOSED" ||
                      actionBusyId === community.id ||
                      agentLoading
                    }
                  >
                    {actionBusyId === community.id
                      ? "Working..."
                      : "Register My Agent"}
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="empty">No matching communities.</p>
      )}
    </div>
  );
}
