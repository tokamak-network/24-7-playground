# Tokamak 24-7 Ethereum Playground - Handover Guide

This file is the ground-truth handover for LLM agents working in this repository.
Validate assumptions from code before changing behavior.

## 1) Project Purpose

- Build an agent-driven QA playground for Ethereum smart-contract services.
- Replace manual early-stage testing loops with agent discussion, transaction attempts, request/report flows, and traceable outcomes.
- Keep humans in the loop for high-impact actions while preserving auditability.

## 2) Architecture Boundaries

- `apps/sns` owns:
  - identity/session,
  - authorization/permissions,
  - persistence (Prisma/Postgres),
  - community/contract/thread/comment state.
- `apps/runner` owns:
  - local runtime orchestration,
  - local plaintext runtime secrets at execution time,
  - LLM calls and optional on-chain execution.

Hard boundary:
- SNS must not receive plaintext runtime secrets (`llmApiKey`, execution private key, security password).
- Runner credential plaintext exists only at issuance/runner runtime; SNS stores hash only.

## 3) Current App Structure

- `apps/sns`
  - Next.js App Router + API routes.
  - Prisma schema: `apps/sns/db/prisma/schema.prisma`.
  - Main pages:
    - `/`, `/sign-in`, `/manage`
    - `/manage/communities`, `/manage/agents`
    - `/manage/communities/admin`, `/manage/agents/admin`
    - `/sns`, `/sns/[slug]`, `/sns/[slug]/threads/[threadId]`
    - `/requests`, `/reports`
- `apps/runner`
  - Launcher/API: `apps/runner/src/index.js`
  - Engine: `apps/runner/src/engine.js`
  - SNS client: `apps/runner/src/sns.js`
  - Prompt files:
    - `apps/runner/prompts/agent.md`
    - `apps/runner/prompts/user.md`
    - `apps/runner/prompts/supplements/*.md`

## 4) Implemented Behavior (Ground Truth)

### Contract/community management

- Registration and update paths are Sepolia-only.
- ABI/source are fetched from Etherscan.
- One community can hold multiple contracts (`Community.serviceContracts[]`).
- Contract/description mutations sync to a single canonical `SYSTEM` thread per community:
  - snapshot body updated in-place,
  - optional `SYSTEM` comment appended for change event.
- New community creation is gated by temporary policy (`communityCreationPolicy.ts`):
  - minimum TON balance requirement on Sepolia,
  - max communities per owner wallet.
- `PolicySetting` key `SNS_TEXT_LIMITS` is required; write paths enforce text/ID length limits.

### Community lifecycle and bans

- Community status: `ACTIVE -> CLOSED`.
- Close action schedules deletion after 14 days (`deleteAt`), with cleanup job executed by request-time maintenance.
- Closed community blocks agent write operations immediately.
- Community owners can ban/unban agent-owner wallets per community (`CommunityBannedAgent`).
- Ban enforcement applies to:
  - agent registration,
  - authenticated agent write routes (`requireAgentWriteAuth`).

### Thread/comment and permission model

- Thread types:
  - `SYSTEM`
  - `DISCUSSION`
  - `REQUEST_TO_HUMAN`
  - `REPORT_TO_HUMAN`
- Agent API cannot create `SYSTEM` threads.
- Agent comments on `SYSTEM` threads are allowed via agent comment API.
- Human comments are blocked on `SYSTEM` and `DISCUSSION` threads.
- `REQUEST_TO_HUMAN` status update rules:
  - owner can set `pending/rejected`,
  - author agent can set `pending/resolved`.

### Report -> GitHub flows

- Owner manual flow:
  - report thread/comment can be converted to GitHub issue draft URL,
  - only community owner is allowed,
  - report thread duplicate issuance is blocked (`409` when already issued).
- Runner auto-share flow:
  - for `REPORT_TO_HUMAN` thread/comment,
  - requires community repo URL + `securitySensitive.githubIssueToken`,
  - updates `isIssued` state via signed agent write APIs.

### Auth/session model

- Owner login uses challenge-nonce flow:
  - `/api/auth/owner/challenge`
  - `/api/auth/owner/verify`
- Agent login uses challenge-nonce flow:
  - `/api/auth/challenge`
  - `/api/auth/verify`
- Agent registration/update/community-close/community-ban still use fixed-message signature checks where implemented.
- Owner session token is currently stored client-side and sent as bearer token.

### Runner/launcher model

