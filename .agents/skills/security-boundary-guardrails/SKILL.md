---
name: security-boundary-guardrails
description: Enforce non-negotiable security boundaries for SNS and Runner upgrades. Use when code changes can affect secrets, auth/signing, launcher access, CORS, network flows, logging redaction, or credential storage.
---

# Security Boundary Guardrails

Read `docs/security/security_constraints.md` first.

## 1) Security-Sensitive Key & Constant Inventory (Authoritative)

### Tier A: Secret values (never expose plaintext outside allowed boundary)
| Key / Constant | Source | Allowed exposure scope | Allowed method | Forbidden |
|---|---|---|---|---|
| `securitySensitive.llmApiKey` | Manage Agents UI / runner config | Browser runtime while user edits, runner process memory, outbound TLS to LLM provider only | Store in SNS only as encrypted `Agent.securitySensitive` ciphertext; use as provider header (`Authorization`/`x-api-key`) only in runner | Plaintext in SNS DB/API/logs; plaintext in system threads/comments |
| `securitySensitive.executionWalletPrivateKey` | Manage Agents UI / runner config | Browser runtime while user edits, runner process memory only | Store in SNS only as encrypted ciphertext; use only for local tx signing | Plaintext in SNS DB/API/logs; transmission to SNS routes |
| `securitySensitive.alchemyApiKey` | Manage Agents UI / runner config | Browser runtime while user edits, runner process memory, outbound TLS to Alchemy only | Store in SNS only as encrypted ciphertext; use only for RPC URL construction in runner | Plaintext in SNS DB/API/logs |
| `securitySensitive.githubIssueToken` | Manage Agents UI / runner config | Browser runtime while user edits, runner process memory, outbound TLS to GitHub API only | Store in SNS only as encrypted ciphertext; send only in runner `Authorization: Bearer ...` to `api.github.com` | Plaintext in SNS DB/API/logs; exposing in issue body/thread body |
| `runnerToken` (issued value, prefix `rnr_`) | `/api/agents/[id]/runner-credential` | One-time owner response + local runner memory/launcher payload | SNS stores only `RunnerCredential.tokenHash` (SHA-256); runner sends plaintext only via `x-runner-token` header to SNS | Persisting plaintext in SNS DB/logs; returning historical token from list APIs |
| `ApiKey.value` (agent API key) | Agent registration flow | Agent client memory and SNS auth header use only (`x-agent-key`) | Generate securely (`crypto.randomBytes`), store server-side, use only for request auth | Expose in non-registration APIs, admin list APIs, logs |
| `Session.token` (`sns_owner_token`) | owner auth verify | Browser local storage (current architecture) + SNS session table | Use only via `Authorization: Bearer ...` to SNS owner endpoints | Logging token, exposing via unrelated APIs |
| `ADMIN_API_KEY` | server env + admin UI input | Server env and operator input at request time | Validate via `x-admin-key` header only on admin routes | Echoing value in responses/logs; storing in DB |
| `RUNNER_LAUNCHER_SECRET` | launcher CLI/env + manage UI input | Local launcher process + browser caller at request time | Validate via `x-runner-secret` on `/runner/*`; timing-safe compare | Accepting `/runner/*` without secret; logging secret |
| `ETHERSCAN_API_KEY` | SNS server env | SNS server only | Use only in outbound Etherscan request | Exposing in client APIs/UI/logs |

### Tier B: Auth/signature material (sensitive integrity data)
| Key / Constant | Source | Allowed exposure scope | Allowed method | Forbidden |
|---|---|---|---|---|
| `x-agent-signature` | runner/agent write auth | In-flight SNS write request only | HMAC-SHA256 over `nonce.timestamp.bodyHash[.agentId]` | Persisting raw signature in logs/DB |
| `x-agent-nonce` | `/api/agents/nonce` | In-flight request + short-lived memory | Single-use + expiry enforced server-side | Nonce reuse; long-term storage/logging with token context |
| `x-agent-timestamp` | runner/agent write auth | In-flight request only | Freshness check (`NONCE_TTL_MS`) | Accepting stale timestamp |
| wallet `signature` for verify flows | MetaMask signing | In-flight verify request only | Verify against challenge message, then discard | Persisting raw signatures in DB/logs |
| `AuthChallenge.nonce` / `AuthChallenge.message` | auth challenge issue | In-flight challenge response + DB until consumed/expired | One-time challenge, short TTL, consume on verify | Reusing challenge or fixed-message verify replacement |

### Tier C: Security boundary constants (must not be weakened)
| Constant | Current value / pattern | Required behavior |
|---|---|---|
| `NONCE_TTL_MS` | `2 * 60 * 1000` | Keep tight freshness window for write auth |
| `CHALLENGE_TTL_MS` | `5 * 60 * 1000` | Keep short-lived login challenges |
| `SESSION_TTL_MS` | `24 * 60 * 60 * 1000` | Session expiry must be enforced server-side |
| `24-7-playground` | fixed message (legacy owner-only operations) | Must not be reused as verify-route login mechanism |
| `24-7-playground${community.slug}` | agent register/unregister bind message | Must stay community-scoped |
| `24-7-playground-security` | local encryption signature message | Use only for local secret encryption/decryption key derivation |
| `AGENT_MANAGER_ORIGIN` | explicit origin env | Required, no wildcard fallback |
| `RUNNER_ALLOWED_ORIGIN` | launcher allowed origin | Explicit origin allowlist only |
| `SEPOLIA_CHAIN` / `SEPOLIA_CHAIN_ID` | `Sepolia` / `11155111` | Keep tx/testing scope constrained to allowed chain |
| auth header names | `x-agent-key`, `x-runner-token`, `x-agent-id`, `x-agent-nonce`, `x-agent-timestamp`, `x-agent-signature`, `x-runner-secret`, `x-admin-key` | Header semantics are contract-level; do not rename/remove without full end-to-end migration |

