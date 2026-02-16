# Project Plan

## 2026-02-13 UI Refresh (SNS + Agent Manager)
- [x] Audit existing SNS/Agent Manager UI structure and reusable classes
- [x] Define a modern, simple visual direction with improved hierarchy and spacing
- [x] Implement SNS UI refresh while preserving all current features/flows
- [x] Implement Agent Manager UI refresh while preserving all current features/flows
- [x] Verify with build/test commands and capture any residual risk
- [x] Add a short review note for this UI refresh task

## 2026-02-13 Content Readability (SNS + Prompts)
- [x] Add safe rich-text rendering for thread/comment body in SNS
- [x] Add readability-focused typography styles for rendered content
- [x] Update agent prompts to enforce human-readable output structure
- [x] Run type check/build verification and document result

## 2026-02-13 System Thread Formatting
- [x] Improve auto-generated SYSTEM thread body with markdown sections
- [x] Keep source code and ABI readable in fenced code blocks
- [x] Verify SNS TypeScript build checks

## 2026-02-13 Thread/Comment Collapse UX
- [x] Add reusable collapse/expand renderer with "Read more/Show less"
- [x] Apply collapse UX to community thread list bodies
- [x] Apply collapse UX to thread detail body
- [x] Apply collapse UX to thread comment bodies
- [x] Verify SNS TypeScript checks after UI behavior update

## 2026-02-13 Community GitHub Repository Link
- [x] Add optional GitHub repository URL input in contract registration form
- [x] Add backend validation to ensure provided repository is public
- [x] Persist repository URL on community creation
- [x] Add Prisma schema + migration for repository URL column
- [x] Verify TypeScript/Prisma generation and document results

## 2026-02-13 SNS Thread Visual Hierarchy
- [x] Separate thread title and body into distinct visual blocks
- [x] Apply the same hierarchy to community thread feed and requests/reports feed
- [x] Improve thread detail and comment card readability with refined modern styling
- [x] Verify SNS TypeScript checks after UI updates

## 2026-02-16 System Thread Source Code Rendering
- [x] Parse Etherscan multi-file source payload and extract only `sources` entries
- [x] Render each source file `content` in readable fenced code blocks
- [x] Verify SNS TypeScript checks after source rendering update

## 2026-02-16 System Thread Libraries Rendering
- [x] Extract `libraries` from Etherscan source payload (`settings.libraries` or `libraries`)
- [x] Render libraries with formatted fenced code block in system thread body
- [x] Verify SNS TypeScript checks after libraries rendering update

## 2026-02-16 Thread Type + Title Single-Line Layout
- [x] Update SNS thread card header layout to place type badge and title on one line
- [x] Preserve thread detail hero header layout while applying card-only change
- [x] Verify SNS TypeScript checks after UI layout update

## 2026-02-16 Community Thread Search + Filter + ID
- [x] Show thread ID at the bottom-right of each community thread card
- [x] Add in-community search across author/title/body, including comment author/body matches
- [x] Add in-community thread-type filter for focused browsing
- [x] Verify SNS TypeScript checks after search/filter UI and API updates

## 2026-02-16 Requests/Reports Community Visibility + Autocomplete Search
- [x] Emphasize community name on each thread card in Requests and Reports
- [x] Add community-name search input with autocomplete in Requests page
- [x] Add community-name search input with autocomplete in Reports page
- [x] Verify SNS TypeScript checks after Requests/Reports feed updates

## 2026-02-16 Community Thread Search CommunityId + Multi-Type Filter
- [x] Include `communityId` in SNS community thread search matching
- [x] Change thread type filter to multi-select mode
- [x] Verify SNS TypeScript checks after community thread filter updates

## 2026-02-16 Request Thread Resolve/Reject Status
- [x] Add `isResolved`/`isRejected` fields to request thread model with migration
- [x] Add owner-authenticated API to set request status to resolved/rejected
- [x] Add request status display and owner control UI on thread detail page
- [x] Verify SNS TypeScript checks after request status feature update

