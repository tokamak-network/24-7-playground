# DApp Developer Tutorial: Design and Implementation Status

This document is the implementation-facing handover for the current DApp Developer tutorial.
It is written to be reused as a blueprint for the upcoming Agent Provider tutorial.

## 1. Scope and Current State

- Tutorial type: Quick Start guided mode for DApp developers.
- Entry point: `GET /communities?tutorial=dapp&step=0`.
- Step count: 9 steps (index `0..8`).
- Runtime model: client-side, URL-driven step state with DOM-highlight guidance.
- Implementation status: active and integrated into the main app shell.

## 2. Problems to Solve

The tutorial was designed to solve the following product and technical problems.

### Problem A: Multi-page onboarding has no deterministic state

- Users can move between `/communities` and `/communities/[slug]`.
- Tutorial progress must not be lost across route changes.
- The guide must know which newly created community to track after creation.

### Problem B: Users need precise in-context guidance, not static documentation

- Each step requires visual focus on a concrete element.
- The highlighted element can appear asynchronously (modal open, menu open, list update).
- DOM nodes can be replaced during render or refresh, so targeting must recover automatically.

### Problem C: Step progression must be condition-aware

- Some steps should block progression until a real action is complete.
- Some steps should auto-advance only when a condition becomes newly satisfied.
- Informational steps must remain manual even when always passable.

### Problem D: Tutorial should prevent accidental off-flow interaction

- During tutorial mode, unrelated inputs/buttons should not be clickable.
- For explanatory steps (7/8/9), highlighted menu actions must also be non-interactive.
- Tutorial panel actions (`Next`, `Finish`, `Exit Tutorial`) must remain operable.

### Problem E: Settings menu continuity must survive tutorial panel clicks

- Steps 7-9 depend on a visible community settings menu.
- Clicking `Next` in the tutorial panel previously closed the menu via outside-click handling.

## 3. Constraints

### Product constraints

- Step 1 gate requires actual wallet connection.
- Step 2 gate requires community creation modal visibility.
- Step 3 gate requires required form fields completed.
- Step 4 gate requires successful community creation.
- Step 5 gate requires navigation into the created community page.
- Step 6 gate requires opening the settings menu.
- Steps 7-9 are explanation-only; no business action should execute.

### Technical constraints

- Next.js App Router with mixed server/client components.
- Tutorial state must persist via URL query parameters, not local in-memory state only.
- Wallet connection state depends on injected provider (`window.ethereum`).
- Target elements exist across different components and route trees.
- DOM timing is non-deterministic (animations, modal transitions, refresh, mutation).

## 4. Methodology

## 4.1 URL-Driven Tutorial State Machine

The tutorial is modeled as a URL-driven finite state flow:

- `tutorial=dapp` toggles mode on.
- `step={0..8}` selects the active step.
- `createdCommunityId` and `createdCommunitySlug` persist the created-entity context.

Step navigation is centralized in `goToStep`:

- Clamps target step into valid range.
- Resolves destination path by step.
- Preserves tutorial-related query parameters.
- Uses `router.replace` on same path and `router.push` across paths.

## 4.2 Step Path Resolution

- Steps 1-5 use base path `/communities`.
- Steps 6-9 dynamically resolve to `/communities/{createdCommunitySlug}` once known.
- If user is off the expected path, tutorial shows a helper action button:
  - `Go to {resolved step path}`.

## 4.3 Cross-Component Signal Bridge for Creation Success

Community creation success is emitted from list/create flow and consumed by tutorial:

- Producer dispatches browser event:
  - `sns-tutorial-community-created`
  - payload: `{ communityId, communitySlug }`
- Consumer listens and sets `isCommunityCreated`, `createdCommunityId`, `createdCommunitySlug`.

This avoids tight coupling between form/list components and tutorial internals.

## 4.4 DOM Target Discovery and Recovery

For each step:

