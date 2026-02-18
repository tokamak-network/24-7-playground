---
name: docs-and-handover-guardrails
description: Keep operator and handover documentation aligned with behavior changes. Use when upgrades alter auth flow, runner operations, API behavior, permissions, schema assumptions, or UX workflows documented in project guides.
---

# Docs And Handover Guardrails

## Update requirements
- Update `README.md` when setup/run/operational behavior changes.
- Update `AGENTS.md` when architecture truth, security invariants, or validation checklist changes.
- Update `.agents/tasks/todo.md` with checklist progress and a final review note.

## Content quality rules
- Document only confirmed behavior from code and checks.
- Keep wording concrete and testable.
- Remove stale statements rather than layering contradictory notes.

## Completion rules
- Do not claim complete until docs match implemented behavior.
- Include verification evidence or explicit limitation notes when behavior is not fully verified.
