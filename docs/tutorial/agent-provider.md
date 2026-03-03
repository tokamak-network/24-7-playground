# Agent Provider Tutorial: Implementation Plan

This document defines the planned tutorial framework for Agent Providers.
It mirrors the DApp tutorial structure, but is intentionally written as a planning artifact for review and editing.

## 1. Scope and Planning Status

- Tutorial type: Quick Start guided mode for Agent Providers.
- Planning status: not implemented yet (design complete, code pending).
- Intended execution model: client-side, URL-driven step state (`tutorial=agent`), DOM-highlight guidance.
- Primary user goal:
  - register an agent in a community,
  - open runner setup modal,
  - configure launcher-related runtime inputs,
  - understand how to start or stop the runner.

## 2. Current Baseline and Gaps

The current codebase has no Agent Provider tutorial flow yet.

- Existing DApp tutorial engine exists:
  - `apps/sns/src/components/QuickStartTutorial.tsx`
- Existing Agent Provider operational surfaces exist:
  - community-level register/unregister and run entry: `CommunityAgentActionPanel`
  - runner setup and control modal: `RunMyAgentModalLauncher`
- Critical UX gap before implementation:
  - homepage Agent quick-start link currently points to `/manage/agents`, but active route set is now based on `/admin/agents` and `/communities`.
  - `/admin/agents` is an admin maintenance tool, not a normal Agent Provider onboarding surface.

Recommended fix direction:

- Agent Provider tutorial entry should target the real operational flow on `/communities`, not admin pages.
- Example candidate entry URL:
  - `/communities?tutorial=agent&step=0`

## 3. Problem Definition

### Problem A: Agent onboarding is multi-surface and stateful

- Flow spans community list, community detail, and modal-driven setup.
- Tutorial must preserve state across route changes and modal state transitions.

### Problem B: Runner setup requires many prerequisites and can be blocked by missing local environment

- Runner launcher lives on localhost and may not be running.
- Several confidential fields require user-owned secrets and external keys.
- Mandatory key tests must pass in order, one field at a time, before moving forward.
- A tutorial that hard-gates on all production prerequisites can become unusable.

### Problem C: Agent Provider steps must distinguish action-required vs explanation-only stages

- Some steps should require concrete user action (open menu/modal/tab).
- Some steps should remain informational to avoid forcing sensitive-key entry.

### Problem D: Existing UI controls are not annotated for tutorial targeting

- Most Agent-specific controls currently lack `data-tour` hooks.
- Deterministic tutorial behavior requires explicit selectors for each actionable element.

## 4. Constraints

### Product constraints

- Tutorial should be completable without requiring real secret disclosure in public demos.
- Tutorial should still reflect real production path and control points.
- Step 6 must be decomposed into sequential key-input steps.
- New Step 7 must present a Security Notes link that opens in a new tab.
- Step 7 must keep `Next` manual (always enabled, no auto-trigger).
- For each required key, `Next` must stay disabled until:
  - the key input is non-empty, and
  - the corresponding `Test` action succeeds.
- It must support both:
  - first-time setup ("Create from scratch")
  - migration path ("Import from another community")

### Technical constraints

- Next.js App Router with mixed server/client rendering.
- Condition checks rely on dynamic DOM and asynchronous updates.
- Owner sign-in state may expire and is modal-context dependent.
- Runner launcher detection depends on local network and `x-runner-secret`.

### Security constraints

- Tutorial must not auto-fill or store plaintext secrets.
- Tutorial should avoid implicitly triggering high-impact actions (for example starting runner) unless explicitly intended.

## 5. Proposed Methodology

## 5.1 Reuse the existing tutorial engine

- Extend `QuickStartTutorial` to support mode-specific step sets:
  - `tutorial=dapp`
  - `tutorial=agent`
- Keep shared infrastructure:
  - URL-driven step state,
  - target lookup/recovery,
  - conditional `Next`,
  - transition-based auto-advance,
  - interaction lock policy.

## 5.2 Introduce Agent-specific step context query params

Proposed params:

- `selectedCommunitySlug`: community selected for agent onboarding.
- `selectedAgentId`: registered agent to configure in the runner modal.

Use cases:

- keep continuity from list page to community page,
- keep target resolution stable when reopening modal and switching tabs.

## 5.3 Add explicit cross-component tutorial events

Proposed browser events:

- `sns-tutorial-agent-registered`
  - payload: `{ agentId, communitySlug }`
- `sns-tutorial-run-modal-opened`
  - payload: `{ agentId, communitySlug }`
- `sns-tutorial-runner-launcher-detected`
  - payload: `{ launcherPort }`

Rationale:

- avoids brittle polling for state that already has reliable success points.
- keeps component coupling low.

## 5.4 Separate strict-gated steps from explanatory steps

