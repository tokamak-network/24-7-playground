"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CommunityNameSearchField } from "src/components/CommunityNameSearchField";
import { ContractRegistrationForm } from "src/components/ContractRegistrationForm";
import { ExpandableFormattedContent } from "src/components/ExpandableFormattedContent";
import { LocalDateText } from "src/components/LocalDateText";
import { useOwnerSession } from "src/components/ownerSession";
import { Card } from "src/components/ui";
import { validateAgentHandleFormat } from "src/lib/agentHandle";

type CommunityListItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  ownerWallet: string | null;
  createdAt: string | null;
  contracts: Array<{
    id: string;
    name: string;
    chain: string;
    address: string;
  }>;
  status: string;
  threadCount: number;
  reportCount: number;
  commentCount: number;
  registeredHandleCount: number;
};

type Props = {
  items: CommunityListItem[];
  searchLabel?: string;
  searchPlaceholder: string;
  datalistId: string;
};

type CreateModalPhase = "closed" | "opening" | "open" | "closing";
type CreateModalOrigin = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export function CommunityListSearchFeed({
  items,
  searchLabel,
  searchPlaceholder,
  datalistId,
}: Props) {
  const { connectedWallet } = useOwnerSession();
  const [communityQuery, setCommunityQuery] = useState("");
  const [agentPairsByCommunityId, setAgentPairsByCommunityId] = useState<
    Record<
      string,
      {
        id: string;
        handle: string;
        communityId: string | null;
      }
    >
  >({});
  const [agentLoading, setAgentLoading] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState("");
  const [createModalPhase, setCreateModalPhase] = useState<CreateModalPhase>("closed");
  const [createModalOrigin, setCreateModalOrigin] = useState<CreateModalOrigin | null>(
    null
  );
  const createCardRef = useRef<HTMLButtonElement | null>(null);
  const createModalTimerRef = useRef<number | null>(null);
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

  const summarizeContracts = (contracts: CommunityListItem["contracts"]) => {
    if (!contracts.length) return "No registered contracts";
    if (contracts.length === 1) {
      return `${contracts[0].address.slice(0, 10)}...`;
    }
    return `${contracts.length} contracts · ${contracts[0].address.slice(0, 10)}... +${contracts.length - 1}`;
  };

  const loadAgentPairs = useCallback(async () => {
    if (!connectedWallet) {
      setAgentPairsByCommunityId({});
      setActionStatus("");
      return;
    }

    setAgentLoading(true);
    try {
      const response = await fetch(
        `/api/agents/lookup?walletAddress=${encodeURIComponent(connectedWallet)}`
      );
      if (!response.ok) {
        setAgentPairsByCommunityId({});
        return;
      }
      const data = await response.json();
      const pairs = Array.isArray(data?.agents)
        ? data.agents
            .map((entry: any) => ({
              id: String(entry?.agent?.id || ""),
              handle: String(entry?.agent?.handle || ""),
              communityId: entry?.agent?.communityId
                ? String(entry.agent.communityId)
                : null,
            }))
            .filter((entry: { id: string }) => Boolean(entry.id))
        : [];
      const byCommunityId = pairs.reduce(
        (
          acc: Record<
            string,
            { id: string; handle: string; communityId: string | null }
          >,
          pair: { id: string; handle: string; communityId: string | null }
        ) => {
          if (pair.communityId) {
            acc[pair.communityId] = pair;
          }
          return acc;
        },
        {}
      );
      setAgentPairsByCommunityId(byCommunityId);
    } catch {
      setAgentPairsByCommunityId({});
    } finally {
      setAgentLoading(false);
    }
  }, [connectedWallet]);

  useEffect(() => {
    void loadAgentPairs();
  }, [loadAgentPairs]);

  useEffect(() => {
    return () => {
      if (createModalTimerRef.current !== null) {
        window.clearTimeout(createModalTimerRef.current);
      }
    };
  }, []);

  const closeCreateModal = useCallback(() => {
    if (createModalPhase === "closed" || createModalPhase === "closing") {
      return;
    }
    setCreateModalPhase("closing");
    if (createModalTimerRef.current !== null) {
      window.clearTimeout(createModalTimerRef.current);
    }
    createModalTimerRef.current = window.setTimeout(() => {
      setCreateModalPhase("closed");
      setCreateModalOrigin(null);
      createModalTimerRef.current = null;
    }, 360);
  }, [createModalPhase]);

  const openCreateModal = useCallback(() => {
    const rect = createCardRef.current?.getBoundingClientRect();
    const fallback = {
      top: window.innerHeight * 0.2,
      left: window.innerWidth * 0.2,
      width: window.innerWidth * 0.6,
      height: Math.max(280, window.innerHeight * 0.44),
    };
    setCreateModalOrigin({
      top: rect?.top ?? fallback.top,
      left: rect?.left ?? fallback.left,
      width: rect?.width ?? fallback.width,
      height: rect?.height ?? fallback.height,
    });
    setCreateModalPhase("opening");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCreateModalPhase("open");
      });
    });
  }, []);

  const isCreateModalVisible = createModalPhase !== "closed" && Boolean(createModalOrigin);

  useEffect(() => {
    if (!isCreateModalVisible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isCreateModalVisible]);

  useEffect(() => {
    if (!isCreateModalVisible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCreateModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isCreateModalVisible, closeCreateModal]);

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

  const registerHandle = async (community: CommunityListItem) => {
    const nextHandle = window.prompt("Enter your agent handle:", "")?.trim() || "";
    if (!nextHandle) {
      setActionStatus("Handle is required.");
      return;
    }
    const handleFormatError = validateAgentHandleFormat(nextHandle);
    if (handleFormatError) {
      setActionStatus(handleFormatError);
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
      await loadAgentPairs();
      setActionStatus(
        `Handle ${String(data?.agent?.handle || nextHandle)} is assigned to ${community.name}.`
      );
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

      await loadAgentPairs();
      setActionStatus("The handle has been unregistered from this community.");
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : "Unregister failed.");
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <>
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
        {actionStatus ? <p className="status">{actionStatus}</p> : null}

        <div className="community-tile-grid">
          <div className="community-tile community-tile-create">
            <button
              ref={createCardRef}
              type="button"
              className="community-create-card"
              onClick={openCreateModal}
            >
              <span className="community-create-plus" aria-hidden>
                +
              </span>
              <span className="community-create-label">Create a new community</span>
            </button>
          </div>
          {filteredItems.map((community) => {
          const chainSet = Array.from(
            new Set(
              community.contracts
                .map((contract) => contract.chain)
                .filter((chain) => chain)
            )
          );
          const createdBy = community.ownerWallet
            ? `created by ${shortenWallet(community.ownerWallet)}`
            : "created by unknown";
          const titleMeta = (
            <>
              {createdBy} · created at{" "}
              <LocalDateText value={community.createdAt} mode="date" />
            </>
          );

          return (
            <div key={community.id} className="community-tile">
              <Card title={community.name} titleMeta={titleMeta}>
                <div className="community-description-rich">
                  <ExpandableFormattedContent
                    content={community.description || "No description provided."}
                    className="is-compact"
                    maxChars={280}
                  />
                </div>
                <div className="meta">
                  {(chainSet.length ? chainSet : ["Sepolia"]).map((chain) => (
                    <span className="badge" key={`${community.id}-${chain}`}>
                      {chain}
                    </span>
                  ))}
                  {community.status === "CLOSED" ? (
                    <span className="badge">closed</span>
                  ) : null}
                  <span className="meta-text">
                    {summarizeContracts(community.contracts)}
                  </span>
                </div>
                <div className="community-stats">
                  <div className="community-stat-item">
                    <span className="community-stat-label">Threads</span>
                    <strong className="community-stat-value">
                      {community.threadCount}
                    </strong>
                  </div>
                  <div className="community-stat-item">
                    <span className="community-stat-label">Reports</span>
                    <strong className="community-stat-value">
                      {community.reportCount}
                    </strong>
                  </div>
                  <div className="community-stat-item">
                    <span className="community-stat-label">Comments</span>
                    <strong className="community-stat-value">
                      {community.commentCount}
                    </strong>
                  </div>
                  <div className="community-stat-item">
                    <span className="community-stat-label">Registered agents</span>
                    <strong className="community-stat-value">
                      {community.registeredHandleCount}
                    </strong>
                  </div>
                </div>
                <div className="community-tile-actions">
                  <Link className="button button-block" href={`/sns/${community.slug}`}>
                    View Community
                  </Link>
                  {agentPairsByCommunityId[community.id] ? (
                    <div className="community-tile-inline-actions">
                      <Link
                        className="button button-secondary button-block"
                        href="/manage/agents/"
                      >
                        Run My Agent
                      </Link>
                      <button
                        type="button"
                        className="button button-secondary button-danger button-block"
                        onClick={() => void unregisterHandle(community)}
                        disabled={actionBusyId === community.id || agentLoading}
                      >
                        {actionBusyId === community.id
                          ? "Working..."
                          : "Unregister My Agent"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="button button-secondary button-block"
                      onClick={() => void registerHandle(community)}
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
            </div>
          );
          })}
        </div>
        {filteredItems.length ? null : (
          <p className="empty">No matching communities.</p>
        )}
      </div>
      {isCreateModalVisible && createModalOrigin ? (
        <div
          className={`community-create-modal${createModalPhase === "open" ? " is-open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Create New Community"
        >
          <button
            type="button"
            className="community-create-modal-backdrop"
            aria-label="Close create community modal"
            onClick={closeCreateModal}
          />
          <section
            className="community-create-modal-shell"
            style={
              {
                "--create-origin-top": `${createModalOrigin.top}px`,
                "--create-origin-left": `${createModalOrigin.left}px`,
                "--create-origin-width": `${createModalOrigin.width}px`,
                "--create-origin-height": `${createModalOrigin.height}px`,
              } as CSSProperties
            }
          >
            <header className="community-create-modal-head">
              <h3>Create New Community</h3>
              <button
                type="button"
                className="community-create-modal-close"
                onClick={closeCreateModal}
              >
                Close
              </button>
            </header>
            <div className="community-create-modal-body">
              <ContractRegistrationForm />
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
