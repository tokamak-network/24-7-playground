"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CommunityNameSearchFeed } from "src/components/CommunityNameSearchFeed";
import { useOwnerSession } from "src/components/ownerSession";

type StatusFilterOption = {
  value: string;
  label: string;
};

type ThreadItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  commentCount: number;
  isIssued?: boolean;
  communitySlug: string | null;
  communityName: string;
  communityOwnerWallet?: string | null;
  author: string;
  authorAgentId?: string | null;
  statusLabel?: string;
};

type Props = {
  title: string;
  description?: string;
  items: ThreadItem[];
  badgeLabel: string;
  emptyLabel: string;
  filteredEmptyLabel?: string;
  searchLabel?: string;
  searchPlaceholder: string;
  datalistId: string;
  statusFilterLabel?: string;
  statusFilterOptions?: StatusFilterOption[];
  ownerOnlyLabel?: string;
};

export function CommunityNameSearchFeedSection({
  title,
  description,
  items,
  badgeLabel,
  emptyLabel,
  filteredEmptyLabel,
  searchLabel,
  searchPlaceholder,
  datalistId,
  statusFilterLabel,
  statusFilterOptions,
  ownerOnlyLabel = "View only my communities",
}: Props) {
  const { connectedWallet, walletAddress } = useOwnerSession();
  const [ownerOnly, setOwnerOnly] = useState(false);
  const [walletBubbleMessage, setWalletBubbleMessage] = useState("");
  const walletBubbleTimerRef = useRef<number | null>(null);
  const activeWallet = (connectedWallet || walletAddress || "").toLowerCase();

  useEffect(() => {
    return () => {
      if (walletBubbleTimerRef.current) {
        window.clearTimeout(walletBubbleTimerRef.current);
      }
    };
  }, []);

  const showWalletBubble = (message: string) => {
    setWalletBubbleMessage(message);
    if (walletBubbleTimerRef.current) {
      window.clearTimeout(walletBubbleTimerRef.current);
    }
    walletBubbleTimerRef.current = window.setTimeout(() => {
      setWalletBubbleMessage("");
      walletBubbleTimerRef.current = null;
    }, 2800);
  };

  const handleOwnerOnlyChange = (nextChecked: boolean) => {
    if (nextChecked && !activeWallet) {
      setOwnerOnly(false);
      showWalletBubble("Connect wallet first.");
      return;
    }
    setOwnerOnly(nextChecked);
    if (!nextChecked) {
      setWalletBubbleMessage("");
    }
  };

  const scopedItems = useMemo(() => {
    if (!ownerOnly) return items;
    if (!activeWallet) return [];
    return items.filter(
      (item) =>
        String(item.communityOwnerWallet || "").toLowerCase() === activeWallet
    );
  }, [activeWallet, items, ownerOnly]);

  return (
    <section className="section">
      <div className="section-title-row">
        <h3>{title}</h3>
        <label className={`section-title-toggle${ownerOnly ? " is-active" : ""}`}>
          <input
            type="checkbox"
            checked={ownerOnly}
            onChange={(event) => handleOwnerOnlyChange(event.target.checked)}
          />
          <span className="section-title-toggle-box" aria-hidden />
          <span>{ownerOnlyLabel}</span>
          {walletBubbleMessage ? (
            <div className="wallet-status-bubble" role="status" aria-live="polite">
              {walletBubbleMessage}
            </div>
          ) : null}
        </label>
      </div>
      {description ? <p>{description}</p> : null}
      <CommunityNameSearchFeed
        items={scopedItems}
        badgeLabel={badgeLabel}
        emptyLabel={emptyLabel}
        filteredEmptyLabel={filteredEmptyLabel}
        searchLabel={searchLabel}
        searchPlaceholder={searchPlaceholder}
        datalistId={datalistId}
        statusFilterLabel={statusFilterLabel}
        statusFilterOptions={statusFilterOptions}
      />
    </section>
  );
}
