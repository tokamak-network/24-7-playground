---
name: deploy-build-guardrails
description: Prevent deploy/build failures for SNS and Runner by enforcing guardrails around Next.js render mode, Prisma/DB access timing, environment wiring, and pre-merge verification. Use when changing build scripts, route segment config (`dynamic`/`revalidate`), Prisma usage, or Vercel deployment settings.
---

# Deploy Build Guardrails

Use this skill whenever a change can affect CI/Vercel build success.

## 1) Scope And Risk Classification

Treat the change as `P1` at minimum when one or more are true:
- `apps/sns/src/app/**` page/route segment config changes (`dynamic`, `revalidate`, `runtime`, `preferredRegion`)
- New Prisma reads/writes are introduced in server components or route handlers
- `apps/sns/package.json` build or Prisma scripts change
- Vercel env/region assumptions change

Escalate to `P0` if the change can weaken security boundaries while fixing build failures.

## 2) Build-Phase Triage Contract

Classify failure before patching:
1. Install phase failure (`npm`/dependency resolution)
2. Type/compile phase failure (`tsc`, syntax)
3. Next.js build phase failure (`next build`)
4. Static export/prerender failure (`Export encountered errors on following paths`)
5. Runtime-only startup failure (deployment succeeds, requests fail)

Do not patch blindly. Record exact failing phase and failing route/file first.

## 3) Next.js Rendering Guardrails (Critical)

For pages that call Prisma-backed functions directly in server components:
- Default to `export const dynamic = "force-dynamic"` unless build-time DB access is explicitly required and guaranteed.
- Do not switch such pages to ISR (`revalidate`) without confirming DB is reachable during build/prerender.

If log shows:
- `Export encountered errors on following paths: /...`
- plus Prisma connection errors in the same build

then first-choice remediation is:
- move that page back to runtime rendering (`dynamic = "force-dynamic"`), or
- remove build-time DB dependency from that page.

Keep this invariant:
- Build success must not depend on transient database availability unless the team explicitly accepts that dependency.

## 4) Prisma And Database Guardrails

- Keep SNS build script at generate-only (`prisma generate`) + `next build`; do not run migrations in deploy build.
- Ensure Prisma client generation is deterministic and tied to schema path:
  - `npm -w apps/sns run prisma:generate`
- If a route/page is intentionally prerendered and hits DB, verify deployment DB connectivity and credentials in the target environment before merging.
- Avoid module-scope Prisma queries that execute at import/build time.

## 5) Environment Guardrails

Before merge, validate required env presence for the affected surface:
- `DATABASE_URL` for SNS runtime (and build too if prerendered DB routes exist)
- Any new `process.env.*` key introduced by the change

Rules:
- No silent fallback for required production secrets.
- Fail with explicit error messages when env is missing.
- Keep preview/prod environment parity for required deploy-time keys.

## 6) Route-Level Safety Checklist

For every changed page/route handler in `apps/sns/src/app/**`:
1. Identify whether it is evaluated at build or request time.
2. List external dependencies touched during that phase (DB, API, filesystem).
3. Verify non-deterministic network calls are not introduced into build-time paths unintentionally.
4. For polling/live UI pages, prefer request-time or client fetch paths over build-time DB coupling.

## 7) Verification Floor (Mandatory)

Run and report at least:
- `npm -w apps/sns run prisma:generate`
- `npx tsc --noEmit -p apps/sns/tsconfig.json`
- `npm -w apps/sns run build`
- `node --check apps/runner/src/index.js`
- `node --check apps/runner/src/engine.js`
- `node --check apps/runner/src/sns.js`

Behavior checks:
- Confirm at least one changed path still works at runtime.
- Confirm at least one expected failure path is explicit (e.g., missing env) rather than opaque build crash.

## 8) Stop Conditions (Re-Design Required)

Stop and re-plan if any of these appear:
- Fix requires weakening auth/security/CORS boundary
- Fix requires making production build depend on unstable third-party/network resources without fallback
- Build passes only with local-only assumptions not reproducible in CI/Vercel

In stop cases, use:
- `upgrade-scope-triage`
- `upgrade-verification-matrix`
- plus domain guardrails (`security-boundary-guardrails`, `schema-migration-guardrails`, etc.) as applicable.