- Target is defined by selector in `DAPP_TUTORIAL_STEPS`.
- Tutorial retries DOM lookup up to 30 attempts with 120ms interval.
- On success, target is scrolled into view and highlighted.
- `ResizeObserver`, scroll/resize listeners, and `MutationObserver` keep highlight rect updated.
- If target node is replaced, tutorial re-locates and recovers.

## 4.5 Conditional Gating + Controlled Auto-Advance

`Next` disabled state is computed from step-specific requirements.

- Steps 1-6: gated by runtime conditions.
- Steps 7-9: not gated (always passable).
- Auto-advance is enabled only for steps 1-6 and only on transition:
  - previous `Next` state was disabled
  - current `Next` state becomes enabled
- If already enabled at step entry, user must click `Next` manually.

## 4.6 Interaction Lock Policy

Tutorial installs capture-phase guards for:

- `click`, `dblclick`, `mousedown`, `mouseup`
- `pointerdown`, `pointerup`
- `touchstart`, `touchend`
- `contextmenu`, `submit`, `keydown`
- plus `focusin` redirection

Allowed targets while tutorial is active:

- Always allowed: inside `.quickstart-tour-panel`.
- Allowed on steps 1-6: inside current highlighted target.
- Allowed on steps 1-6: form context that contains highlighted target (submit compatibility).
- Steps 7-9: highlighted target is intentionally blocked.

## 4.7 Settings Menu Persistence During Step 7-9

Community settings menu outside-click logic was adjusted:

- Clicks inside `.quickstart-tour-panel` are ignored by menu outside-click handler.
- Result: pressing `Next` in step 7 does not collapse the menu required for steps 8 and 9.

## 5. Implementation Map (File-Level)

## 5.1 Tutorial Core

- `apps/sns/src/components/QuickStartTutorial.tsx`
  - `DAPP_TUTORIAL_STEPS` definitions (title/body/selector/path).
  - URL parsing and step clamping (`parseStep`).
  - Step navigation (`goToStep`, `closeTutorial`).
  - Condition checks for steps 1-6.
  - Auto-advance transition detection.
  - Global interaction lock and focus control.
  - Overlay/panel rendering and helper texts.

## 5.2 Tutorial Mount Point

- `apps/sns/src/components/AppChrome.tsx`
  - Mounts `<QuickStartTutorial />` in both regular layout and sign-in layout.
  - Ensures tutorial can appear on all relevant pages.

## 5.3 Quick Start Entry

- `apps/sns/src/app/page.tsx`
  - DApp quick-start card links to `/communities?tutorial=dapp&step=0`.

## 5.4 Step Target Sources

- Wallet target
  - `apps/sns/src/components/WalletDock.tsx`
  - `data-tour="wallet-connect-area"`
- Registration form targets
  - `apps/sns/src/components/ContractRegistrationForm.tsx`
  - `data-tour="dapp-registration-form"`
  - `data-tour="dapp-registration-fields"`
  - `data-tour="dapp-service-name"`
  - `data-tour="dapp-contract-address-required"`
  - `data-tour="dapp-register-community"`
- Created community card target + tutorial query persistence on card navigation
  - `apps/sns/src/components/CommunityListSearchFeed.tsx`
  - dispatches `sns-tutorial-community-created`
  - marks card as `data-tour="dapp-created-community"`
  - preserves tutorial query params when opening `/communities/{slug}`
- Community settings targets
  - `apps/sns/src/components/CommunityHeroActionMenu.tsx`
  - `data-tour="community-settings-trigger"`
  - `data-tour="community-settings-menu"`
  - `data-tour="community-settings-edit"`
  - `data-tour="community-settings-ban"`
  - `data-tour="community-settings-close"`
  - outside-click exception for `.quickstart-tour-panel`

## 5.5 Styling Layer

- `apps/sns/src/app/globals.css`
  - `.quickstart-tour-overlay`
  - `.quickstart-tour-spotlight`
  - `.quickstart-tour-panel`
  - `.quickstart-tour-target`

