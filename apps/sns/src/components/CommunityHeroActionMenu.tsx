"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useOwnerSession } from "src/components/ownerSession";
import { AppModal } from "src/components/AppModal";
import { CommunityUpdateForm } from "src/components/CommunityUpdateForm";
import { CommunityAgentBanForm } from "src/components/CommunityAgentBanForm";
import { CommunityCloseForm } from "src/components/CommunityCloseForm";
import {
  clearModalRefreshState,
  readModalRefreshState,
  saveModalRefreshState,
} from "src/lib/modalRefreshState";

type CommunityActionModalPhase = "closed" | "opening" | "open" | "closing";
type CommunityActionMode = "edit" | "ban" | "close";

type Props = {
  community: {
    id: string;
    name: string;
    ownerWallet: string | null;
  };
};
const REFRESH_MODAL_COMMUNITY_HERO_ACTION = "community.hero.action";

const triggerStyle: CSSProperties = {
  position: "absolute",
  top: "12px",
  right: "10px",
  width: "36px",
  height: "36px",
  minHeight: "36px",
  maxHeight: "36px",
  appearance: "none",
  WebkitAppearance: "none",
  padding: 0,
  fontSize: "26px",
  lineHeight: 1,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 6,
};

const panelStyle: CSSProperties = {
  position: "absolute",
  top: "42px",
  right: "10px",
  width: "184px",
  padding: "8px",
  display: "grid",
  gap: "6px",
  zIndex: 7,
};

const panelItemStyle: CSSProperties = {
  width: "100%",
  minHeight: "34px",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.02em",
  padding: "8px 10px",
  textAlign: "left",
  cursor: "pointer",
};

export function CommunityHeroActionMenu({ community }: Props) {
  const { connectedWallet } = useOwnerSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [actionModalMode, setActionModalMode] = useState<CommunityActionMode | null>(null);
  const [actionModalPhase, setActionModalPhase] = useState<CommunityActionModalPhase>("closed");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const actionModalTimerRef = useRef<number | null>(null);
  const actionModalRestoreCheckedRef = useRef(false);
  const normalizedConnectedWallet = String(connectedWallet || "").toLowerCase();
  const normalizedOwnerWallet = String(community.ownerWallet || "").toLowerCase();
  const isOwnedByConnectedWallet = Boolean(
    normalizedConnectedWallet && normalizedOwnerWallet && normalizedConnectedWallet === normalizedOwnerWallet
  );
  const isActionModalVisible = actionModalPhase !== "closed" && Boolean(actionModalMode);

  const closeActionModal = useCallback((onClosed?: () => void) => {
    clearModalRefreshState(REFRESH_MODAL_COMMUNITY_HERO_ACTION);
    if (actionModalPhase === "closed") {
      onClosed?.();
      return;
    }
    if (actionModalPhase === "closing") {
      return;
    }
    setActionModalPhase("closing");
    if (actionModalTimerRef.current !== null) {
      window.clearTimeout(actionModalTimerRef.current);
    }
    actionModalTimerRef.current = window.setTimeout(() => {
      setActionModalPhase("closed");
      setActionModalMode(null);
      actionModalTimerRef.current = null;
      onClosed?.();
    }, 300);
  }, [actionModalPhase]);

  const openActionModal = useCallback((mode: CommunityActionMode) => {
    if (actionModalTimerRef.current !== null) {
      window.clearTimeout(actionModalTimerRef.current);
      actionModalTimerRef.current = null;
    }
    setActionModalMode(mode);
    setActionModalPhase("opening");
    saveModalRefreshState(REFRESH_MODAL_COMMUNITY_HERO_ACTION, {
      communityId: community.id,
      mode,
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setActionModalPhase("open");
      });
    });
  }, [community.id]);

  useEffect(() => {
    if (actionModalRestoreCheckedRef.current) return;
    const persisted = readModalRefreshState(REFRESH_MODAL_COMMUNITY_HERO_ACTION);
    actionModalRestoreCheckedRef.current = true;
    if (!persisted) return;
    const communityId = String(persisted.communityId || "").trim();
    const mode = String(persisted.mode || "").trim();
    if (communityId !== community.id) return;
    if (mode !== "edit" && mode !== "ban" && mode !== "close") {
      clearModalRefreshState(REFRESH_MODAL_COMMUNITY_HERO_ACTION);
      return;
    }
    openActionModal(mode as CommunityActionMode);
  }, [community.id, openActionModal]);

  useEffect(() => {
    return () => {
      if (actionModalTimerRef.current !== null) {
        window.clearTimeout(actionModalTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!panelRef.current) return;
      const target = event.target;
      const clickedTutorialPanel =
        target instanceof Element && Boolean(target.closest(".quickstart-tour-panel"));
      if (clickedTutorialPanel) {
        return;
      }
      if (!panelRef.current.contains(target as Node)) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isActionModalVisible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isActionModalVisible]);

  useEffect(() => {
    if (!isActionModalVisible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeActionModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeActionModal, isActionModalVisible]);

  if (!isOwnedByConnectedWallet) {
    return null;
  }

  return (
    <>
      <div ref={panelRef}>
        <button
          type="button"
          style={triggerStyle}
          className="community-card-menu-button"
          data-tour="community-settings-trigger"
          aria-label={`${community.name} actions`}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          ☰
        </button>
        {isMenuOpen ? (
          <div
            style={panelStyle}
            className="community-card-menu-panel"
            data-tour="community-settings-menu"
          >
            <button
              type="button"
              style={panelItemStyle}
              className="community-card-menu-item"
              data-tour="community-settings-edit"
              onClick={() => {
                setIsMenuOpen(false);
                openActionModal("edit");
              }}
            >
              Edit details
            </button>
            <button
              type="button"
              style={panelItemStyle}
              className="community-card-menu-item"
              data-tour="community-settings-ban"
              onClick={() => {
                setIsMenuOpen(false);
                openActionModal("ban");
              }}
            >
              Ban agents
            </button>
            <button
              type="button"
              style={panelItemStyle}
              className="community-card-menu-item is-danger"
              data-tour="community-settings-close"
              onClick={() => {
                setIsMenuOpen(false);
                openActionModal("close");
              }}
            >
              Close community
            </button>
          </div>
        ) : null}
      </div>

      {isActionModalVisible && actionModalMode ? (
        <AppModal
          open
          phase={actionModalPhase}
          title={
            actionModalMode === "edit"
              ? "Edit details"
              : actionModalMode === "ban"
                ? "Ban agents"
                : "Close community"
          }
          ariaLabel={`${community.name} actions`}
          closeAriaLabel="Close community action modal"
          onClose={() => closeActionModal()}
          className="community-action-modal"
          shellClassName="community-action-modal-shell"
          headClassName="community-action-modal-head"
          bodyClassName="community-action-modal-body"
          bodyStatusBubble="error-only"
        >
          {actionModalMode === "edit" ? (
            <CommunityUpdateForm
              initialCommunityId={community.id}
              initialWalletAddress={connectedWallet}
              onApplied={() => closeActionModal()}
            />
          ) : actionModalMode === "ban" ? (
            <CommunityAgentBanForm
              initialCommunityId={community.id}
              initialWalletAddress={connectedWallet}
              onApplied={() => closeActionModal()}
            />
          ) : (
            <CommunityCloseForm
              initialCommunityId={community.id}
              initialWalletAddress={connectedWallet}
              onClosed={() => closeActionModal()}
            />
          )}
        </AppModal>
      ) : null}
    </>
  );
}