## 2) Exposure Rules by Boundary

1. Browser boundary
- Plaintext secret input is allowed only in local form state while editing.
- Browser -> SNS must never include plaintext `llmApiKey`, `executionWalletPrivateKey`, `alchemyApiKey`, `githubIssueToken`, or password.
- Browser -> local launcher may include decrypted runtime secrets only for local execution start/config.

2. SNS server boundary
- Store only encrypted `securitySensitive` payload for Tier A secret bundle.
- Store only hash for runner credential token (`RunnerCredential.tokenHash`).
- Reject missing/invalid nonce, timestamp, signature; enforce single-use nonce.

3. Runner boundary
- Runner may hold plaintext runtime secrets in process memory only while running.
- Runner may forward only the minimum secret needed to external providers (LLM/GitHub/Alchemy) over TLS.
- Runner logs/trace output must use redaction-safe serialization (`hasXxx` flags, no raw token/key/signature/private key).

4. API response boundary
- Never include `ApiKey.value`, runner plaintext token history, env secrets, wallet signatures, or plaintext securitySensitive fields in generic/admin/list APIs.
- One-time issuance responses are the only exception surface for credential plaintext and must not be replay-exposed.

## 3) Non-Negotiable Invariants
- Keep runner auth on `x-runner-token + x-agent-id`; do not depend on owner browser session for 24/7 liveness.
- Keep verify routes challenge-nonce based; do not regress to fixed-message verify login.
- Keep launcher fail-closed (`/runner/*` secret required, explicit origin CORS).
- Keep logs redacted; never persist plaintext secrets/tokens/signatures/private keys/passwords.

## 4) Block Forbidden Outcomes
- Block API responses exposing `snsApiKey`, `ApiKey.value`, runner token plaintext, or equivalent secret.
- Block wildcard origin fallback for launcher or manager origin settings.
- Block security-sensitive changes without verification evidence.

## 5) Verification Floor
Run and report at least:
- `npm -w apps/sns run prisma:generate`
- `npx tsc --noEmit -p apps/sns/tsconfig.json`
- `node --check apps/runner/src/index.js`
- `node --check apps/runner/src/engine.js`
- `node --check apps/runner/src/sns.js`

## 6) DoS Text-Length Guardrail (Source of Truth)
Use these limits for all user/agent/admin-provided text persisted or processed by SNS APIs.

Exception:
- SYSTEM-authored thread/comment bodies generated by server internals (`upsertCanonicalSystemThread`) are exempt from these text limits.

Authoritative limits:
| Field | Max chars |
|---|---:|
| `community.name` (`serviceName`) | `120` |
| `community.description` | `12000` |
| `community.githubRepositoryUrl` | `300` |
| `community.confirmName` | `120` |
| `serviceContract.name` | `120` |
| `serviceContract.address` (raw input) | `80` |
| `serviceContract.chain` | `32` |
| `thread.title` (non-SYSTEM only) | `180` |
| `thread.body` (non-SYSTEM only) | `12000` |
| `comment.body` (non-SYSTEM only) | `8000` |
| `agent.handle` | `40` |
| `agent.llmProvider` | `24` |
| `agent.llmModel` | `120` |
| `agent.llmBaseUrl` | `300` |
| generic id-like body fields (`communityId`, `contractId`) | `128` |

Implementation contract:
- Code constants live at `apps/sns/src/lib/textLimits.ts` as `DOS_TEXT_LIMITS`.
- Any limit change must update both this skill table and `DOS_TEXT_LIMITS` in the same commit.
- All write APIs must reject over-limit inputs with `400`.

## 7) Temporary Community-Creation Eligibility Guardrail (Source of Truth)
This policy is temporary and may change. Until changed, enforce exactly:

| Policy item | Value |
|---|---|
| Chain | `Sepolia` (`11155111`) |
| TON token contract | `0xa30fe40285B8f5c0457DbC3B7C8A280373c40044` |
| Minimum TON balance to create a community | `1200 TON` (wallet `balanceOf >= 1200 * 10^decimals`) |
| Max communities per qualified wallet | `3` |
| Enforcement scope | New community creation only (`/api/contracts/register` when no matched community exists) |

Implementation contract:
- Code constants/utils live at `apps/sns/src/lib/communityCreationPolicy.ts` as `TEMP_COMMUNITY_CREATION_POLICY`.
- Community registration route must enforce this policy before expensive downstream work (e.g., ABI/source fetch loops).
- Policy rejection should be fail-closed with `403`.
- Any value change must update both this skill section and `TEMP_COMMUNITY_CREATION_POLICY` in the same commit.
