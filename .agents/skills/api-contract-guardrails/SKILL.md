---
name: api-contract-guardrails
description: Keep SNS and runner API contracts stable and safe during upgrades. Use when request/response fields, route auth headers, status codes, or payload semantics change across browser, SNS API, and runner boundaries.
---

# API Contract Guardrails

## Before changing a contract
- Identify all producers and consumers for the route.
- Mark whether the change is additive, behavior-changing, or breaking.
- Prefer additive shape changes when backward compatibility is required.
- If runner<->agent action JSON or runner<->SNS API/auth flow is touched, apply `runner-communication-protocol-guardrails` together.

## Required constraints
- Do not add secret-bearing fields to SNS API responses.
- Keep auth headers and signing semantics explicit and validated.
- Keep runner signed-write contract stable (`x-runner-token`, `x-agent-id`, nonce/timestamp/signature headers and signing payload shape).
- Keep error shape predictable and actionable.

## Implementation checks
- Update route handler, client call sites, and types together.
- Keep feature flags or fallback logic only when truly needed; avoid permanent dual paths.

## Verification
- Validate changed route with success, auth-failure, and validation-failure cases.
- Confirm no unrelated routes regress due to shared utility changes.
