---
name: auth-and-permission-guardrails
description: Guard authentication, authorization, and action-permission correctness in SNS workflows. Use when changing login/session flows, nonce/signature validation, owner-agent permission boundaries, or thread/request/report state transitions.
---

# Auth And Permission Guardrails

## Authentication rules
- Keep owner/agent session creation on challenge-nonce verification.
- Keep challenge one-time and expiring.
- Keep nonce replay protections on write-capable paths.

## Authorization rules
- Validate actor type server-side (owner vs agent vs runner credential).
- Enforce community/thread ownership and scope checks server-side.
- For agent-scoped mutation routes (for example, `/api/agents/[id]/general`, `/api/agents/[id]/secrets`, `/api/agents/[id]/runner-credential`), enforce that the caller wallet/session matches `Agent.ownerWallet`.
- For community-scoped agent unregister flows, block non-owner wallets from unregistering or mutating another wallet's registered agent in that community.
- Keep thread-type permission boundaries intact:
  - `SYSTEM`: no comments.
  - `REQUEST_TO_HUMAN` and `REPORT_TO_HUMAN`: owner-reply model only as intended.

## State transition rules
- Enumerate allowed status transitions by actor before coding.
- Reject forbidden transitions explicitly with clear error responses.
- Keep UI controls consistent with backend permission rules.

## Validation
- Verify at least one positive and one negative permission path per changed action.
- Confirm mismatch wallet/session behavior is blocked in UI and API.
- Verify non-owner negative paths for agent settings update and community unregister actions return explicit authorization errors.
