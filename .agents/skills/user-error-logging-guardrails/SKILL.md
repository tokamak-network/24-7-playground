---
name: user-error-logging-guardrails
description: Define and govern SNS user-error log collection scope, source types, payload minima, and sync rules for dev-maintenance observability.
---

# User Error Logging Guardrails

Use this skill when adding/removing/changing SNS user error log collection behavior.

## 1) Scope
- This skill governs "which user error logs SNS collects" and "how collection contracts are versioned."
- This skill does not replace security boundary constraints. Secret exposure and redaction rules remain governed by:
  - `.agents/skills/security-boundary-guardrails/SKILL.md`

## 2) Required Log Source Types
| Log `source` value | Trigger condition | Minimum required fields | Sensitive handling notes |
|---|---|---|---|
| `window.error` | Browser runtime uncaught error event | `source`, `message`, `pathname`, `url`, `context.filename`, `context.lineno`, `context.colno` | Never include secrets/tokens/private keys in `message`/`context` |
| `window.unhandledrejection` | Browser unhandled promise rejection | `source`, `message`, `pathname`, `url` | `context` is allowed only as sanitized preview-safe JSON |
| `next.error-boundary` | Next.js app-level error boundary fallback render | `source`, `message`, `pathname`, `url` | `stack` optional; do not include server secrets in client-sent data |
| `status-bubble` | Global SNS status bubble emits error-kind message | `source`, `message`, `pathname`, `url` | Message should remain user-facing error text only |
| `manage-agents-bubble` | Manage Agents page local bubble emits error-kind message | `source`, `message`, `pathname`, `url` | Do not attach decrypted security-sensitive payloads |

## 3) Collection Behavior Rules
- Logging must stay fail-open: logging failure must never break user flows.
- `walletAddress` may be included for triage, but must not be treated as secret-auth material.
- `context` must be size-limited and serialization-safe.
- Keep dedupe/rate limiting to reduce repeated client-noise and DoS pressure.
- Keep payload as minimal as possible for operational debugging.

## 4) Sync Rule (Non-Negotiable)
- When adding/removing/renaming any user error log source in code, update this skill in the same change.
- Keep producer/ingest/persistence implementations aligned with this skill:
  - producers: `apps/sns/src/components/UserErrorLogger.tsx`, `apps/sns/src/components/StatusBubbleBridge.tsx`, `apps/sns/src/app/manage/agents/page.tsx`, `apps/sns/src/app/error.tsx`
  - ingest: `apps/sns/src/app/api/logs/user-errors/route.ts`
  - persistence: `apps/sns/src/lib/userErrorLogServer.ts`

## 5) Verification Floor
- At minimum, run and report:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json`
