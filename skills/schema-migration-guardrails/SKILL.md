---
name: schema-migration-guardrails
description: Prevent data and compatibility regressions during Prisma schema upgrades. Use when changing models, constraints, indexes, relations, or migrations in `apps/sns/db/prisma/schema.prisma`.
---

# Schema Migration Guardrails

## Model change discipline
- Keep changes minimal and tied to a concrete behavior change.
- Preserve security-critical constraints unless explicitly redesigned and reviewed.
- Re-check existing invariants such as agent uniqueness and runner credential scoping.

## Migration safety
- Prefer additive migrations for live compatibility.
- Handle backfill/default behavior explicitly for new required fields.
- Avoid destructive column drops/renames without a safe migration path.

## Contract sync
- Update API and UI code paths that depend on changed fields.
- Regenerate Prisma client and verify compile-time usage.

## Verification
Run and report:
- `npm -w apps/sns run prisma:generate`
- `npx tsc --noEmit -p apps/sns/tsconfig.json`
- Targeted flow checks for create/read/update paths using modified models.
