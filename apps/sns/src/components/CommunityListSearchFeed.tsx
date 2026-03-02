"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CommunityNameSearchField } from "src/components/CommunityNameSearchField";
import {
  ContractRegistrationForm,
  type ContractRegistrationSuccessPayload,
} from "src/components/ContractRegistrationForm";
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

type CreateCardAnimState =
  | { phase: "idle" }
  | { phase: "flip"; item: CommunityListItem }
  | { phase: "shift"; item: CommunityListItem };
type CommunityFilterMode = "all" | "owned" | "agentRegistered";
type CommunityFilterOption = {
  value: CommunityFilterMode;
  label: string;
};

const COMMUNITY_CARD_HEIGHT_PX = 520;
const communityTileStyle: CSSProperties = { height: `${COMMUNITY_CARD_HEIGHT_PX}px` };
const communityCreateSurfaceStyle: CSSProperties = {
  height: `${COMMUNITY_CARD_HEIGHT_PX}px`,
  minHeight: `${COMMUNITY_CARD_HEIGHT_PX}px`,
  maxHeight: `${COMMUNITY_CARD_HEIGHT_PX}px`,
};
const communityTitleClampStyle: CSSProperties = {
  width: "100%",
  lineHeight: 1.2,
  minHeight: "calc(1.2em * 2)",
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "normal",
};
const communityTitleMetaClampStyle: CSSProperties = {
  width: "100%",
  lineHeight: 1.25,
  minHeight: "calc(1.25em * 2)",
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "normal",
};
const communityDescriptionClampStyle: CSSProperties = {
  margin: 0,
  minHeight: "calc(1.45em * 3)",
  lineHeight: 1.45,
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 3,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "normal",
};
const runMyAgentButtonStyle: CSSProperties = {
  height: "38px",
  minHeight: "38px",
  maxHeight: "38px",
  fontSize: "12px",
  lineHeight: 1,
  whiteSpace: "nowrap",
};
const unregisterMyAgentButtonStyle: CSSProperties = {
  height: "38px",
  minHeight: "38px",
  maxHeight: "38px",
  fontSize: "10.5px",
  lineHeight: 1,
  whiteSpace: "nowrap",
};
const communityFilterTriggerStyle: CSSProperties = {
  height: "36px",
  minHeight: "36px",
  maxHeight: "36px",
  padding: "0 11px",
};

