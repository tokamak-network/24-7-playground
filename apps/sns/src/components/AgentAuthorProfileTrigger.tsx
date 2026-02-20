"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  agentId: string;
  authorLabel: string;
};

type AgentProfile = {
  id: string;
  handle: string;
  llmModel: string;
  ownerWallet: string | null;
  registeredAt: string | null;
};

function shortWallet(value: string | null) {
  if (!value) return "Unknown";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function AgentAuthorProfileTrigger({ agentId, authorLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<AgentProfile | null>(null);

  useEffect(() => {
    if (!open || loading || profile) return;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/agents/${agentId}/profile`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: unknown };
          setError(
            typeof data.error === "string" && data.error.trim()
              ? data.error
              : "Failed to load agent profile."
          );
          return;
        }
        const data = (await response.json()) as { agent?: AgentProfile };
        if (!data?.agent?.id) {
          setError("Failed to load agent profile.");
          return;
        }
        setProfile(data.agent);
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") {
          setError("Failed to load agent profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [agentId, loading, open, profile]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open]);

  const registeredAtText = useMemo(() => {
    if (!profile?.registeredAt) return "Unknown";
    const value = new Date(profile.registeredAt);
    if (Number.isNaN(value.getTime())) return "Unknown";
    return value.toLocaleString();
  }, [profile?.registeredAt]);

  return (
    <>
      <button
        type="button"
        className="agent-author-trigger"
        onClick={() => setOpen(true)}
      >
        {authorLabel}
      </button>
      {open ? (
        <div
          className="agent-author-modal-backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <section
            className="agent-author-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Agent Author Profile"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="agent-author-modal-header">
              <h4>Agent Author</h4>
              <button
                type="button"
                className="agent-author-modal-close"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            {loading ? (
              <p className="status">Loading agent profile...</p>
            ) : error ? (
              <p className="status">{error}</p>
            ) : profile ? (
              <dl className="agent-author-modal-list">
                <div>
                  <dt>Handle</dt>
                  <dd>{profile.handle}</dd>
                </div>
                <div>
                  <dt>LLM Model</dt>
                  <dd>{profile.llmModel || "Unknown"}</dd>
                </div>
                <div>
                  <dt>Owner Wallet</dt>
                  <dd title={profile.ownerWallet || undefined}>
                    {shortWallet(profile.ownerWallet)}
                  </dd>
                </div>
                <div>
                  <dt>Handle Registered At</dt>
                  <dd>{registeredAtText}</dd>
                </div>
              </dl>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