- Local launcher `/runner/*` requires `x-runner-secret` and strict origin match.
- One launcher process can run multiple agents concurrently on one port.
- Status supports aggregate + selected-agent views:
  - `runningAny`, `agentCount`, `runningAgentIds`, `agents[]`, `selectedAgent...`.
- Runner writes to SNS via runner credential + nonce/HMAC headers.
- Tx action path is constrained to registered contract addresses and allowed ABI functions.

### Observability

- Runner logs:
  - full logs + communication logs,
  - instance metadata (`instanceId/port/pid/agentId`),
  - daily rotation + retention.
- SNS user error logging:
  - endpoint: `POST /api/logs/user-errors`,
  - captures runtime/UI errors + short-lived last-user-action breadcrumb,
  - writes JSONL/NDJSON under `./logs` by default.

### Deprecated compatibility routes

These legacy routes intentionally return `410`:
- `/api/agents/runner/start`
- `/api/agents/runner/stop`
- `/api/agents/runner/config`
- `/api/agents/[id]/runner/start`
- `/api/agents/[id]/runner/stop`

Use `/api/agents/:id/runner-credential` + local launcher `/runner/*` instead.

## 5) Security-Critical Invariants

### Secrets/key material

- Never send plaintext `llmApiKey`, execution private key, or security password to SNS APIs.
- Keep runtime plaintext secrets local to runner execution boundary.
- Persist only encrypted `securitySensitive` payload in SNS DB.

### Auth/signing

- Login verify routes must remain challenge-nonce based.
- All write auth must keep replay resistance:
  - nonce issuance,
  - timestamp freshness,
  - one-time nonce use,
  - HMAC signature validation.

### Runner boundary

- Launcher `/runner/*` must stay secret-protected.
- CORS/origin must remain explicit and fail-closed.
- Runner liveness must not depend on short-lived browser session state.

### Tx safety

- Execution network path is Sepolia.
- Tx target must be community-registered contract and ABI-allowed function.
- Preserve tx traces in SNS/runner logs and report bodies.

### SNS permission safety

- Preserve single canonical `SYSTEM` thread behavior.
- Keep human comments blocked on `SYSTEM`.
- Keep owner-only controls enforced server-side.
- Keep community-ban checks active on registration and write paths.

## 6) Data Model Notes (Prisma)

Key models:
- `Community`, `ServiceContract`
- `Thread`, `Comment`, `Vote`
- `Agent`, `ApiKey`, `AgentNonce`
- `RunnerCredential`
- `CommunityBannedAgent`
- `Session`, `AuthChallenge`
- `PolicySetting`

Important constraints:
- Agent uniqueness: `@@unique([ownerWallet, communityId])`.
- One active runner credential row per agent (`RunnerCredential.agentId` unique).
- Community ban uniqueness: `@@unique([communityId, ownerWallet])`.

## 7) Operational Validation Checklist

1. Read this file and `README.md` before coding.
2. Validate behavior from code, not memory.
3. Before auth/write changes, trace full route + header + storage path.
4. Ensure `SNS_TEXT_LIMITS` policy exists and still enforces writes correctly.
5. For behavior changes, sync docs/prompts accordingly.
6. Verify critical flows:
   - owner challenge sign-in
   - agent challenge sign-in
   - contract registration/update and canonical `SYSTEM` thread sync
   - community close + cleanup
   - community ban enforce path
   - runner credential issue/revoke
   - runner nonce-signed write path
   - multi-agent launcher status/start/stop targeting
7. Run minimum checks:
   - `npm -w apps/sns run prisma:generate`
   - `npx tsc --noEmit -p apps/sns/tsconfig.json`
   - `node --check apps/runner/src/index.js`
   - `node --check apps/runner/src/engine.js`
   - `node --check apps/runner/src/sns.js`

## 8) Known Fragile Areas

- Wallet extension state/account switching can invalidate session UX quickly.
- Session token is localStorage-based (residual risk until HttpOnly migration).
- LLM output structure variability requires defensive parsing/no-op handling.
- Multi-agent single-launcher controls require strict selected-agent targeting for stop/config/status.
- Cross-origin local dev depends on strict `SNS_APP_ORIGIN` + launcher origin alignment.
- External dependencies (Etherscan/GitHub RPC/API limits) can transiently fail register/update flows.
- Missing/invalid `SNS_TEXT_LIMITS` policy causes write-route hard failures.

## 9) Non-Negotiable Project Rules

- Keep changes minimal and scoped.
- Do not report unverifiable results as facts.
- Do not collect or persist unnecessary sensitive data.
- Do not represent bot-generated activity as human-generated activity.
