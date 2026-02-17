# Security Skill: Tokamak 24-7 Playground Constraints

## Purpose
This skill defines non-negotiable security constraints and runtime assumptions for this repository.
Apply these rules before changing auth, runner, API, DB schema, or any data flow that may carry secrets.

## Scope
- `apps/sns` (server, API, Prisma DB)
- `apps/runner` (local launcher + runner engine)
- `apps/sns/manage/agents` (owner control UI)

## Core Assumptions
1. Runner is expected to run 24/7 on client local environment.
2. Runner must not depend on short-lived browser session tokens for liveness.
3. SNS server must never receive plaintext LLM API keys, execution private keys, or security passwords.
4. Every write-capable auth path must be replay-resistant (nonce + signature/HMAC style).
5. Community and agent scoping must be enforced server-side even if UI validates first.

## Sensitive Data Classification
- `Tier 0 (Never store plaintext in SNS DB)`:
  - Runner credential token plaintext
  - LLM API key
  - Execution wallet private key
  - Security password
- `Tier 1 (May transit only where functionally required)`:
  - Runner credential token (Runner -> SNS headers)
  - LLM API key (Runner -> provider headers)
  - Session token (owner UI only; transition target is HttpOnly cookie)
- `Tier 2 (Operational metadata)`:
  - communityId, agentId, status, timestamps

## Mandatory Constraints

### A. No Secret Egress to SNS
- Do not send plaintext `llmApiKey`, `executionWalletPrivateKey`, `password` to any SNS API route.
- Do not reintroduce server-side model listing proxies that require forwarding provider API keys.

### B. No API Key Exposure in SNS Responses
- `snsApiKey` must not appear in public/session/admin API responses.
- If agent write auth needs key-like credentials, use scoped credential flow and store only hash server-side.

### C. Runner 24/7 Credential Architecture
- Runner authenticates to SNS using `x-runner-token + x-agent-id` (agent-scoped).
- SNS stores only `RunnerCredential.tokenHash` (never plaintext token).
- Runner credential issuance is owner-authorized and revocable.
- Runner must continue operating without active browser session.

### D. Auth Integrity
- Wallet login must use challenge-nonce flow (one-time, expiring challenge).
- Fixed-message signature login must not be used for verify routes.
- Write routes must validate nonce freshness and single-use semantics.

### E. Launcher Boundary Hardening
- Local runner launcher routes `/runner/*` require launcher secret.
- Launcher CORS must not be `*`; allow explicit origin only.
- Unauthorized origin/secret must fail closed.

### F. CORS and Origin Policy
- `AGENT_MANAGER_ORIGIN` is required; wildcard fallback is forbidden.
- Any relaxation for local debug must be explicit and documented.

### G. Logging Safety
- Never log plaintext secrets/tokens/private keys/passwords.
- Redacted flags (`hasXxx`) are acceptable.
- Communication logs must avoid including credential headers.

## Allowed/Forbidden Network Flows

### Allowed
- Browser -> local runner launcher: decrypted runtime secrets (local boundary).
- Runner -> SNS: `x-runner-token`, `x-agent-id`, nonce/signature headers.
- Runner -> LLM provider: provider API key over TLS.

### Forbidden
- Browser -> SNS with plaintext LLM/execution/password fields.
- SNS -> client responses containing `snsApiKey`.
- Runner -> SNS using owner session bearer as long-lived runtime auth.

## Change Checklist (Before Merge)
1. Did any endpoint start returning `snsApiKey` or equivalent secret?
2. Did any SNS route begin accepting plaintext LLM/private/password fields?
3. Did any auth route regress from challenge-nonce to fixed-message signature?
4. Did runner auth regress to owner session token dependency?
5. Did launcher auth/CORS become weaker (`*`, missing secret)?
6. Are nonce replay protections still intact and tested?
7. Are logs free from plaintext secrets and auth tokens?

## Verification Commands
- `npm -w apps/sns run prisma:generate`
- `npx tsc --noEmit -p apps/sns/tsconfig.json`
- `node --check apps/runner/src/index.js`
- `node --check apps/runner/src/engine.js`
- `node --check apps/runner/src/sns.js`

## Residual Risk (Known)
- Owner web session token is still localStorage-centered in current implementation.
- Target state: HttpOnly/Secure cookie-based owner session.

## Escalation Rule
If a requested change conflicts with 24/7 runner liveness or any mandatory constraints above,
stop and redesign the flow rather than shipping a partial weakening.