## 2026-02-16 Prisma Refresh Script
- [x] Add a single SNS npm command that runs migrate + generate sequentially
- [x] Add root-level shortcut command for SNS prisma refresh
- [x] Verify new script names are available in npm script list

## 2026-02-16 Remove Requests/Reports Policy Sections
- [x] Remove Request policy description card from Requests page
- [x] Remove Report policy description card from Reports page
- [x] Verify SNS TypeScript checks after page cleanup

## 2026-02-16 Request Status Popup Selector
- [x] Add `pending` status support in request status update API
- [x] Replace separate request status card with in-thread status trigger and popup options
- [x] Unify styling for all status option buttons
- [x] Verify SNS TypeScript checks after request status interaction update

## 2026-02-16 Request Status Tag Position in Requests Feed
- [x] Move request status tag to thread title row between REQUEST badge and title
- [x] Remove request status tag from the community-name row in Requests feed cards
- [x] Verify SNS TypeScript checks after status tag layout adjustment

## 2026-02-16 Request Status Popup Clipping Fix
- [x] Fix request status popup menu clipping by changing popup open direction
- [x] Verify SNS TypeScript checks after popup positioning fix

## 2026-02-16 Requests Feed Community Name Position
- [x] Move community name from between title/body to meta line before author in Requests cards
- [x] Keep Reports card layout unchanged while applying Requests-specific placement
- [x] Verify SNS TypeScript checks after community label position update

## 2026-02-16 Reports Feed Community Name Position
- [x] Move community name from between title/body to meta line before author in Reports cards
- [x] Verify SNS TypeScript checks after Reports community label position update

## 2026-02-16 Request Status Button Disable on Owner Mismatch
- [x] Disable request status trigger when signed-in wallet does not match community owner wallet
- [x] Remove wallet-mismatch specific error message output for status changes
- [x] Verify SNS TypeScript checks after request status guard simplification

## 2026-02-16 Community Thread Search Key Correction
- [x] Replace community-id search matching with thread-id matching in community thread API
- [x] Update community thread search placeholder text to mention thread id
- [x] Verify SNS TypeScript checks after search key correction

## 2026-02-16 Requests/Reports Metadata + Card Layout Merge
- [x] Add comment count and created time rendering to Requests/Reports cards
- [x] Fetch comment count metadata in Requests/Reports page queries
- [x] Align Requests/Reports card layout structure with community thread cards
- [x] Verify SNS TypeScript checks after card layout merge

## 2026-02-16 Unified Thread Card Component Across SNS Pages
- [x] Create one shared thread-card component and make feeds import it
- [x] Use the shared thread-card component in community, requests, and reports listings
- [x] Ensure community name is rendered on community page thread cards too
- [x] Verify SNS TypeScript checks after card component unification

## 2026-02-16 Thread Type Filter Visual Redesign
- [x] Redesign community thread-type multi-select controls with modern chip/pill styling
- [x] Improve selected/hover/focus states while preserving existing filter behavior
- [x] Verify SNS TypeScript checks after thread-type UI redesign

## 2026-02-16 Request Status Tag Style Unification
- [x] Change request status tags to use the same badge class as other thread tags
- [x] Remove custom status-tag CSS that diverged from badge style
- [x] Verify SNS TypeScript checks after status tag style unification

## 2026-02-16 Thread Type Dropdown Multi-Select
- [x] Rename thread filter label to `Type`
- [x] Replace inline checklist chips with dropdown-based multi-select list
- [x] Preserve multi-select filter behavior and API query semantics
- [x] Verify SNS TypeScript checks after dropdown filter redesign

## 2026-02-16 Thread Type Dropdown Checkbox Styling Fix
- [x] Fix checkbox control styles overridden by global `.field input` rules
- [x] Improve selected-row visual state in type dropdown menu for readability
- [x] Verify SNS TypeScript checks after dropdown styling fix
- [x] Review: confirmed dropdown options now render as compact checkboxes instead of stretched input-like controls

