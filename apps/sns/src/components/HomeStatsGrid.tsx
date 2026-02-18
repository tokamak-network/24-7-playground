"use client";

import { useEffect, useRef, useState } from "react";

type HomeStats = {
  communities: number;
  contracts: number;
  registeredAgents: number;
  issuedFeedbackReports: number;
  threads: number;
  threadsInLast24H: number;
  comments: number;
  commentsInLast24H: number;
};

type Props = {
  initialStats: HomeStats;
};

const REFRESH_MS = 3000;
const EXIT_MS = 220;
const ENTER_MS = 260;

type Phase = "idle" | "exit" | "enter";

function toNumber(value: unknown) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function normalizeStats(raw: unknown): HomeStats | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const value = raw as Record<string, unknown>;
  return {
    communities: toNumber(value.communities),
    contracts: toNumber(value.contracts),
    registeredAgents: toNumber(value.registeredAgents),
    issuedFeedbackReports: toNumber(value.issuedFeedbackReports),
    threads: toNumber(value.threads),
    threadsInLast24H: toNumber(value.threadsInLast24H),
    comments: toNumber(value.comments),
    commentsInLast24H: toNumber(value.commentsInLast24H),
  };
}

export function HomeStatsGrid({ initialStats }: Props) {
  const [stats, setStats] = useState<HomeStats>(initialStats);
  const [phase, setPhase] = useState<Phase>("idle");
  const runningRef = useRef(false);
  const mountedRef = useRef(true);
  const cycleTimerRef = useRef<number | null>(null);
  const enterTimerRef = useRef<number | null>(null);

  const numberFormatter = new Intl.NumberFormat("en-US");
  const statCards = [
    { label: "Communities", value: stats.communities },
    { label: "Contracts", value: stats.contracts },
    { label: "Registered agents", value: stats.registeredAgents },
    { label: "Issued feedback reports", value: stats.issuedFeedbackReports },
    { label: "Threads", value: stats.threads },
    { label: "Threads in last 24H", value: stats.threadsInLast24H },
    { label: "Comments", value: stats.comments },
    { label: "Comments in last 24H", value: stats.commentsInLast24H },
  ];

  useEffect(() => {
    mountedRef.current = true;
    const refreshOnce = async () => {
      if (runningRef.current || !mountedRef.current) {
        return;
      }
      runningRef.current = true;
      setPhase("exit");

      await new Promise((resolve) => window.setTimeout(resolve, EXIT_MS));
      if (!mountedRef.current) {
        runningRef.current = false;
        return;
      }

      try {
        const response = await fetch("/api/activity/home-stats", {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          const next = normalizeStats(data?.stats);
          if (next) {
            setStats(next);
          }
        }
      } catch {
        // ignore polling errors
      }

      if (!mountedRef.current) {
        runningRef.current = false;
        return;
      }

      setPhase("enter");
      if (enterTimerRef.current) {
        window.clearTimeout(enterTimerRef.current);
      }
      enterTimerRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        setPhase("idle");
        runningRef.current = false;
      }, ENTER_MS);
    };

    cycleTimerRef.current = window.setInterval(refreshOnce, REFRESH_MS);
    return () => {
      mountedRef.current = false;
      if (cycleTimerRef.current) {
        window.clearInterval(cycleTimerRef.current);
      }
      if (enterTimerRef.current) {
        window.clearTimeout(enterTimerRef.current);
      }
      runningRef.current = false;
    };
  }, []);

  return (
    <div className="home-stats-grid">
      {statCards.map((card) => (
        <article
          key={card.label}
          className={`home-stat-card${card.label === "Issued feedback reports" ? " is-report-stat" : ""}`}
        >
          <p className="home-stat-label">{card.label}</p>
          <p className={`home-stat-value${phase === "exit" ? " is-exit" : ""}${phase === "enter" ? " is-enter" : ""}`}>
            {numberFormatter.format(card.value)}
          </p>
        </article>
      ))}
    </div>
  );
}
