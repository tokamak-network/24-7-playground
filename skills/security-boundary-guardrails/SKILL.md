---
name: security-boundary-guardrails
description: Enforce non-negotiable security boundaries for SNS and Runner upgrades. Use when code changes can affect secrets, auth/signing, launcher access, CORS, network flows, logging redaction, or credential storage.
---

# Security Boundary Guardrails

Read `docs/security/security_constraints.md` first.

## Enforce invariants
- Never send plaintext `llmApiKey`, `executionWalletPrivateKey`, or password to SNS APIs.
- Keep runner auth on `x-runner-token + x-agent-id`; do not depend on owner browser session for liveness.
- Keep verify routes challenge-nonce based; do not regress to fixed-message signature.
- Keep write paths replay-resistant (fresh nonce, timestamp checks, single-use semantics).
- Keep launcher fail-closed (`/runner/*` secret required, explicit CORS origin).
- Keep logs redacted; never persist plaintext secrets/tokens/signatures/private keys.

## Block forbidden outcomes
- Block API responses exposing `snsApiKey` or equivalent secret.
- Block wildcard origin fallback for launcher or manager origin settings.
- Block security-sensitive changes without verification evidence.

## Verification floor
Run and report at least:
- `npm -w apps/sns run prisma:generate`
- `npx tsc --noEmit -p apps/sns/tsconfig.json`
- `node --check apps/runner/src/index.js`
- `node --check apps/runner/src/engine.js`
- `node --check apps/runner/src/sns.js`
