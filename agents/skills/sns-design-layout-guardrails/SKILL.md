---
name: sns-design-layout-guardrails
description: Enforce SNS app layout consistency at both page and component level during UI upgrades. Use when changing page structure, card composition, feed/list rendering, forms, controls, spacing, typography, responsive behavior, or shared UI patterns in `apps/sns`.
---

# SNS Design Layout Guardrails

## Layout baseline
Preserve a consistent visual system across SNS pages and shared components.

## Page layout guardrails
Apply and verify page-level structure for each major route:
- `/`: home hero + live activity section with readable hierarchy.
- `/sns`: global community/thread discovery layout with stable card rhythm.
- `/sns/[slug]`: community header, filter/search controls, thread feed alignment.
- `/sns/[slug]/threads/[threadId]`: thread hero/body + comment feed with clear separation.
- `/requests`, `/reports`: feed layout parity and shared search/filter behavior.
- `/manage`, `/manage/communities`, `/manage/agents`, admin pages: form/control sections grouped by task and risk.

For any touched page, confirm:
- Header, controls, content, and actions keep predictable vertical flow.
- Spacing rhythm and container widths remain consistent with neighboring pages.
- Mobile and desktop both keep usable hierarchy and interaction order.

## Component layout guardrails
Use shared components first; avoid ad-hoc duplicates.

Covered components include:
- Thread/comment cards
- Community/type/status pills and tags
- Search/filter dropdown controls
- Form rows, field groups, and action button rows
- Status bubble/toast anchors

For any touched component, confirm:
- Visual hierarchy: title > metadata > body > actions is clear.
- Alignment and spacing are consistent across pages reusing the component.
- Interactive states (hover/focus/disabled/active) are present and non-breaking.
- Status and validation feedback does not break surrounding layout flow.

## Non-negotiable card unification rule
- All thread cards in SNS must render through `ThreadFeedCard`.
- All comment cards in SNS must render through `CommentFeedCard`.
- This includes preview snippets and embedded lists (no exceptions for “lightweight” variants).
- If a new route needs a different variant, extend the shared card props; do not fork markup.

## Anti-regression rules
- Do not fork near-identical JSX for the same card/control pattern.
- Do not introduce one-off spacing/size rules that conflict with shared patterns.
- Do not change one page variant without checking all pages using the same component family.

## Verification checklist
- Capture before/after sanity checks on every touched route.
- Verify at least one desktop width and one mobile width per touched page.
- Confirm shared component parity where the same component appears in multiple feeds.
- Run code-level checks to prove unification:
  - `rg "ThreadFeedCard" apps/sns/src`
  - `rg "CommentFeedCard" apps/sns/src`
  - Ensure no ad-hoc thread/comment card markup remains in page/component render paths.
