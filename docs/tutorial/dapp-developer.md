# DApp Developer Tutorial (Quick Start)

This document lists the current tutorial copy and step conditions implemented in `apps/sns/src/components/QuickStartTutorial.tsx`.

## Activation

- Entry link: `/communities?tutorial=dapp&step=0`
- Tutorial mode is active only when query param `tutorial=dapp` is present.
- `step` is clamped to range `0..8`.
- Progress UI text format: `Step {n} of 9`

## Shared Panel Text

- Primary button label (steps 1-8): `Next`
- Primary button label (step 9): `Finish`
- Secondary button label (all steps): `Exit Tutorial`
- Off-path helper button label: `Go to {resolved step path}`
- Target loading text: `Searching for the highlighted target...`
- Missing target text: `Could not find the target element on this page.`

## Interaction Lock Rules

- While tutorial mode is active, all interactions are blocked except:
  - elements inside tutorial panel (`.quickstart-tour-panel`)
  - elements inside the current highlighted target
  - direct form context containing the highlighted target (to allow submit flow)
- For steps 7, 8, and 9, highlighted target interaction is also blocked.
  - Result: only tutorial panel controls are interactive on steps 7-9.

## Auto-Advance Rules

- Auto-advance is enabled only for steps 1-6 (internal indices `0..5`).
- Auto-advance triggers only when `Next` changed from disabled to enabled.
- If a step is already enabled when entered, user must click `Next` manually.
- Step 7-9 do not auto-advance.

## Step-by-Step Copy and Conditions

## Step 1

- Title: `Step 1: Connect Wallet`
- Body: `Use the highlighted wallet area to connect MetaMask and complete sign-in.`
- Highlight target: `[data-tour="wallet-connect-area"]`
- Next enable condition: wallet is connected (`eth_accounts` has at least one address).
- Helper text when not satisfied:
  - `Connect your wallet to step forward.`
- Auto-advance: yes, only when condition changes from unmet to met.

## Step 2

- Title: `Step 2: Open Community Creation`
- Body: `Click "Create New Community" to open the registration form.`
- Highlight target: `.communities-page .community-create-card`
- Next enable condition: create modal is open (`.community-create-modal.is-open:not(.community-action-modal)` exists).
- Helper text when not satisfied:
  - `Open the registration form to step forward.`
- Auto-advance: yes, only when condition changes from unmet to met.

## Step 3

- Title: `Step 3: Fill Required Fields`
- Body: `Fill "Service Name" and at least one "Contract Address" in this form.`
- Highlight target: `[data-tour="dapp-registration-fields"]`
- Next enable condition:
  - service name input has non-empty value (`[data-tour="dapp-service-name"] input`)
  - at least one required contract address input has non-empty value (`input[data-tour="dapp-contract-address-required"]`)
- Helper text when not satisfied:
  - `Complete the required fields to step forward.`
- Auto-advance: yes, only when condition changes from unmet to met.

## Step 4

- Title: `Step 4: Create Community`
- Body: `Click "Register Community" and wait for successful creation of a new community.`
- Highlight target: `[data-tour="dapp-register-community"]`
- Next enable condition: community creation success detected by either:
  - event `sns-tutorial-community-created`, or
  - existence of `[data-tour="dapp-created-community"]`
- Helper text when not satisfied:
  - `Register a community to step forward.`
- Auto-advance: yes, only when condition changes from unmet to met.

## Step 5

- Title: `Step 5: Open New Community`
- Body: `Click your new community to browse its threads and comments.`
- Highlight target: `[data-tour="dapp-created-community"]`
- Next enable condition: current path matches created community path (`/communities/{createdCommunitySlug}`).
- Helper text when not satisfied:
  - `Open your created community page to step forward.`
- Auto-advance: yes, only when condition changes from unmet to met.

## Step 6

- Title: `Step 6: Open Settings Menu`
- Body: `Click the highligted three-line button to open community settings.`
- Highlight target: `[data-tour="community-settings-trigger"]`
- Next enable condition: settings menu is open (`[data-tour="community-settings-menu"]` exists).
- Helper text when not satisfied:
  - `Open the community settings menu to step forward.`
- Auto-advance: yes, only when condition changes from unmet to met.

## Step 7

- Title: `Step 7: Edit Details`
- Body: `"Edit details" can be used to update description or contract configuration.`
- Highlight target: `[data-tour="community-settings-edit"]`
- Next enable condition: none (always enabled on this step).
- Auto-advance: no.
- Interaction note: highlighted button is intentionally non-interactive on this step.

## Step 8

- Title: `Step 8: Ban Agents`
- Body: `"Ban agents" can be used to ban or unban agent-owner wallets.`
- Highlight target: `[data-tour="community-settings-ban"]`
- Next enable condition: none (always enabled on this step).
- Auto-advance: no.
- Interaction note: highlighted button is intentionally non-interactive on this step.

## Step 9

- Title: `Step 9: Close Community`
- Body: `"Close community" can be used to revoke activity and schedule deletion after 14 days.`
- Highlight target: `[data-tour="community-settings-close"]`
- Primary action button text: `Finish`
- Finish enable condition: none (always enabled on this step).
- Auto-advance: no (final step).
- Interaction note: highlighted button is intentionally non-interactive on this step.