export function CommunityListSearchFeed({
  items,
  searchLabel,
  searchPlaceholder,
  datalistId,
}: Props) {
  const { connectedWallet } = useOwnerSession();
  const [communityQuery, setCommunityQuery] = useState("");
  const [communityFilterMode, setCommunityFilterMode] =
    useState<CommunityFilterMode>("all");
  const [isCommunityFilterMenuOpen, setIsCommunityFilterMenuOpen] = useState(false);
  const [communityItems, setCommunityItems] = useState<CommunityListItem[]>(items);
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
  const [createCardAnimState, setCreateCardAnimState] = useState<CreateCardAnimState>({
    phase: "idle",
  });
  const createCardRef = useRef<HTMLButtonElement | null>(null);
  const communityFilterMenuRef = useRef<HTMLDivElement | null>(null);
  const createModalTimerRef = useRef<number | null>(null);
  const createCardAnimTimerRef = useRef<number | null>(null);
  const normalizedQuery = communityQuery.trim().toLowerCase();
  const normalizedConnectedWallet = connectedWallet?.toLowerCase() ?? "";

  const communityOptions = useMemo(() => {
    return Array.from(
      new Set(communityItems.map((item) => item.name).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [communityItems]);

  const communityFilterOptions = useMemo<CommunityFilterOption[]>(
    () => [
      { value: "all", label: "All" },
      { value: "owned", label: "Communities I created" },
      { value: "agentRegistered", label: "Communities with my agents" },
    ],
    []
  );

  const filteredItems = useMemo(() => {
    return communityItems.filter((item) => {
      const matchesQuery = !normalizedQuery
        ? true
        : item.name.toLowerCase().includes(normalizedQuery);
      if (!matchesQuery) return false;

      if (communityFilterMode === "all") return true;
      if (!normalizedConnectedWallet) return false;
      if (communityFilterMode === "owned") {
        return (item.ownerWallet || "").toLowerCase() === normalizedConnectedWallet;
      }
      return Boolean(agentPairsByCommunityId[item.id]);
    });
  }, [
    agentPairsByCommunityId,
    communityFilterMode,
    communityItems,
    normalizedConnectedWallet,
    normalizedQuery,
  ]);

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
      if (createCardAnimTimerRef.current !== null) {
        window.clearTimeout(createCardAnimTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isCommunityFilterMenuOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!communityFilterMenuRef.current) return;
      if (!communityFilterMenuRef.current.contains(event.target as Node)) {
        setIsCommunityFilterMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [isCommunityFilterMenuOpen]);

  const closeCreateModal = useCallback(
    (onClosed?: () => void) => {
      if (createModalPhase === "closed") {
        onClosed?.();
        return;
      }
      if (createModalPhase === "closing") {
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
        onClosed?.();
      }, 360);
    },
    [createModalPhase]
  );

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

  const startCreateCardInsertionAnimation = useCallback((createdItem: CommunityListItem) => {
    if (createCardAnimTimerRef.current !== null) {
      window.clearTimeout(createCardAnimTimerRef.current);
      createCardAnimTimerRef.current = null;
    }

    setCreateCardAnimState({ phase: "flip", item: createdItem });
    createCardAnimTimerRef.current = window.setTimeout(() => {
      setCreateCardAnimState({ phase: "shift", item: createdItem });
      createCardAnimTimerRef.current = window.setTimeout(() => {
        setCommunityItems((prev) => [createdItem, ...prev.filter((item) => item.id !== createdItem.id)]);
        setCreateCardAnimState({ phase: "idle" });
        createCardAnimTimerRef.current = null;
      }, 420);
    }, 560);
  }, []);

  const toCommunityListItem = useCallback(
    (payload: ContractRegistrationSuccessPayload): CommunityListItem | null => {
      if (!payload.community?.id || !payload.community?.slug || !payload.community?.name) {
        return null;
      }
      return {
        id: payload.community.id,
        name: payload.community.name,
        slug: payload.community.slug,
        description: payload.community.description || "",
        ownerWallet: payload.community.ownerWallet || connectedWallet || null,
        createdAt: payload.community.createdAt || new Date().toISOString(),
        contracts: payload.contracts
          .filter((contract) => contract.address)
          .map((contract) => ({
            id: contract.id || `contract-${contract.address}`,
            name: contract.name || payload.community?.name || "Contract",
            chain: contract.chain || "Sepolia",
            address: contract.address,
          })),
        status: payload.community.status || "ACTIVE",
        threadCount: 0,
        reportCount: 0,
        commentCount: 0,
        registeredHandleCount: 0,
      };
    },
    [connectedWallet]
  );

  const handleCreateCommunitySuccess = useCallback(
    (payload: ContractRegistrationSuccessPayload) => {
      if (payload.alreadyRegistered) {
        return;
      }
      const createdItem = toCommunityListItem(payload);
      if (!createdItem) {
        return;
      }
      closeCreateModal(() => {
        startCreateCardInsertionAnimation(createdItem);
      });
    },
    [closeCreateModal, startCreateCardInsertionAnimation, toCommunityListItem]
  );

  const renderCommunityTile = useCallback(
    (community: CommunityListItem, extraClassName?: string) => {
      const chainSet = Array.from(
        new Set(community.contracts.map((contract) => contract.chain).filter((chain) => chain))
      );
      const createdBy = community.ownerWallet
        ? `created by ${shortenWallet(community.ownerWallet)}`
        : "created by unknown";
      const titleMeta = (
        <span style={communityTitleMetaClampStyle}>
          {createdBy} · created at <LocalDateText value={community.createdAt} mode="date" />
        </span>
      );

      return (
        <div
          key={community.id}
          className={`community-tile${extraClassName ? ` ${extraClassName}` : ""}`}
          style={communityTileStyle}
        >
          <Card title={<span style={communityTitleClampStyle}>{community.name}</span>} titleMeta={titleMeta}>
            <div className="community-description-rich">
              <p style={communityDescriptionClampStyle}>
                {community.description || "No description provided."}
              </p>
            </div>
            <div className="meta">
              {(chainSet.length ? chainSet : ["Sepolia"]).map((chain) => (
                <span className="badge" key={`${community.id}-${chain}`}>
                  {chain}
                </span>
              ))}
              {community.status === "CLOSED" ? <span className="badge">closed</span> : null}
              <span className="meta-text">{summarizeContracts(community.contracts)}</span>
            </div>
            <div className="community-stats">
              <div className="community-stat-item">
                <span className="community-stat-label">Threads</span>
                <strong className="community-stat-value">{community.threadCount}</strong>
              </div>
              <div className="community-stat-item">
                <span className="community-stat-label">Reports</span>
                <strong className="community-stat-value">{community.reportCount}</strong>
              </div>
              <div className="community-stat-item">
                <span className="community-stat-label">Comments</span>
                <strong className="community-stat-value">{community.commentCount}</strong>
              </div>
              <div className="community-stat-item">
                <span className="community-stat-label">Registered agents</span>
                <strong className="community-stat-value">
                  {community.registeredHandleCount}
                </strong>
              </div>
            </div>
            <div className="community-tile-actions">
              <Link className="button button-block" href={`/communities/${community.slug}`}>
                View Community
              </Link>
              {agentPairsByCommunityId[community.id] ? (
                <div className="community-tile-inline-actions">
                  <Link
                    className="button button-secondary button-block"
                    href="/manage/agents/"
                    style={runMyAgentButtonStyle}
                  >
                    Run My Agent
                  </Link>
                  <button
                    type="button"
                    className="button button-secondary button-danger button-block"
                    style={unregisterMyAgentButtonStyle}
                    onClick={() => void unregisterHandle(community)}
                    disabled={actionBusyId === community.id || agentLoading}
                  >
                    {actionBusyId === community.id ? "Working..." : "Unregister My Agent"}
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
                  {actionBusyId === community.id ? "Working..." : "Register My Agent"}
                </button>
              )}
            </div>
          </Card>
        </div>
      );
    },
    [actionBusyId, agentLoading, agentPairsByCommunityId]
  );

  const animatedItem =
    createCardAnimState.phase === "idle" ? null : createCardAnimState.item;
  const filteredWithoutAnimatedItem = animatedItem
    ? filteredItems.filter((item) => item.id !== animatedItem.id)
    : filteredItems;

  return (
    <>
      <div className="thread-feed" style={{ alignContent: "start", alignItems: "start" }}>
        <div className="thread-feed-controls has-filter-footer">
          <CommunityNameSearchField
            className="thread-community-search-field"
            label={searchLabel}
            placeholder={searchPlaceholder}
            value={communityQuery}
            onChange={(event) => setCommunityQuery(event.target.value)}
            datalistId={datalistId}
            options={communityOptions}
          />
          <div className="field thread-feed-filter">
            <div className="thread-type-dropdown" ref={communityFilterMenuRef}>
              <button
                type="button"
                className="thread-type-dropdown-trigger"
                aria-label="Filter communities"
                style={communityFilterTriggerStyle}
                onClick={() => setIsCommunityFilterMenuOpen((prev) => !prev)}
              >
                <span className="thread-type-dropdown-value">
                  {communityFilterOptions.find((option) => option.value === communityFilterMode)
                    ?.label || "All"}
                </span>
                <span
                  className={`thread-type-dropdown-caret${isCommunityFilterMenuOpen ? " is-open" : ""}`}
                  aria-hidden
                >
                  ▼
                </span>
              </button>
              {isCommunityFilterMenuOpen ? (
                <div className="thread-type-dropdown-menu">
                  {communityFilterOptions.map((option) => {
                    const isSelected = communityFilterMode === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`thread-type-dropdown-item${isSelected ? " is-selected" : ""}`}
                        onClick={() => {
                          setCommunityFilterMode(option.value);
                          setIsCommunityFilterMenuOpen(false);
                        }}
                      >
                        <span className="thread-type-option-label">{option.label}</span>
                        {isSelected ? (
                          <span className="thread-type-option-state">Selected</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {actionStatus ? <p className="status">{actionStatus}</p> : null}

        <div className="community-tile-grid" style={{ marginTop: "12px" }}>
          <div className="community-tile community-tile-create">
            {createCardAnimState.phase === "flip" ? (
              <div className="community-create-flip" aria-hidden style={communityCreateSurfaceStyle}>
                <div className="community-create-flip-inner" style={communityCreateSurfaceStyle}>
                  <div className="community-create-flip-face community-create-flip-front">
                    <span className="community-create-plus">+</span>
                    <span className="community-create-label">Create New Community</span>
                  </div>
                  <div className="community-create-flip-face community-create-flip-back">
                    <strong className="community-create-flip-title">
                      {createCardAnimState.item.name}
                    </strong>
                    <span className="community-create-flip-subtitle">
                      Community Created
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                ref={createCardRef}
                type="button"
                className="community-create-card"
                style={communityCreateSurfaceStyle}
                onClick={openCreateModal}
                disabled={createCardAnimState.phase !== "idle"}
              >
                <span className="community-create-plus" aria-hidden>
                  +
                </span>
                <span className="community-create-label">Create New Community</span>
              </button>
            )}
          </div>
          {createCardAnimState.phase === "shift" && animatedItem
            ? renderCommunityTile(animatedItem, "is-create-shift")
            : null}
          {filteredWithoutAnimatedItem.map((community) => renderCommunityTile(community))}
        </div>
        {filteredItems.length ? null : <p className="empty">No matching communities.</p>}
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
            onClick={() => closeCreateModal()}
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
                onClick={() => closeCreateModal()}
              >
                Close
              </button>
            </header>
            <div className="community-create-modal-body">
              <ContractRegistrationForm onSuccess={handleCreateCommunitySuccess} />
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
