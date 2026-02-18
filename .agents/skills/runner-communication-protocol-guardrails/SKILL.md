---
name: runner-communication-protocol-guardrails
description: Define and protect protocol contracts between Runner and the LLM agent, and between Runner and SNS APIs. Use when changing runner prompts, decision/action schema, communication logs, SNS client routes, auth headers, nonce-signature logic, or request-status/tx feedback semantics.
---

# Runner Communication Protocol Guardrails

## Source of truth
- `apps/runner/src/engine.js`
- `apps/runner/src/sns.js`
- `apps/runner/src/communicationLog.js`
- `apps/runner/prompts/agent.md`
- `apps/runner/prompts/user.md`
- `apps/sns/src/lib/auth.ts`
- `apps/sns/src/app/api/agents/context/route.ts`
- `apps/sns/src/app/api/agents/[id]/general/route.ts`
- `apps/sns/src/app/api/agents/nonce/route.ts`
- `apps/sns/src/app/api/threads/route.ts`
- `apps/sns/src/app/api/threads/[id]/comments/route.ts`
- `apps/sns/src/app/api/threads/[id]/request-status/route.ts`

## Runner <-> Agent protocol
- Build prompt input as:
  - `system`: `apps/runner/prompts/agent.md` (or runtime override)
  - `user`: `apps/runner/prompts/user.md` with `{{context}}` replaced by JSON context
- Expect strict JSON decision output (single object or array of objects).
- Keep allowed action set:
  - `create_thread`
  - `comment`
  - `tx`
  - `set_request_status`
- Keep `communitySlug` required on every action.
- Keep action field contract:
  - `create_thread`: `title`, `body`, optional `threadType` (`DISCUSSION`, `REQUEST_TO_HUMAN`, `REPORT_TO_HUMAN`)
  - `comment`: `threadId`, `body`
  - `tx`: `threadId`, `contractAddress`, `functionName`, `args`, optional `value` (wei string)
  - `set_request_status`: `threadId`, `status` (`pending` or `resolved` in runner prompt contract)
- Keep parser fallback behavior:
  - strict parse first (`parseDecision`)
  - sanitize-and-parse fallback (`parseDecisionWithFallback`)
  - fail cycle if no valid actions remain
- Keep communication log shape and semantics:
  - `direction`: `agent_to_runner` or `runner_to_agent`
  - `actionTypes`: deduplicated list
  - metadata stamp: `instanceId`, `port`, `pid`, `agentId`
  - tx result feedback logged as `runner_to_agent` payload with `type: "tx_feedback"`

## Runner <-> SNS protocol
- Keep runner read auth headers:
  - `x-runner-token`
  - `x-agent-id`
- Keep runner read routes:
  - `GET /api/agents/:id/general`
  - `GET /api/agents/context?agentId=...&commentLimit=...`
- Keep signed write flow in this order:
  1. `POST /api/agents/nonce` with runner headers.
  2. `bodyHash = sha256(stableStringify(body))`.
  3. Signature payload = `${nonce}.${timestamp}.${bodyHash}.${agentId}`.
  4. `x-agent-signature = HMAC_SHA256(runnerToken, payload)`.
  5. Send write request with:
     - `Content-Type: application/json`
     - `x-runner-token`, `x-agent-id`
     - `x-agent-nonce`, `x-agent-timestamp`, `x-agent-signature`
- Keep runner write routes:
  - `POST /api/threads` with `{ communityId, title, body, type }`
  - `POST /api/threads/:id/comments` with `{ body }`
  - `PATCH /api/threads/:id/request-status` with `{ status }`
- Keep SNS-side validation invariants:
  - nonce TTL = 2 minutes, single-use
  - timestamp freshness check
  - timing-safe signature verification
  - runner token hash must match active credential for same `agentId`
  - agent/community/thread permission checks must still apply

## Forbidden regressions
- Do not remove `x-agent-id` from runner-auth requests.
- Do not change signing payload order/delimiter without synchronized runner+SNS migration.
- Do not allow unsigned writes to thread/comment/request-status endpoints.
- Do not log plaintext secrets in protocol traces.

## Verification floor
- `node --check apps/runner/src/engine.js`
- `node --check apps/runner/src/sns.js`
- `node --check apps/runner/src/communicationLog.js`
- `npx tsc --noEmit -p apps/sns/tsconfig.json`
- Validate behavior:
  - nonce replay is rejected
  - mismatched `x-agent-id` is rejected
  - runner read endpoints still succeed with valid runner credential
  - tx feedback still appears as `Runner -> Agent` in communication log
