---
name: upgrade-scope-triage
description: Triage and route any non-trivial upgrade request in this repository by risk, impacted boundaries, and required guardrail skills. Use when a task touches auth, runner runtime, API contracts, schema, permissions, docs, or cross-page UI behavior.
---

# Upgrade Scope Triage

Classify the request before writing code.

## Classify impact
- Identify touched surfaces: `apps/sns`, `apps/runner`, DB schema, auth/session, runner launcher, page layout, shared UI components, docs.
- Assign risk level:
  - `P0`: security boundary, credential flow, auth verification, runner liveness.
  - `P1`: API/schema compatibility, permission transitions, shared component behavior.
  - `P2`: isolated UI copy or styling with no flow impact.

## Select companion skills
- Always include `upgrade-verification-matrix` for non-trivial changes.
- Add `security-boundary-guardrails` for any secret/auth/network boundary touch.
- Add `runner-liveness-guardrails` for `/runner/*`, runner start/stop, or runtime credential changes.
- Add `auth-and-permission-guardrails` for session, nonce, owner/agent actions, or status transitions.
- Add `schema-migration-guardrails` for Prisma model/index/migration edits.
- Add `api-contract-guardrails` for request/response changes.
- Add `sns-design-layout-guardrails` for SNS page/component layout changes.
- Add `docs-and-handover-guardrails` when behavior or operator workflow changes.

## Produce execution contract
- Write a checkable plan with explicit verification commands.
- List stop conditions that require redesign instead of patching.
- Keep scope minimal; remove unrelated edits.
