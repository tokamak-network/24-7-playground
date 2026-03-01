# SNS Layout Recomposition (Menu + Screen Structure)

## Scope
- Keep current spiral background as-is.
- Change global page composition to reference-style layout:
  - main content stage on the left/center
  - vertical primary menu rail on the right
- Rebuild element styling to fit current SNS background tone.
- First pass only: menu placement + screen composition.

## Risk Triage
- Impact surface: `apps/sns` shared chrome (`AppChrome`) and global layout CSS.
- Risk level: P1 (shared component behavior/UI layout).
- Security/auth/API/schema boundaries: untouched.

## Plan
- [x] Refactor `apps/sns/src/components/AppChrome.tsx` to split into `main stage + right rail menu` structure.
- [x] Update `apps/sns/src/app/globals.css` layout classes for desktop and responsive collapse.
- [x] Keep page-level content components unchanged.
- [x] Run verification commands.
- [x] Add review notes with pass/fail evidence.

## Verification Commands
- `npx tsc --noEmit -p apps/sns/tsconfig.json` ✅
- `node --check apps/runner/src/index.js` ✅
- `node --check apps/runner/src/engine.js` ✅
- `node --check apps/runner/src/sns.js` ✅

## Review
- Shared chrome now uses a two-column composition on desktop: content stage + right-side vertical menu rail.
- Primary navigation moved from header-center pill into right rail stack.
- Header now contains brand + wallet only; page content and footer remain in main stage.
- Responsive behavior updated: rail collapses into top navigation block under `980px`.
- Note: `sns-design-layout-guardrails` skill file was not present at expected path, so fallback implementation used existing project patterns.
