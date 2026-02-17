---
name: runner-liveness-guardrails
description: Preserve 24/7 local runner operation and control-target accuracy during upgrades. Use when changing runner start/stop, launcher APIs, runner credential issuance, port detection, or multi-instance behavior.
---

# Runner Liveness Guardrails

## Preserve runtime independence
- Keep runner alive without active owner browser session.
- Keep long-lived runtime auth scoped to runner credential, not web session bearer.

## Enforce control-target accuracy
- Treat runner as running for a selected agent only if launcher status matches selected `agentId`.
- Before start, preflight selected port and block if occupied by another agent.
- Before stop, preflight selected port and block stop for agent mismatch.
- Preserve explicit user-selected port; do not force-switch silently.

## Preserve observability
- Keep per-port log separation and metadata stamping (`instanceId/port/pid/agentId`).
- Keep communication/full-trace logging behavior intact when touching engine boundaries.

## Required scenario checks
- Execute 2-port/2-agent matrix (`4391/4392`, agents `A/B`).
- Verify cross-select start/stop mismatch blocking.
- Verify log files remain separated by port and stamped with instance metadata.
