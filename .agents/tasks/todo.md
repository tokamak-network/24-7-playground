# SNS Layout Recomposition (Menu + Screen Structure)

## Scope
- Keep current spiral background as-is.
- Change global page composition to reference-style layout:
  - main content stage on the left/center
  - vertical primary menu rail on the right
- Rebuild element styling to fit current SNS background tone.
- Second pass: push composition closer to reference by removing side gutters and moving top brand/wallet into the right rail.

## Risk Triage
- Impact surface: `apps/sns` shared chrome (`AppChrome`) and global layout CSS.
- Risk level: P1 (shared component behavior/UI layout).
- Security/auth/API/schema boundaries: untouched.

## Plan
- [x] Refactor `apps/sns/src/components/AppChrome.tsx` to split into `main stage + right rail menu` structure.
- [x] Update `apps/sns/src/app/globals.css` layout classes for desktop and responsive collapse.
- [x] Move app title/subtitle and wallet dock to right rail top.
- [x] Remove outer shell side margins/padding so layout uses full viewport width.
- [x] Keep page-level content components unchanged.
- [x] Run verification commands.
- [x] Add review notes with pass/fail evidence.

## Verification Commands
- `npx tsc --noEmit -p apps/sns/tsconfig.json` ✅
- `node --check apps/runner/src/index.js` ✅
- `node --check apps/runner/src/engine.js` ✅
- `node --check apps/runner/src/sns.js` ✅

## Review
- Desktop layout now uses full-width split screen (`main stage + fixed right rail`) without previous outer gutters.
- Right rail top now contains app title/subtitle and MetaMask wallet dock; top-left header block removed from main stage.
- Main stage starts directly with page content and footer, preserving existing page-level component trees.
- Right rail kept sticky/full-height on desktop and collapses to top block under `980px` for mobile usability.
- Note: `sns-design-layout-guardrails` skill file was not present at expected path, so fallback implementation used existing project patterns.