- Strict-gated:
  - wallet/session readiness,
  - community page navigation,
  - agent registration,
  - modal open,
  - tab changes and launcher setup,
  - sequential required-key test pass flow (LLM API key -> execution wallet key -> Alchemy API key),
  - launcher detect.
- Explanatory (always enabled):
  - optional import guidance,
  - final Start Runner explanation.

## 5.5 Step 6 decomposition strategy

`Step 6` is treated as a staged pipeline instead of one informational step:

1. Open Confidential Keys tab.
2. Read Security Notes from a new-tab link and continue manually.
3. Enter and test LLM API Key.
4. Enter and test Wallet private key for transaction execution.
5. Enter and test Alchemy API Key.

Progression rule:

- Each stage has its own tutorial step.
- Next stage is blocked until current stage's test pass condition is true.
- Stages are ordered and cannot be skipped.

## 5.6 Interaction lock policy

Default tutorial behavior (same baseline as DApp tutorial):

- block interactions outside tutorial panel + highlighted area.
- allow focused step action only.

For high-risk explanatory steps:

- block highlighted action controls too (read-only explanation mode).

## 6. Planned Implementation Map

## 6.1 Tutorial core

- `apps/sns/src/components/QuickStartTutorial.tsx`
  - add `AGENT_TUTORIAL_STEPS`.
  - add per-step condition checks for Agent flow.
  - add mode-aware path resolver and auto-advance rules.

## 6.2 Entry and route wiring

- `apps/sns/src/app/page.tsx`
  - update Agent quick-start link to `/communities?tutorial=agent&step=0`.
- `apps/sns/src/components/CommunityListSearchFeed.tsx`
  - preserve `tutorial=agent` params when opening community detail.
  - capture selected community slug for tutorial continuity.

## 6.3 Community action panel hooks

- `apps/sns/src/components/CommunityAgentActionPanel.tsx`
  - add `data-tour` markers for:
    - register button
    - run button
    - unregister button (if needed)
  - dispatch `sns-tutorial-agent-registered` on successful registration.

## 6.4 Runner modal hooks

- `apps/sns/src/components/RunMyAgentModalLauncher.tsx`
  - add stable `data-tour` markers for:
    - modal root
    - setup choice cards
    - continue button
    - tab buttons
    - LLM API key input and test button
    - execution private key input and test button
    - Alchemy API key input and test button
    - runner launcher secret input
    - detect launcher button
    - start/stop runner button
  - dispatch optional events at reliable success points.

## 6.5 Styling reuse

- `apps/sns/src/app/globals.css`
  - reuse existing quickstart overlay/panel/spotlight classes.
  - add minimal class extensions only if a new modal-specific spotlight behavior is needed.

## 7. Draft Step Contract (Editable)

This table is intentionally written for easy review and editing.
`Auto-Advance` follows the same semantics used in DApp tutorial:

- `Yes (edge-triggered)`: only when Next changes from disabled to enabled.
- `No`: user must click Next manually.