## 2026-02-16 SYSTEM Author Label Styling
- [x] Change system-thread author display text from `system` to `SYSTEM`
- [x] Render `SYSTEM` author label in bold in shared thread cards and detail/preview surfaces
- [x] Verify SNS TypeScript checks after author label styling update

## 2026-02-16 SNS Community Name Search Reuse
- [x] Extract Requests/Reports community-name search input into a shared component
- [x] Apply the shared search component to SNS community list with autocomplete filtering
- [x] Verify SNS TypeScript checks after SNS community search integration

## 2026-02-16 Thread Type Dropdown Checkbox Removal
- [x] Remove checkbox controls from thread-type dropdown options
- [x] Keep multi-select behavior via option-row click interactions
- [x] Verify SNS TypeScript checks after type-dropdown interaction update

## 2026-02-16 Request Status Owner Check Hardening
- [x] Reconcile owner session token with currently connected wallet account
- [x] Require connected-wallet match in request status owner gating logic
- [x] Verify SNS TypeScript checks after owner-check hardening

## 2026-02-16 Wallet Error Bubble UI
- [x] Replace wallet connection inline error text with floating bubble message
- [x] Keep top header layout stable while wallet error is visible
- [x] Verify SNS TypeScript checks after wallet error UI update

## 2026-02-16 Request Status Inline Messages Cleanup
- [x] Remove owner-session/update 안내 문구 from request-status control area
- [x] Keep request-status interaction to status button and popup options only
- [x] Verify SNS TypeScript checks after status-control message cleanup

## 2026-02-16 Owner Comment Login Flow Alignment
- [x] Remove `Owner session` text and Sign In/Out controls from owner comment section
- [x] Trigger MetaMask owner login from `Post Comment` button when no owner session exists
- [x] Keep owner-only posting guard aligned with request-status owner check logic
- [x] Verify SNS TypeScript checks after owner-comment login flow update

## 2026-02-16 Floating Top Menu Header
- [x] Make SNS top navigation header float while scrolling
- [x] Preserve responsive top offsets for tablet/mobile breakpoints
- [x] Verify SNS TypeScript checks after header position update

## 2026-02-16 Global MetaMask Login Gate
- [x] Add dedicated MetaMask login page
- [x] Add global button-click guard that redirects to login when wallet is not connected
- [x] Wire guard into SNS root layout so it applies across pages
- [x] Verify SNS TypeScript checks after global login gate update

## 2026-02-16 Request Status Owner Wallet Match Check
- [x] Add explicit wallet-match validation before request status changes
- [x] Verify current connected wallet matches community owner wallet
- [x] Verify SNS TypeScript checks after wallet-match guard update

## Plan
- [x] Update root `AGENTS.md` as a full handover guide
  - [x] Document project purpose and delivery method
  - [x] Summarize implemented features by app
  - [x] Add security-critical constraints and operational checklist
- [x] Refresh README for current UX, routing, and Agent Manager config
  - [x] Validate SNS/Agent Manager routes, nav labels, and env docs
  - [x] Document comment context limit (N) and token impact
  - [x] Commit + push README update
- [x] Add LiteLLM provider support in Agent Manager
  - [x] Add provider option `LITELLM` in UI and runtime config
  - [x] Add base URL input for LiteLLM (required for testing/models)
  - [x] Send LiteLLM base URL to `/api/agents/models` and use it for model listing
  - [x] Route LLM test + runner calls through LiteLLM base URL
  - [x] Update README/AGENTS.md with LiteLLM usage notes
- [x] Limit comment context size for LLM prompts (community-wide)
  - [x] Add comment limit input (N) to Agent Manager Runner UI with token-usage note
  - [x] Persist comment limit in encrypted config and load on decrypt/start
  - [x] Pass comment limit to `/api/agents/context` and limit comments across community
  - [x] Include all thread metadata with threadId in context
  - [x] Include threadId on each returned comment in context
  - [x] Include total comment count while returning only recent N comments
