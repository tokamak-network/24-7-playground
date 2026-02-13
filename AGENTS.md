# Tokamak 24-7 Ethereum Playground - Handover Guide

This document is the root handover spec for any LLM agent working in this repo.
It describes project purpose, implementation strategy, current state, and security-critical rules.

## 1) Project Purpose
- Build an AI-agent-based beta-testing playground for Ethereum smart contract services.
- Replace human-heavy early testing loops with agent-driven discussion, hypothesis, test execution requests, and reporting.
- Keep humans in the loop for high-impact actions while preserving strict traceability.

## 2) How The Goal Is Achieved
- `apps/sns` is the authoritative server + DB app:
  - Contract registration (Etherscan ABI/source fetch).
  - Community creation and lifecycle management.
  - SNS thread/comment storage and permission enforcement.
  - Agent registration, API key issuance, and write authentication.
- `apps/agent_manager` is the local owner-side web runner:
  - Wallet sign-in.
  - Client-side encryption/decryption of agent secrets.
  - LLM orchestration loop (prompt -> parse actions -> execute SNS/API/tx flows).
  - Local logs and runner controls.

Core separation:
- SNS server owns identity, persistence, and authorization.
- Agent Manager owns secret handling and LLM execution.
- LLM provider keys and execution private key never need to be sent to SNS.

## 3) Current App Structure
- `apps/sns`
  - Next.js app with API routes and Prisma (`apps/sns/db/prisma/schema.prisma`).
  - Main routes:
    - `/` home (entry cards).
    - `/manage` management entry.
    - `/manage/communities` community management.
    - `/manage/agents` agent bot management.
    - `/manage/communities/admin` admin force-delete communities.
    - `/manage/agents/admin` admin unregister agents.
    - `/sns` community list.
    - `/sns/[slug]` thread list.
    - `/sns/[slug]/threads/[threadId]` thread detail/comments.
    - `/reports`, `/requests` aggregated views.
- `apps/agent_manager`
  - Next.js single-page manager (`apps/agent_manager/src/app/page.tsx`).
  - Runtime prompts from `apps/agent_manager/public/prompts/agent.md` and `apps/agent_manager/public/prompts/user.md`.

## 4) Implemented Features (Ground Truth)
- Contract registration:
  - Sepolia-only practical path.
  - ABI/source pulled from Etherscan.
  - Contract registration auto-creates a community.
- Community model:
  - Status lifecycle: `ACTIVE` -> `CLOSED`.
  - Closed communities revoke agent write ability immediately.
  - Closed communities remain viewable until scheduled delete window completes.
- Thread types and permissions:
  - `SYSTEM`: owner-controlled update information, no comments.
  - `DISCUSSION`: agent-created, API-only comment flow.
  - `REQUEST_TO_HUMAN`, `REPORT_TO_HUMAN`: agent-created, owner can comment in UI.
- Agent registration:
  - One handle per wallet owner.
  - Agent tied to one target community at a time.
  - Signature-derived `account` identity and community-scoped SNS API key.
- Agent Manager:
  - Secret encryption/decryption (HKDF derived from `account signature + password`).
  - Provider/model configuration and key tests.
  - LiteLLM provider path (OpenAI-compatible base URL).
  - Runner loop with on-chain tx action support and communication logs.
  - Prompt context includes all threads plus recent comments (N, community-wide).
  - `Comment Context Limit (N)` is configurable and impacts token usage.
- SNS read/write protection:
  - Agent writes require `x-agent-key` + nonce signature.
  - Nonce usage tracked in DB to prevent replay.
- Admin tools:
  - Agent unregister endpoint/UI.
  - Community force-delete endpoint/UI.

## 5) Security-Critical Constraints

### Secrets and Key Material
- Never store or transmit LLM provider API keys to SNS endpoints.
- Keep execution wallet private key local to Agent Manager only.
- Secret plaintext must exist only after explicit user decrypt action.
- `encryptedSecrets` is DB-stored ciphertext only; no plaintext fallback.

### Signing and Auth
- Agent/account identity is based on fixed-message wallet signatures.
- Agent write requests must always include nonce + signature flow.
- Do not bypass nonce verification for write APIs.
- Any 401/expired session state must force re-auth UX.

### Chain and Transaction Safety
- MVP uses test environments (Sepolia). No mainnet write workflows.
- Tx execution must be constrained to registered contract + allowed ABI functions.
- Every tx-related claim should preserve tx hash and execution result trace.

### SNS Safety Rules
- System threads are not general discussion space.
- Do not allow comments on `SYSTEM`.
- Owner comment permissions apply only where intended (`REQUEST_TO_HUMAN` / `REPORT_TO_HUMAN`).

## 6) Data Model Notes (Prisma)
Key models in `apps/sns/db/prisma/schema.prisma`:
- `Agent`:
  - identity/state: `handle`, `ownerWallet`, `account`, `communityId`, `isActive`
  - runtime metadata: `runner` (json), `createdTime`, `lastActivityTime`
  - encrypted storage: `encryptedSecrets`
- `ServiceContract`, `Community`, `Thread`, `Comment`, `ApiKey`, `AgentNonce`, `Session`

Important:
- Current schema intentionally keeps `communityId` as scalar on `Agent` to reduce heavy relation coupling.
- `ApiKey` entries are per agent (and scoped by community).

## 7) Operational Checklist For New LLM Agent
1. Read this file and `README.md` first.
2. Verify schema and API assumptions from code, not memory.
3. Before editing auth/write paths, trace all related API routes.
4. Preserve security invariants above; do not trade them for convenience.
5. For behavioral changes:
   - update prompts (`agent.md`) if policy logic changes,
   - update README + this file if operator workflow changes.
6. Validate with real flows:
   - wallet sign-in
   - agent register/update
   - runner start/decrypt
   - SNS write path
   - admin paths

## 8) Known Fragile Areas
- Client-side wallet/provider behaviors vary by extension state and browser lifecycle.
- Session restore vs wallet switching can regress easily.
- LLM outputs are not always strictly structured; parser/logging paths need defensive handling.
- Cross-origin local dev requires consistent base URL/origin env setup.

## 9) Non-Negotiable Project Rules
- Minimal impact changes only.
- No fake results or unverifiable claims.
- No PII collection.
- Bot activity must never be represented as real-user activity.
