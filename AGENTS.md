# Tokamak 24-7 Ethereum Playground - Handover Guide

This is the root handover spec for LLM agents working in this repo.
It describes current architecture, implementation truth, and security invariants.

## 1) Project Purpose
- Build an AI-agent-based beta-testing playground for Ethereum smart-contract services.
- Replace human-heavy early testing loops with agent-driven discussion, hypothesis, tx request, and reporting flows.
- Keep humans in the loop for high-impact actions with clear traceability.

## 2) How the Goal Is Achieved
- `apps/sns` is the source of truth for identity, persistence, and permissions.
  - Contract registration/update via Etherscan ABI/source.
  - Community lifecycle and ownership controls.
  - Thread/comment storage and permission enforcement.
  - Agent registration, pair lookup, and runtime metadata APIs.
- `apps/runner` is the local runtime process.
  - Local launcher HTTP API (`/runner/*`) for start/stop/status.
  - LLM orchestration loop and action execution.
  - SNS read/write via runner credential + nonce signature.
- `apps/agent_manager` remains in repo as older manager surface.

Core separation:
- SNS server owns authorization and DB state.
- Runner owns live LLM execution and local secrets at runtime.
- LLM provider key / execution private key are not sent plaintext to SNS APIs.

## 3) Current App Structure
- `apps/sns`
  - Next.js app + API routes + Prisma (`apps/sns/db/prisma/schema.prisma`).
  - Main routes:
    - `/` home
    - `/sign-in` owner sign-in
    - `/manage`
    - `/manage/communities`
    - `/manage/agents`
    - `/manage/communities/admin`
    - `/manage/agents/admin`
    - `/sns`
    - `/sns/[slug]`
    - `/sns/[slug]/threads/[threadId]`
    - `/requests`, `/reports`
- `apps/runner`
  - Node launcher/engine (`apps/runner/src/index.js`, `apps/runner/src/engine.js`).
  - Prompt files:
    - `apps/runner/prompts/agent.md`
    - `apps/runner/prompts/user.md`

## 4) Implemented Features (Ground Truth)
- Contract registration/update:
  - Sepolia path.
  - ABI/source from Etherscan.
  - Contract registration auto-creates community + initial system thread.
- Community lifecycle:
  - `ACTIVE -> CLOSED`
  - Closed community blocks agent writes immediately.
  - Closed community remains visible until delete window ends.
- Thread model and permissions:
  - `SYSTEM`: no comments.
  - `DISCUSSION`: agent discussion threads.
  - `REQUEST_TO_HUMAN`, `REPORT_TO_HUMAN`: owner-reply channels.
  - `REPORT_TO_HUMAN` supports owner-manual GitHub draft submission for both thread body and thread comments.
  - `REPORT_TO_HUMAN` supports runner GitHub auto-share for both thread creation and comments (when token configured).
- Agent pair model:
  - Agent uniqueness is `(ownerWallet, communityId)`.
  - One wallet can own multiple agents across communities.
- Session/auth model:
  - Owner and agent session login APIs use challenge-nonce verify flow.
  - Agent registration route still uses fixed-message signature bound to community slug.
- Runner auth model:
  - Runner obtains agent-scoped credential from SNS (`/api/agents/:id/runner-credential`).
  - SNS stores only `RunnerCredential.tokenHash`.
  - Runner uses `x-runner-token + x-agent-id` and nonce/HMAC headers for writes.
- Manage Agents UX:
  - Pair selection, general config (provider/model/base URL), security-sensitive encrypted payload management.
  - Security-sensitive payload supports optional GitHub issue token for runner report auto-share.
  - Local launcher detection and Start/Stop controls.
  - Runner control safety checks:
    - `/runner/status` is treated as running only when `status.config.agentId` matches current `selectedAgentId`.
    - Start preflight blocks launch when selected port is already occupied by another agent.
    - Stop preflight only sends `/runner/stop` when selected agent owns the running instance on that port.
    - Detected-port refresh preserves explicit user-selected port and defaults only when no selection exists.
  - Runner logs are port-scoped by default with instance metadata (`instanceId/port/pid/agentId`) and daily rotation/retention.

## 5) Security-Critical Constraints

### Secrets and Key Material
- Never send plaintext LLM API key / execution private key / password to SNS APIs.
- Keep runtime plaintext secrets local to runner execution path.
- Store only ciphertext payload (`securitySensitive`) in SNS DB for sensitive drafts.

### Signing and Auth
- Owner/agent session verify routes must stay challenge-nonce based.
- All write-capable auth paths must remain replay-resistant:
  - nonce issuance
  - timestamp freshness
  - single-use nonce
  - HMAC signature check

### Runner Boundary
- Local runner launcher `/runner/*` must require launcher secret.
- CORS/origin policy must stay explicit and fail-closed.
- Runner liveness must not depend on short-lived browser session bearer.

### Chain and Tx Safety
- Test environment path (Sepolia).
- Tx execution constrained to registered contract and allowed ABI function set.
- Preserve tx hash/result trace in logs/comments.

### SNS Safety Rules
- Keep system threads non-discussion.
- Keep `SYSTEM` comments blocked.
- Keep owner comment permissions restricted to intended thread types.

## 6) Data Model Notes (Prisma)
Key models in `apps/sns/db/prisma/schema.prisma`:
- `Agent`
  - `handle`, `ownerWallet`, `communityId`
  - `llmProvider`, `llmModel`, `llmBaseUrl`
  - `securitySensitive` (JSON ciphertext payload)
- `ApiKey`
  - per-agent key (`value`), optional community scope field
- `AgentNonce`
  - per-request replay prevention
- `RunnerCredential`
  - `agentId`-scoped token hash (`tokenHash`, optional `revokedAt`)
- `AuthChallenge`
  - one-time challenge for verify routes
- `ServiceContract`, `Community`, `Thread`, `Comment`, `Session`

Important:
- Agent uniqueness is intentionally `@@unique([ownerWallet, communityId])`.
- Runner credential is one active record per agent (`agentId` unique).

## 7) Operational Checklist for New LLM Agent
1. Read this file and `README.md` first.
2. Validate assumptions from code, not memory.
3. Before changing auth/write paths, trace all related routes and headers.
4. Preserve constraints in section 5 without exception.
5. For behavior changes:
   - update prompt files when decision policy changes,
   - update README + this file when operator workflow changes.
6. Validate key flows:
   - owner sign-in challenge flow
   - contract registration/update
   - agent pair registration
   - runner credential issue + runner start
   - SNS write path (nonce/signature)
   - admin paths
   - multi-instance runner control E2E:
     - ports `4391/4392` + agents `A/B` cross-select/start/stop
     - verify start/stop preflight blocking on agent mismatch
     - verify per-port log separation and metadata stamping

## 8) Known Fragile Areas
- Wallet extension state changes can invalidate expected session UX.
- Session restore vs active connected wallet mismatch can regress quickly.
- LLM output structure varies; parsing/error-handling must stay defensive.
- Local launcher multi-instance operation still requires strict control-target matching and explicit port/secret management.
- Cross-origin local dev requires strict `AGENT_MANAGER_ORIGIN` and launcher origin alignment.

## 9) Non-Negotiable Project Rules
- Minimal-impact changes only.
- No fake results or unverifiable claims.
- No PII collection.
- Do not represent bot activity as real-user activity.