- [ ] Admin maintenance pages (agents/communities)
  - [ ] Add community force-delete API guarded by `ADMIN_API_KEY`
  - [ ] Wire `/manage/communities/admin` to force delete by id/slug
  - [ ] Ensure `/manage/agents/admin` hosts agent unregister UI
  - [ ] Update README with new admin URLs
- [x] Unify Agent wallet fields
  - [x] Keep `ownerWallet`, drop `walletAddress` from Agent
  - [x] Update agent register/unregister flows to use `ownerWallet`
  - [x] Add migration to drop Agent.walletAddress
  - [x] Update admin UI/docs to use `ownerWallet`
- [x] Refactor Agent schema (minimal relations)
  - [x] Remove `status`, `runnerStatus`, `runnerIntervalSec`, `communitySlug`, `createdAt`
  - [x] Add `runner` JSON structure (status, intervalSec)
  - [x] Drop Agent↔Community relation (keep `communityId` scalar only)
  - [x] Update APIs/UI to use `runner` JSON and remove status filters
- [x] Redesign SNS management UI and community lifecycle
  - [x] Add community status fields (ACTIVE/CLOSED), closed/delete timestamps, and last system hash
  - [x] Add owner community lookup + close endpoints
  - [x] Update contract registration and update flows to use fixed-message signature (no owner session UI)
  - [x] Implement 3-section Community Management page (Register / Update / Close)
  - [x] Implement update logic: fetch Etherscan ABI+source, build system draft, hash-compare, create new system thread on change, store hash
  - [x] Implement close logic: revoke community API keys immediately, mark CLOSED, schedule deleteAt (+14d), lazy cleanup on access
  - [x] Block agent API writes to CLOSED communities; keep community viewable with Closed badge
  - [x] Update Agent Bot Management UX to rely on connected wallet
  - [x] Update docs to reflect new SNS flow
- [ ] Thread type overhaul (System/Discussion/Request/Report) with comment permissions
  - [x] Update Prisma enum + migration; map NORMAL->DISCUSSION, REPORT->REPORT_TO_HUMAN
  - [x] Store community owner wallet (from contract registration signature)
  - [x] Add owner auth endpoint (fixed message signature) + session usage
  - [x] Update contract registration UI/API to require signature and set owner wallet
  - [x] Create/Update System threads only on ABI/source changes; manage via SNS home UI
  - [x] Enforce thread type rules in API:
    - [x] Agents cannot create System
    - [x] System threads disallow comments
    - [x] Discussion comments API-only (agent auth)
    - [x] Request/Report allow agent API and owner UI
  - [x] Add human comment UI (Request/Report only) with owner login + owner check
  - [x] Update thread badges, report page filtering, and copy to reflect new types
  - [x] Update README/AGENTS.md with new thread types + permissions
- [x] Simplify repo to two apps: `apps/sns` and `apps/agent_manager`
- [x] Move Prisma client into `apps/sns/src/db`
- [x] Inline UI components into `apps/sns/src/components/ui`
- [ ] Replace CLI with `apps/agent_manager` GUI
- [x] Extend schema for contracts, communities, threads, api keys
- [x] Implement API key issuance/rotation
- [x] Add contract registration + community auto-creation
- [x] Replace posts/comments with threads + comments APIs
- [x] Update SNS/Reports pages to use DB data
- [x] Update worker to seed report threads
- [x] Update README.md and AGENTS.md
- [ ] Verify migrations + API happy paths + worker heartbeat
 - [ ] Verify runner (Sepolia) execution and faucet auto-call
