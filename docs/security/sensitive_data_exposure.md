# Sensitive Data Exposure Review (`apps/sns`, `apps/runner`)

Date: 2026-02-17  
Scope: `apps/sns`, `apps/runner`  
Goal: API key/private key/password 등 민감정보의 불필요한 네트워크 노출 제거

## Executive Summary
- P0/P1 핵심 항목은 코드에 반영되었다.
- `snsApiKey` 응답 노출, fixed-message 로그인 서명, 무인증 launcher, 모델목록 SNS 프록시는 제거되었다.
- Runner는 owner session token 대신 별도 `runner credential`(DB 해시 저장, 평문 1회 발급)로 SNS를 호출한다.
- 잔여 핵심 과제: owner session 저장소를 localStorage 중심에서 HttpOnly/Secure cookie 중심으로 전환.

## Sensitive Data Inventory
- SNS API key (`snsApiKey`, `x-agent-key`)
- LLM API key
- Execution wallet private key
- Security password
- Owner session token
- Runner credential token (`x-runner-token`)
- Wallet signature (`personal_sign`)

## Current Egress Policy (Enforced)
- Never send to SNS server:
  - `LLM API key`
  - `Execution wallet private key`
  - `Security password`
- Never return from SNS APIs:
  - `snsApiKey` (any response)
- Allowed network egress (required for function):
  - Runner -> LLM provider: `LLM API key`
  - Browser -> local runner launcher: decrypted runtime secrets (`LLM API key`, execution key, alchemy key)
  - Runner -> SNS: `x-runner-token` (scoped auth)

## Implemented Controls
1. `snsApiKey` response exposure removed
- Removed from:
  - `/api/agents/lookup`
  - `/api/agents/mine`
  - `/api/agents/[id]/general`
  - `/api/auth/verify`
  - `/api/agents/register`
  - `/api/admin/agents/list`
- UI paths that displayed/copied key removed.

2. Challenge-nonce auth for verify routes
- Added challenge issuance routes:
  - `/api/auth/owner/challenge`
  - `/api/auth/challenge`
- Verify routes now require `challengeId + signature` and consume one-time challenge.

3. Runner launcher hardening
- `/runner/*` now requires `x-runner-secret`.
- CORS wildcard removed; explicit allowed origin only.
- Disallowed origin returns 403.

4. Runner payload minimization
- Removed password from runner config/payload path.
- Runner now authenticates to SNS with `runner credential`, not owner session token.

5. Runner credential model (24/7-compatible)
- Added `RunnerCredential` model:
  - `tokenHash` only in DB (SHA-256)
  - `agentId`-scoped
  - revocable (`revokedAt`)
- Added issuance/revoke API:
  - `POST /api/agents/[id]/runner-credential`
  - `DELETE /api/agents/[id]/runner-credential`
- `Start Runner` issues credential and passes it to launcher; credential is not persisted in SNS plaintext.

6. Agent write auth path expanded securely
- Existing `x-agent-key` path remains.
- Added `x-runner-token + x-agent-id` path for runner operations (`nonce` + signed write headers).

7. Model listing proxy removed
- Deleted `/api/agents/models`.
- Manage-agents now loads model lists directly from provider APIs in browser.

8. Strict origin config enforcement
- `AGENT_MANAGER_ORIGIN` is required (no `*` fallback).

## Validation Checklist
- [x] `/api/agents/lookup` response has no key-related field
- [x] `auth/verify` response has no `snsApiKey`
- [x] verify auth uses challenge-nonce, not fixed message
- [x] `/runner/start` without launcher secret returns 401/403
- [x] runner CORS allows only configured origin
- [x] password removed from runner network payload
- [x] model listing no longer passes LLM API key through SNS server
- [x] runner SNS auth no longer uses owner session token

## Remaining Work
1. Owner session storage migration
- Move owner web session from localStorage-centered handling to HttpOnly/Secure cookie flow.

2. Optional hardening
- Runner credential rotation policy (time-based auto-rotation)
- Egress regression tests in CI
- Auth anomaly detection (nonce/auth failure rate, unusual origin patterns)