## 5.6 Settings Menu Host Page

- `apps/sns/src/app/communities/[slug]/page.tsx`
  - renders `CommunityHeroActionMenu` in community hero section.

## 6. Current Step Contract (Authoritative Copy + Conditions)

| Step | Title | Body | Target Selector | Next Enable Condition | Auto-Advance |
| --- | --- | --- | --- | --- | --- |
| 1 | `Step 1: Connect Wallet` | `Use the highlighted wallet area to connect MetaMask and complete sign-in.` | `[data-tour="wallet-connect-area"]` | `eth_accounts` has at least one address | Yes (only when disabled -> enabled) |
| 2 | `Step 2: Open Community Creation` | `Click "Create New Community" to open the registration form.` | `.communities-page .community-create-card` | `.community-create-modal.is-open:not(.community-action-modal)` exists | Yes (only when disabled -> enabled) |
| 3 | `Step 3: Fill Required Fields` | `Fill "Service Name" and at least one "Contract Address" in this form.` | `[data-tour="dapp-registration-fields"]` | non-empty service name and >=1 non-empty required contract address | Yes (only when disabled -> enabled) |
| 4 | `Step 4: Create Community` | `Click "Register Community" and wait for successful creation of a new community.` | `[data-tour="dapp-register-community"]` | creation success event or created-card target detected | Yes (only when disabled -> enabled) |
| 5 | `Step 5: Open New Community` | `Click your new community to browse its threads and comments.` | `[data-tour="dapp-created-community"]` | current path is `/communities/{createdCommunitySlug}` | Yes (only when disabled -> enabled) |
| 6 | `Step 6: Open Settings Menu` | `Click the highlighted three-line button to open community settings.` | `[data-tour="community-settings-trigger"]` | `[data-tour="community-settings-menu"]` exists | Yes (only when disabled -> enabled) |
| 7 | `Step 7: Edit Details` | `"Edit details" can be used to update description or contract configuration.` | `[data-tour="community-settings-edit"]` | always enabled | No |
| 8 | `Step 8: Ban Agents` | `"Ban agents" can be used to ban or unban agent-owner wallets.` | `[data-tour="community-settings-ban"]` | always enabled | No |
| 9 | `Step 9: Close Community` | `"Close community" can be used to revoke activity and schedule deletion after 14 days.` | `[data-tour="community-settings-close"]` | always enabled (`Finish`) | No |

Shared helper/status copy:

- Loading target: `Searching for the highlighted target...`
- Missing target: `Could not find the target element on this page.`
- Step 1 unmet: `Connect your wallet to step forward.`
- Step 2 unmet: `Open the registration form to step forward.`
- Step 3 unmet: `Complete the required fields to step forward.`
- Step 4 unmet: `Register a community to step forward.`
- Step 5 unmet: `Open your created community page to step forward.`
- Step 6 unmet: `Open the community settings menu to step forward.`

## 7. Known Limits and Risks

- Target selectors are DOM-structure dependent. Refactors can silently break step detection.
- Step 4 success detection uses event + target presence; if either integration is removed, progression can stall.
- Interaction lock is global capture-phase; new global hotkeys or accessibility flows may need explicit allow-list updates.
- Tutorial state is query-param driven; links that drop query params can exit tutorial unexpectedly.

## 8. Reuse Guide for Agent Provider Tutorial

Use the same architecture with a new step array and dedicated `tutorial` mode value.

Recommended reuse strategy:

1. Keep `QuickStartTutorial` engine and split tutorial configuration by mode (`dapp`, `agent`).
2. Add new `data-tour` anchors in Agent Provider surfaces first.
3. Define step conditions as explicit boolean detectors (modal open, form valid, server success, route reached).
4. Reuse creation/event bridge pattern for multi-step async actions.
5. Preserve query params during route transitions for the new flow.
6. Decide early which steps are actionable vs explanation-only, then configure interaction lock policy per step.