- [ ] Verify Etherscan ABI fetch flow
- [x] Fetch Etherscan source code on contract register
- [x] Create auto thread with ABI + source code info on initial community creation
- [x] On re-register, create update thread noting contract update
- [ ] Verify thread creation on register and re-register
- [ ] Create `apps/agent_manager` structure for LLM agent prompts
- [x] Draft agent prompt set (roles, policies, input/output, safety)
- [x] Add prompt README for usage and extension
- [x] Add API key delivery UX in UI after agent registration
- [x] Add agent API key storage policy (server env vs user-provided)
- [ ] Implement LLM agent runner in apps/agent_manager
- [ ] Wire runner to schedule prompt dispatch
- [ ] Verify end-to-end: register -> key -> worker dispatch
- [x] Add agent deactivate/reactivate API and UI
- [x] Add agent policy fields (run interval, max actions) and UI
- [x] Validate LLM output with JSON schema before dispatch
- [x] Update agent worker to respect per-agent policies
- [ ] Verify end-to-end: deactivate stops dispatch, policies applied, schema validation logs
- [x] Add role rotation support (store role index, cycle through roles)
- [x] Update agent worker to rotate role per cycle
- [x] Update UI copy to explain role rotation
- [x] Inline UI components into apps/sns and update imports
- [x] Simplify agent registration form to handle + signature only
- [ ] Move LLM configuration to apps/agent_manager encrypted storage
- [ ] Implement agent manager UI workflows
- [x] Remove apps/worker and macro bot activity (keep heartbeat only)
- [ ] Move heartbeat recording into agent manager runner
- [x] Ensure SNS actions are LLM-only (disable macro runner)
- [x] Update README.md and AGENTS.md to reflect new policy
- [x] Replace SIWE nonce flow with fixed-signature account login
- [x] Add Agent.account field; remove encryptionSalt storage
- [x] Update agent registration to store account signature
- [x] Update secrets flow: password-based HKDF (signature + password) with local cache
- [x] Remove AgentClaim/nonce dependencies from SNS endpoints
- [x] Update Agent Manager UI for password prompts and cache restore
- [x] Update README.md and AGENTS.md for new auth/encryption flow
- [x] Runner Start decrypts secrets locally before scheduling
- [x] Heartbeat interval uses Run Interval (no separate timer)
- [x] Ensure LLM API key never sent to SNS; local-only usage
- [x] Update docs for Runner decrypt + heartbeat schedule
- [x] Require per-request nonce signature in addition to SNS API key for thread/comment writes
- [x] Add execution wallet secret to Agent Manager (local-only encrypted)
- [x] Extend SNS context with registered contracts + ABI functions
- [x] Allow LLM to return tx actions (contract, function, args, value)
- [x] Validate tx action against SNS-registered contracts/ABI
- [x] Execute tx via Alchemy (Sepolia) using execution wallet
- [x] Send execution result back to LLM for follow-up response
- [x] Post execution result (and follow-up) to SNS
- [x] Update prompts/docs to cover tx flow and feedback loop

## Review
- [ ] Confirm data model covers agents, SNS, votes, reports, heartbeat
- [ ] Confirm API routes work end-to-end
- [ ] Note any open questions or follow-ups

Notes:
- Prisma migration apply failed because the local DB was not running (P1001). Migration file is added and `prisma generate` succeeded.
- Assumptions: SIWE only, Prisma for DB, node-cron worker, read-only human UI.
- npm install failed (network: ENOTFOUND registry.npmjs.org). Dependencies not verified.

UI Refresh Review (2026-02-13):
- SNS + Agent Manager UI updated with consistent modern card/form/navigation styling while keeping existing flows and handlers.
- SNS build-time type errors in contract/thread routes were later fixed (`abiJson`/thread type and ethereum provider typing).
- `npm -w apps/agent_manager run build` failed in this sandbox because Google Font fetch is blocked (`ENOTFOUND fonts.googleapis.com`).
- `npx tsc --noEmit -p apps/agent_manager/tsconfig.json` reports pre-existing typing issues around header object unions and runner config typing.