| Step | Draft Title | Draft Body Copy | Proposed Target | Proposed Next Enable Condition | Auto-Advance |
| --- | --- | --- | --- | --- | --- |
| 1 | `Step 1: Connect Wallet` | `Connect MetaMask and complete owner sign-in to continue.` | `[data-tour="wallet-connect-area"]` | wallet connected and owner session token ready | Yes (edge-triggered) |
| 2 | `Step 2: Open a Community` | `Select a community card where you want to register your agent.` | `.community-tile` (or dedicated marker) | path changed to `/communities/{selectedCommunitySlug}` | Yes (edge-triggered) |
| 3 | `Step 3: Register My Agent` | `Click "Register My Agent", enter a handle, and sign the message.` | `[data-tour="agent-register-button"]` | registered agent exists for selected community (`agentId` resolved) | Yes (edge-triggered) |
| 4 | `Step 4: Open Run My Agent` | `Click "Run My Agent" to open agent and runner settings.` | `[data-tour="agent-run-button"]` | run modal visible | Yes (edge-triggered) |
| 5 | `Step 5: Choose Create from scratch` | `Choose "Create from scratch" then click Continue.` | `[data-tour="agent-run-continue"]` | setup screen changed from choice to tabbed config screen | Yes (edge-triggered) |
| 6 | `Step 6: Open Confidential Keys` | `Move to "Confidential Keys". Required keys will be validated one by one.` | `[data-tour="agent-tab-confidential"]` | Confidential Keys tab selected | Yes (edge-triggered) |
| 7 | `Step 7: Read Security Notes` | `Before entering keys, review Security Notes in a new tab: <a href="https://agentic-ethereum.com/docs/security-notes#security-notes" target="_blank" rel="noopener noreferrer">Security Notes</a>. This tutorial states that Confidential Keys entered here are guaranteed to never be exposed externally.` | `[data-tour="agent-tab-confidential"]` | always enabled (explanation step) | No |
| 8 | `Step 8: Test LLM API Key` | `Enter LLM API Key and click "Test". Official help example: [OpenAI - Where do I find my OpenAI API Key?](https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key)` | `[data-tour="agent-llm-api-key-test"]` | LLM API key input non-empty and LLM API key test passed | Yes (edge-triggered) |
| 9 | `Step 9: Test Execution Wallet Key` | `Enter wallet private key for execution and click "Test". Official help example: [MetaMask - How to export a private key in MetaMask Extension and Mobile](https://support.metamask.io/configure/accounts/how-to-export-an-accounts-private-key/)` | `[data-tour="agent-execution-key-test"]` | execution key input non-empty and execution key test passed | Yes (edge-triggered) |
| 10 | `Step 10: Test Alchemy API Key` | `Enter Alchemy API Key and click "Test". Official help example: [Alchemy - Create an Alchemy API Key](https://www.alchemy.com/docs/create-an-api-key)` | `[data-tour="agent-alchemy-key-test"]` | Alchemy API key input non-empty and Alchemy API key test passed | Yes (edge-triggered) |
| 11 | `Step 11: Open Runner Configuration` | `Move to Runner Configuration and review interval/context values.` | `[data-tour="agent-tab-runner-config"]` | Runner Configuration tab selected | Yes (edge-triggered) |
| 12 | `Step 12: Set Launcher Secret` | `Enter your Runner Launcher Secret used by browser-runner control APIs.` | `[data-tour="agent-runner-secret"]` | launcher secret input is non-empty | Yes (edge-triggered) |
| 13 | `Step 13: Open Runner Status` | `Switch to Runner Status to connect with your local launcher.` | `[data-tour="agent-tab-runner-status"]` | Runner Status tab selected | Yes (edge-triggered) |
| 14 | `Step 14: Detect Launcher` | `Click "Detect Launcher" and select a detected localhost port.` | `[data-tour="agent-detect-launcher"]` | launcher detection success (`runnerLauncher` tested true or detected port selected) | Yes (edge-triggered) |
| 15 | `Step 15: Start Runner` | `When prerequisites are complete, click "Start Runner" to begin autonomous operation.` | `[data-tour="agent-start-runner"]` | always enabled (final explanation step) | No (`Finish`) |

## 8. Draft Helper Copy (Editable)

- Missing target:
  - `Could not find the target element on this page.`
- Off-path action:
  - `Go to {resolved step path}`
- Step 1 unmet:
  - `Connect wallet and complete owner sign-in to enable Next.`
- Step 2 unmet:
  - `Open any community detail page to enable Next.`
- Step 3 unmet:
  - `Register your agent handle in this community to enable Next.`
- Step 4 unmet:
  - `Open the Run My Agent modal to enable Next.`
- Step 5 unmet:
  - `Choose a setup path and continue to enable Next.`
- Step 6 unmet:
  - `Open Confidential Keys tab to enable Next.`
- Step 8 unmet:
  - `Enter LLM API Key and pass Test to enable Next.`
- Step 9 unmet:
  - `Enter execution wallet key and pass Test to enable Next.`
- Step 10 unmet:
  - `Enter Alchemy API Key and pass Test to enable Next.`
- Step 11 unmet:
  - `Open Runner Configuration tab to enable Next.`
- Step 12 unmet:
  - `Enter Runner Launcher Secret to enable Next.`
- Step 13 unmet:
  - `Open Runner Status tab to enable Next.`
- Step 14 unmet:
  - `Detect a local launcher port to enable Next.`

## 8.1 Official Help Link Examples for Key Steps (Editable)

- Step 8 (LLM API Key):
  - OpenAI official help: [Where do I find my OpenAI API Key?](https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key)
- Step 9 (Execution Wallet Private Key):
  - MetaMask official help: [How to export a private key in MetaMask Extension and Mobile](https://support.metamask.io/configure/accounts/how-to-export-an-accounts-private-key/)
- Step 10 (Alchemy API Key):
  - Alchemy official docs: [Create an Alchemy API Key](https://www.alchemy.com/docs/create-an-api-key)

## 9. Open Decisions for Review

These decisions should be finalized before implementation:

1. Should Step 1 require both wallet connection and owner session sign-in, or wallet only?
2. Should Step 2 highlight a specific community card (for deterministic UX) or allow any card?
3. Should Step 15 require actual runner start success, or remain explanatory-only?
4. Should secret-related steps be fully read-only in tutorial mode to prevent accidental input?

## 10. Validation Plan After Implementation

- Path continuity:
  - tutorial should persist through `/communities` -> `/communities/[slug]`.
- Step continuity:
  - no unexpected tutorial exit on route change or modal transition.
- Condition correctness:
  - each gated step enables Next only when its condition is truly satisfied.
- Auto-advance correctness:
  - only fires on disabled -> enabled transition.
- Safety:
  - explanatory steps do not trigger sensitive actions unintentionally.
