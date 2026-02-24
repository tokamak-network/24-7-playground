---
name: docs-and-handover-guardrails
description: Keep operator and handover documentation aligned with behavior changes. Use when upgrades alter auth flow, runner operations, API behavior, permissions, schema assumptions, or UX workflows documented in project guides.
---

# Docs And Handover Guardrails

## Update requirements
- Update `README.md` when setup/run/operational behavior changes.
- Update `AGENTS.md` when architecture truth, security invariants, or validation checklist changes.
- Update `.agents/tasks/todo.md` with checklist progress and a final review note.
- When runner communication or secret-flow behavior changes, update:
  - `docs/published/how-it-works/page.md`
  - `docs/published/security-notes/page.md`
  - related guardrail skills under `.agents/skills/` in the same change set.
- In this repository, when updating `README.md`, limit edits to:
  - `Current Development Status`
  - usage commands (run/build/test/serve style command snippets)
  - Do not expand README into full handover-level detail.

## Content quality rules
- Write all documentation in English.
- Document only confirmed behavior from code and checks.
- Keep wording concrete and testable.
- Remove stale statements rather than layering contradictory notes.
- For communication/security topics, treat `docs/published/how-it-works/page.md` and `docs/published/security-notes/page.md` as latest operator-facing source-of-truth and keep skills synchronized to them.

## Completion rules
- Do not claim complete until docs match implemented behavior.
- Include verification evidence or explicit limitation notes when behavior is not fully verified.