Content Readability Review (2026-02-13):
- Added safe rich-text rendering for thread/comment bodies without `dangerouslySetInnerHTML`.
- Added readable typography for headings, lists, code blocks, blockquotes, links, and compact feed mode.
- Applied formatted rendering to thread detail, thread comments, requests, reports, and community thread feed.
- Updated agent prompts to produce human-friendly structured markdown content.
- `npx tsc --noEmit -p apps/sns/tsconfig.json` passed; `npm -w apps/sns run build` still blocked by local DB connectivity (`localhost:5432`).

System Thread Formatting Review (2026-02-13):
- Updated `buildSystemBody` to produce markdown sections for summary/metadata/source/ABI.
- Auto-created SYSTEM threads now render in readable structured format in SNS.
- `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Thread/Comment Collapse UX Review (2026-02-13):
- Added `ExpandableFormattedContent` for long-body collapse/expand interaction.
- Community thread list now shows shortened body first and exposes full body via "더보기".
- Thread detail body and comment bodies now support the same "더보기/접기" interaction.
- `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Community GitHub Repository Link Review (2026-02-13):
- Added optional GitHub repository URL input to contract registration form.
- Added GitHub public repository verification (`github.com` URL parse + GitHub API check) before community creation.
- On success, repository URL is persisted in `Community.githubRepositoryUrl`; on failure, API returns explicit error and creation is blocked.
- Added Prisma schema update and SQL migration for `githubRepositoryUrl`.
- Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json` passed; `npm -w apps/sns run build` still blocked by local Postgres connectivity.

SNS Thread Visual Hierarchy Review (2026-02-13):
- Refactored thread cards to use explicit title and body sections with distinct background, border, spacing, and typography.
- Increased title prominence and reduced body density so title/body can be scanned instantly.
- Applied the same hierarchy to community thread feed, request/report feed, thread detail body, and comment bodies.
- `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

System Thread Source Code Rendering Review (2026-02-16):
- Updated system thread source rendering to parse Etherscan multi-file payloads and extract only `sources`.
- Source section now renders each source file with filename heading and fenced code block containing only `content`.
- Excluded non-source metadata fields (`language`, `settings`, etc.) from the source section.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

System Thread Libraries Rendering Review (2026-02-16):
- Added library extraction from parsed source payload (`settings.libraries` fallback to top-level `libraries`).
- Added `## Libraries` section with JSON fenced code block formatting.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Thread Type + Title Single-Line Layout Review (2026-02-16):
- Updated thread card header style to render type badge and thread title in a single horizontal row.
- Preserved thread detail hero header layout by keeping `thread-title-block-hero` as a separate grid layout.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Community Thread Search + Filter + ID Review (2026-02-16):
- Added thread ID display on the bottom-right side of each community thread card.
- Added search input in community thread feed with query matching for:
  - thread author, title, body
  - comment author (agent handle/owner wallet) and comment body
- Added thread-type selector (`all/system/discussion/request/report`) for community-level filtering.
- Extended `/api/communities/[slug]/threads` to support `q` and `type` query params.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Requests/Reports Community Visibility + Autocomplete Search Review (2026-02-16):
- Added reusable client feed with community-name autocomplete search for both Requests and Reports pages.
- Improved community visibility on each thread card using a dedicated highlighted community block.
- Search now filters list by community name with autocomplete suggestions from existing communities in the page dataset.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Community Thread Search CommunityId + Multi-Type Filter Review (2026-02-16):
- Extended community thread search matching to include `communityId`.
- Updated thread type filtering UI from single select to multi-select checkboxes.
- Updated community thread API to accept multiple `type` query parameters and filter with `IN`.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Request Thread Resolve/Reject Status Review (2026-02-16):
- Added `Thread.isResolved` and `Thread.isRejected` with migration `20260216113000_add_request_resolution_flags`.
- Added owner-authenticated endpoint `PATCH /api/threads/[id]/request-status` for request threads only.
- Added request status display badge and owner action panel on thread detail page.
- Added request status labels in Requests list cards.
- Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Prisma Refresh Script Review (2026-02-16):
- Added `prisma:refresh` to `apps/sns/package.json` to run migrate then generate in sequence.
- Added root shortcut `sns:prisma:refresh` in `package.json`.
- Verified script visibility via `npm -w apps/sns run` and `npm run`.

Remove Requests/Reports Policy Sections Review (2026-02-16):
- Removed policy explanation cards from both Requests and Reports pages.
- Cleaned unused `Card` imports in both page files.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Request Status Popup Selector Review (2026-02-16):
- Extended request status API to support `pending` in addition to `resolved`/`rejected`.
- Replaced the separate request status card with an inline status control in thread meta.
- Status control now opens a popup menu on click with three options: Mark Pending, Mark Resolved, Mark Rejected.
- Unified the three option buttons with one shared style.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Request Status Tag Position in Requests Feed Review (2026-02-16):
- Moved request status tags from the community row into the title row.
- Status tags now appear between the `REQUEST` badge and the thread title as requested.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Request Status Popup Clipping Fix Review (2026-02-16):
- Adjusted request status popup positioning to open upward from the status trigger.
- This prevents option buttons from being clipped at the lower edge of the thread hero area.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Requests Feed Community Name Position Review (2026-02-16):
- Added a placement option to the shared community feed component.
- Set Requests feed to show community label in the meta row before author.
- Left Reports feed in the previous between-title-and-body layout.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Request Status Owner Wallet Match Check Review (2026-02-16):
- Added explicit pre-submit/pre-open validation in request status control:
  - session wallet must match community owner wallet
  - currently connected wallet must match community owner wallet
  - connected wallet and session wallet must match
- Added clear UX error messages for wallet mismatch scenarios.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Reports Feed Community Name Position Review (2026-02-16):
- Updated Reports feed to place community label in the meta row before author.
- Kept the same Requests/Reports shared component with placement option, only changing Reports usage.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Request Status Button Disable on Owner Mismatch Review (2026-02-16):
- Simplified request status guard logic to disable status trigger when signed-in wallet is not the community owner.
- Removed explicit wallet-mismatch error messages for this case.
- Kept sign-in flow when no owner session exists.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Community Thread Search Key Correction Review (2026-02-16):
- Replaced `communityId` matching with `thread.id` matching for community thread search.
- Updated search placeholder from `community id` to `thread id`.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Requests/Reports Metadata + Card Layout Merge Review (2026-02-16):
- Root cause: Requests/Reports feed component did not render created time/comment count, and page queries were not returning comment counts.
- Added created time, comment count, and thread id metadata rendering to Requests/Reports cards.
- Updated Requests/Reports Prisma queries to include `_count.comments`.
- Unified Requests/Reports card structure with community thread cards (title block, body block, shared meta layout).
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Unified Thread Card Component Across SNS Pages Review (2026-02-16):
- Added shared `ThreadFeedCard` component and moved card markup there.
- Updated `CommunityThreadFeed` and `CommunityNameSearchFeed` to import and use the same `ThreadFeedCard`.
- Updated community page thread feed data mapping to provide community name and request status flags.
- Result: community, requests, and reports listings now use the same card component and render community label consistently.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Thread Type Filter Visual Redesign Review (2026-02-16):
- Reworked thread-type controls into compact modern pills with consistent spacing and container styling.
- Added stronger selected, hover, and focus states with custom checkbox indicators.
- Kept the multi-select behavior and API query behavior unchanged.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Request Status Tag Style Unification Review (2026-02-16):
- Updated request status labels (`pending/resolved/rejected`) to render with the shared `badge` style.
- Removed separate `thread-community-status` CSS to avoid visual divergence from other tags.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Thread Type Dropdown Multi-Select Review (2026-02-16):
- Updated filter title from `Thread type (multi-select)` to `Type`.
- Replaced the previous chip checklist with a dropdown menu containing multi-select checkboxes.
- Kept the existing multi-select state/query behavior (`type` params) unchanged.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.
