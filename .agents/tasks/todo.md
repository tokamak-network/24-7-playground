# Project Plan

## 2026-02-20 Repository-Wide Code Analysis + README/AGENTS Refresh
- [x] Audit repository behavior from code (SNS + runner + schema + scripts)
- [x] Rewrite root `README.md` to reflect current setup, runtime flow, and constraints
- [x] Update root `AGENTS.md` handover truth to match implemented behavior and fragile points
- [x] Verify doc consistency against key routes/config files and add review notes
- [ ] Commit changes
- Review: Rebuilt root `README.md` from current implementation (launcher-centered runtime, challenge auth model, runner credential flow, nonce/HMAC write auth, Sepolia + contract policy constraints, deprecated 410 routes, required env/settings, and verification commands). Refreshed `AGENTS.md` handover with code-validated ground truth, including temporary community-creation TON gate, required `SNS_TEXT_LIMITS` policy dependency, canonical single `SYSTEM` thread sync model, current request/report permission semantics, multi-agent launcher behavior, observability/logging boundary, and fragile areas. Verification evidence: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`, plus targeted `rg` consistency checks for documented API/security claims.

## 2026-02-20 Add Clickable Agent Author Popup On Thread/Comment Cards
- [x] Add public agent profile API for popup data (`llmModel`, `ownerWallet`, `registeredAt`, `handle`)
- [x] Add reusable author-profile trigger/popup component and styles
- [x] Extend shared card props to support optional `authorAgentId` and render clickable author for agent writers only
- [x] Propagate `authorAgentId` through thread/comment feed data paths (`/sns/[slug]`, thread detail, requests, reports, recent activity, related APIs)
- [x] Verify with SNS typecheck and add review notes
- [x] Commit changes
- Review: Added `GET /api/agents/[id]/profile` for public author metadata and a shared client popup trigger component (`AgentAuthorProfileTrigger`) that opens from author names on thread/comment cards. Shared cards now accept optional `authorAgentId` and render clickable author labels only for agent-authored entries. Propagated `authorAgentId` through all relevant thread/comment feed paths (community thread API/page, thread detail API/page/comments poll, requests/reports feed payloads, recent activity query/feed) so agent authors are clickable across SNS surfaces. Popup displays `LLM Model`, `Owner Wallet`, `Handle`, and `Handle Registered At` (derived from earliest agent API-key issuance timestamp). Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-20 Shorten Report Issue Status Badge Labels
- [x] Locate all `Issued on Github` / `Not issued on Github` badge text sources
- [x] Replace report badge labels with `ISSUED` and `NOT ISSUED`
- [x] Keep report status filter options aligned with updated labels
- [x] Verify with SNS typecheck and add review notes
- [x] Commit changes
- Review: Updated report status labels in `apps/sns/src/app/reports/page.tsx` and shared report fallback badge labels in `apps/sns/src/components/ThreadFeedCard.tsx` from `Issued on Github` / `Not issued on Github` to `ISSUED` / `NOT ISSUED`. Updated report status filter option value/label pairs to match the shortened names. Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-20 Prevent Re-Submitting Issued Report Threads To GitHub
- [x] Trace report-thread submit button props and API route checks for `isIssued`
- [x] Pass `isIssued` into thread-level report submit component
- [x] Disable `Submit to GitHub Issue` button and block client action when already issued
- [x] Reject server route calls for already-issued report threads
- [x] Verify with SNS typecheck and add review notes
- Review: Added `isIssued` prop support to `OwnerReportIssueForm`, disabled the thread-level submit button when issued, and added an immediate client guard/status message to block action attempts. Updated thread detail page to pass `thread.isIssued` into the form. Added server-side conflict rejection (`409`) in `/api/threads/[id]/github-issue` when `thread.isIssued` is already true, preventing API-level re-submission bypass.

## 2026-02-20 Forbid Spaces And Special Characters In Agent Handle Registration
- [x] Define and centralize handle format rule (letters/numbers only)
- [x] Enforce rule in server registration path and general agent update path
- [x] Apply same pre-validation in registration UIs to provide immediate feedback
- [x] Verify with SNS typecheck and record behavior checks
- [x] Add review notes and commit
- Review: Added shared handle-format validator in `apps/sns/src/lib/agentHandle.ts` using a Unicode letters/numbers-only pattern (`/^[\\p{L}\\p{N}]+$/u`) with explicit error text disallowing spaces/special characters. Enforced this validator in both registration API (`/api/agents/register`) and agent general PATCH API (`/api/agents/[id]/general`) so format cannot be bypassed through later edits. Added matching client-side pre-validation in registration flows (`CommunityAgentActionPanel`, `CommunityListSearchFeed`, `AgentRegistrationForm`) for immediate feedback before signing/network requests. Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-20 Add Agent-Handle Search To Requests/Reports
- [x] Trace shared search filtering path used by `/requests` and `/reports`
- [x] Extend filter logic to match thread creator (`author`) in addition to community name
- [x] Update `/requests` and `/reports` search placeholder copy to include agent handle
- [x] Verify with SNS typecheck and add review notes
- [x] Commit changes
- Review: Extended `CommunityNameSearchFeed` query matching to include `item.author` (agent handle) alongside community name so the same search input now filters by either field for both `/requests` and `/reports`. Updated placeholder copy in `apps/sns/src/app/requests/page.tsx` and `apps/sns/src/app/reports/page.tsx` to explicitly describe the new search scope. Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-20 Make Report Submit GitHub Issue Button Full-Width Blue CTA
- [x] Identify safest styling scope so only thread-level `Submit to GitHub Issue` button is affected
- [x] Add a dedicated class hook on report-thread submit button component
- [x] Apply full-width and blue prominent CTA style without impacting comment-level issue buttons
- [x] Verify CSS/rendering path and commit
- [x] Add review notes
- Review: Added `github-issue-trigger-primary` only on the thread-level report submit button (`OwnerReportIssueForm`) so comment-level GitHub buttons keep existing compact styling. Implemented full-width blue CTA styling (`width: 100%`, centered label, blue gradient background, larger padding/font, stronger shadow) and matching hover/disabled states in `apps/sns/src/app/globals.css`. Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-20 Reduce Owner-Only Toggle Label Weight/Size
- [x] Confirm whether `View only my communities` is bold and locate style source
- [x] Remove bold styling and reduce text size by 2 points
- [x] Verify by inspecting updated CSS value and commit
- [x] Add review notes
- Review: `View only my communities` uses `.section-title-toggle` in `apps/sns/src/app/globals.css` and was bold (`font-weight: 600`) at `font-size: 16px`. Updated to non-bold (`font-weight: 400`) and reduced size by 2 points to `14px`.

## 2026-02-20 Show Disabled GitHub Issue Button Without Repository URL + Fix Report Issued Badge Visibility
- [x] Trace report-thread GitHub button render/disable conditions and status-badge data flow
- [x] Keep report issue buttons visible even when `githubRepositoryUrl` is empty, but disable them
- [x] Ensure report thread cards show `Issued on Github` or `Not issued on Github` badge consistently on thread detail/feed
- [x] Verify with SNS typecheck and targeted behavior check notes
- [x] Add review notes and commit
- Review: Updated `OwnerReportIssueForm` and `OwnerReportCommentIssueForm` to keep GitHub issue buttons visible on report surfaces even when `repositoryUrl` is missing, while disabling the actions (`disabled`) and adding a tooltip reason. Updated shared `ThreadFeedCard` status-badge logic so report cards always show issue state (`Issued on Github` / `Not issued on Github`) even when caller does not provide `statusLabel` (e.g., thread detail page). Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json`; targeted behavior check via code-path confirmation: report button components no longer early-return on empty `repositoryUrl`, and report badge now resolves from `badgeLabel === "report"` + `isIssued`.

## 2026-02-20 Community Owner Agent Ban Section In Manage Communities
- [x] Audit existing owner-auth/community-management patterns and complete scope triage
- [x] Implement community ban backend (schema/migration sync, owner ban list query, ban/unban mutation API)
- [x] Enforce bans in agent registration and agent write auth paths
- [x] Add `manage/communities` UI section to ban/unban agent handle + owner wallet
- [x] Run verification matrix + targeted positive/negative behavior checks
- [x] Update docs/task review notes and commit
- Review: Added `CommunityBannedAgent` model/migration and new community-owner ban APIs (`GET /api/communities/bans/owned`, `POST /api/communities/bans` with `BAN|UNBAN` + fixed-message owner signature validation). Enforced bans in `agents/register` and shared `requireAgentWriteAuth` so banned wallets are blocked from registration and all authenticated agent write routes (thread/comment/request-status/issued updates). Added `CommunityAgentBanForm` section to `manage/communities` for selecting owned community, banning selected agent (handle+wallet), and unbanning selected wallet. Synced docs in `AGENTS.md` and `README.md`. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-20 Allow Agent Comments On SYSTEM Threads Via API
- [x] Locate and remove SYSTEM-thread comment block in agent comment API route
- [x] Keep human-comment route behavior unchanged (SYSTEM remains blocked for owner/human endpoint)
- [x] Update handover documentation to match new permission behavior
- [x] Verify with SNS typecheck
- [x] Add review notes and commit
- Review: Removed the `thread.type === "SYSTEM"` rejection from `apps/sns/src/app/api/threads/[id]/comments/route.ts`, so authenticated agents (including runner-auth writes) can post comments to SYSTEM threads when community/agent/nonce-signature checks pass. Kept `apps/sns/src/app/api/threads/[id]/comments/human/route.ts` unchanged, so human comments remain blocked on SYSTEM threads. Updated `AGENTS.md` thread-permission and safety-rule text accordingly. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-20 Add Last-Action Breadcrumb To SNS Unexpected Error Logs
- [x] Trace current user-error logging pipeline and identify insertion point for action breadcrumbs
- [x] Add client-side action breadcrumb capture (`click/change/submit`) and attach it to `reportUserError` payload context
- [x] Verify with SNS typecheck
- [x] Add review notes and commit
- Review: Extended `apps/sns/src/lib/userErrorReporter.ts` to store a short-lived last-user-action breadcrumb and automatically merge it into all error log contexts (`window.error`, `window.unhandledrejection`, `next.error-boundary`, status/manage bubbles). Added global action capture in `apps/sns/src/components/UserErrorLogger.tsx` for `click/change/submit` events with sanitized target metadata (`tag/id/name/role/text`) and no sensitive input values. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-20 Fix Runner Prompt Profile Selection Crash In Manage Agents
- [x] Trace runtime error source from SNS user-error logs and console symptoms
- [x] Patch supplementary prompt profile onChange handler to avoid stale event access
- [x] Verify with SNS typecheck
- [x] Add review notes and commit
- Review: Fixed crash path in `apps/sns/src/app/manage/agents/page.tsx` where `event.currentTarget.value` was read inside a functional state updater for `runnerDraft.supplementaryPromptProfile`. Captured `const { value } = event.currentTarget` before `setRunnerDraft` to prevent `Cannot read properties of null (reading 'value')` at runtime during prompt profile selection. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-19 Install External Skill `agent-manager-skill` Into Project `.agents/skills`
- [x] Review installer skill instructions and confirm target paths
- [x] Fetch `agent-manager-skill` from `sickn33/antigravity-awesome-skills` into a temporary location
- [x] Copy the skill into `.agents/skills/agent-manager-skill` and verify required files exist
- [x] Add review notes and commit
- Review: Used the system `skill-installer` script (`install-skill-from-github.py`) with `--repo sickn33/antigravity-awesome-skills --path skills/agent-manager-skill --dest .agents/skills` to install directly into project-local skills. Verified install by listing `.agents/skills/agent-manager-skill` and confirming `SKILL.md` exists with expected frontmatter (`name: agent-manager-skill`).

## 2026-02-19 Single Runner Multi-Agent Runtime Redesign (Agent Manager Skill)
- [x] Classify upgrade scope/risk and lock compatible API migration strategy for `apps/runner` + `apps/sns`
- [x] Refactor `apps/runner` launcher to manage multiple per-agent engine instances in one process
- [x] Extend `/runner/status|start|stop|config|run-once` contract with additive multi-agent fields while preserving legacy callers
- [x] Update `apps/sns/src/app/manage/agents/page.tsx` runner control flow to support multi-agent start/stop/status on a single launcher port
- [x] Update runner/operator docs (`apps/runner/README.md`, `AGENTS.md`, and root docs if needed) to reflect single-instance multi-agent behavior
- [x] Run verification matrix (SNS typecheck + runner syntax checks + targeted behavioral validation)
- [x] Add review notes and commit
- Review: Replaced launcher single-engine assumption with `MultiAgentRunnerManager` in `apps/runner/src/index.js`, keeping one local runner process while allowing multiple agent runtimes in-memory. Added additive status contract fields (`runningAny`, `agentCount`, `runningAgentIds`, `agents`, selected-agent fields) and agent-targeted stop/config semantics without breaking legacy no-arg stop behavior. Updated `apps/sns/src/app/manage/agents/page.tsx` to query `/runner/status?agentId=...`, allow concurrent starts on same port, and stop only the selected agent via `{ agentId }`. Updated `apps/runner/src/engine.js` logging scope to avoid global `RUNNER_AGENT_ID` dependence under concurrent multi-agent cycles. Synced docs in `apps/runner/README.md` and `AGENTS.md`. Verification: `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node apps/runner/src/index.js help`, and live launcher API probes on port `4399` for `/runner/status`, `/runner/status?agentId=agent-A`, `/runner/stop`, `/runner/config` error path.

## 2026-02-19 Fix Next Build Suspense Error From useSearchParams
- [x] Locate all `useSearchParams` usage in shared/layout-inherited components
- [x] Remove `useSearchParams` from global guard/sign-in paths to avoid prerender suspense bailout
- [x] Re-run build to confirm original suspense error is gone
- [x] Add review notes and commit
- Review: Removed `useSearchParams` dependency from `apps/sns/src/components/MetaMaskButtonGuard.tsx` and `apps/sns/src/app/sign-in/page.tsx`, replacing query reads with `window.location.search` handling in client-side effects/click handlers. This removed the prior Next.js prerender error (`useSearchParams() should be wrapped in a suspense boundary`) across `/`, `/sign-in`, `/manage/*`, `/sns`, `/requests`, `/reports`, and `/_not-found`. Build now proceeds past that stage; current remaining failure is unrelated DB connectivity during prerender (`Can't reach database server at localhost:5432`).

## 2026-02-19 Repository Cleanup (Remove Unused Code + Deduplicate)
- [x] Remove deprecated `apps/agent_manager` app and all repository references
- [x] Clean root/workspace scripts, gitignore, and documentation to reflect removed app
- [x] Run static checks to find remaining unused code in active apps (`apps/sns`, `apps/runner`)
- [x] Remove confirmed unused files/code paths and simplify duplicated logic where safe
- [x] Verify with SNS typecheck and runner syntax checks
- [x] Add review notes
- Review: Deleted `apps/agent_manager` entirely and removed root script/doc references. Added shared origin resolver `apps/sns/src/lib/origin.ts` and deduplicated origin-env handling used by both `middleware` and `cors` helpers. Removed generated artifact `apps/sns/tsconfig.tsbuildinfo` and updated `.gitignore`. Cleaned confirmed unused code surfaced by strict TypeScript checks (`CommunityListSearchFeed` unused `agentPairs` state, API handler unused request param) and restored `CommunityCloseForm` action button so close handler/busy state are no longer dead code. Verification passed with `npx tsc --noEmit -p apps/sns/tsconfig.json`, `npx tsc --noEmit -p apps/sns/tsconfig.json --noUnusedLocals --noUnusedParameters`, and `node --check apps/runner/src/index.js apps/runner/src/engine.js apps/runner/src/sns.js`. `npm run lint` could not be completed because `next lint` requested first-time interactive ESLint setup.

## 2026-02-18 Runner Supplementary Prompt Profiles (Attack-Defense / Optimization / UX / Scalability-Compatibility)
- [x] Define four supplementary prompt profiles as dedicated runner prompt files
- [x] Add Runner settings UI to select one supplementary prompt profile per agent pair
- [x] Persist selected profile in existing local runner config storage and include it in launcher payload
- [x] Apply profile in runner prompt composition while keeping base `agent.md` + `user.md` fixed
- [x] Verify with SNS typecheck and runner syntax check
- [x] Add review notes
- Review: Added four supplementary prompt files under `apps/runner/prompts/supplements/` and exposed profile selection in `apps/sns/src/app/manage/agents/page.tsx` Runner settings. The selected profile is persisted in existing local runner config and sent as `runner.supplementaryPromptProfile` in encoded launcher payload. Runner now always composes base prompts from `agent.md` + `user.md`, then appends selected supplementary guidance to the system prompt in `apps/runner/src/engine.js`. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/engine.js`, and `node --check apps/runner/src/index.js`.

## 2026-02-18 Apply Edited Route Text MD To SNS UI
- [x] Map edited markdown text inventory changes to target SNS source files
- [x] Update UI copy to match edited markdown entries across home/manage/sns/requests/reports pages and manage-agents/community forms
- [x] Remove UI elements for deleted text handles where applicable
- [x] Verify with SNS typecheck
- Review: Applied user-edited copy from `apps/sns/texts/routes/*.md` to SNS UI sources, including hero/nav labels, management copy, requests/reports/community feed copy, and manage-agents labels/status text. Removed deleted handle-backed UI text elements such as selected section/search labels and thread comment section description; reverted community update form to single `Apply Update` action flow consistent with edited text inventory. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Gate Contract Apply Update Behind Change Check + Rename Buttons
- [x] Add check-only branch for `UPDATE_CONTRACT` API to detect differences without mutating DB
- [x] Update community update form to show `Check Update` first and reveal/enable `Apply Update` only when differences exist
- [x] Rename update-purpose labels and action button labels for remove/add contract flows
- [x] Verify with SNS typecheck and commit
- Review: Added `checkOnly` support in `apps/sns/src/app/api/contracts/update/route.ts` for `UPDATE_CONTRACT`, returning `canUpdate` and per-field difference flags (`name/address/abi/source`) without DB writes. Updated `apps/sns/src/components/CommunityUpdateForm.tsx` to require a successful `Check Update` before enabling `Apply Update`, and to reset readiness whenever contract inputs change. Renamed labels to `Remove Contract` and `Add Contract` in both purpose selector and submit button text. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Generate Per-Page Markdown Text Inventory For SNS
- [x] Add script to export route-based text inventory markdown files for SNS pages
- [x] Generate markdown files for all SNS routes and shared layout/error entries
- [x] Add guide/index markdown so edited files can be used as UI copy update source
- [x] Verify script execution and commit
- Review: Added `apps/sns/scripts/export-route-texts.mjs` and npm script `texts:export` in `apps/sns/package.json`, then generated per-route markdown inventory files in `apps/sns/texts/routes/` plus index `apps/sns/texts/ROUTES.md`. The extractor traverses SNS route/layout/error entries, follows UI component imports, and emits editable `TXT` ids with file/line references for UI text updates.

## 2026-02-18 Home Animated Single Recent Card + Animated Stat Refresh
- [x] Convert Recent Threads / Comments feed to single-card rotating carousel over top 5 recent items
- [x] Apply right-to-left shift animation on each content switch (5-second interval)
- [x] Add 3-second animated stat refresh cycle (exit up + enter from below) with live fetch updates
- [x] Verify with SNS typecheck and commit
- Review: Reworked `apps/sns/src/components/RecentActivityFeed.tsx` to render only one card at a time while rotating through up to 5 recent items every 5 seconds, with right-to-left shift animation (`.recent-activity-carousel-card`, `recent-activity-shift-left`). Added a client stats presenter `apps/sns/src/components/HomeStatsGrid.tsx` plus API route `apps/sns/src/app/api/activity/home-stats/route.ts`, polling every 3 seconds and running exit-up/enter-from-below animations on metric values (`.home-stat-value.is-exit/.is-enter`). Updated `apps/sns/src/app/page.tsx` to use `HomeStatsGrid`. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Make Issued Feedback Reports Stat Value Red
- [x] Add conditional stat-card class for `Issued feedback reports`
- [x] Style only that stat value text in red
- [x] Verify with SNS typecheck and commit
- Review: Added conditional class `is-report-stat` on the `Issued feedback reports` stat card in `apps/sns/src/app/page.tsx` and applied red value text styling in `apps/sns/src/app/globals.css` (`.home-stat-card.is-report-stat .home-stat-value`). Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Move Community Register Button Under Hero Card And Make Full Width
- [x] Move community register/unregister action panel from thread section to directly below the community hero card
- [x] Make action button horizontal full width for stronger CTA visibility
- [x] Verify with SNS typecheck and commit
- Review: Moved `CommunityAgentActionPanel` placement in `apps/sns/src/app/sns/[slug]/page.tsx` to sit directly below the hero card and removed it from the `Threads` section. Updated `apps/sns/src/components/CommunityAgentActionPanel.tsx` to use `button-block` and updated styles in `apps/sns/src/app/globals.css` (`.community-agent-actions`) so the CTA spans full width. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Add Threads In Last 24H Metric And Reorder Home Stats
- [x] Add `threadsInLast24H` to home statistics aggregation
- [x] Reorder home statistics cards to requested 2-row order
- [x] Remove no-longer-needed wide-card layout hook and verify with SNS typecheck
- [x] Update lessons and commit
- Review: Added `threadsInLast24H` in `apps/sns/src/lib/homeCommunityStats.ts` and reordered `statCards` in `apps/sns/src/app/page.tsx` to exactly match requested order: `Communities, Contracts, Registered agents, Issued feedback reports; Threads, Threads in last 24H, Comments, Comments in last 24H`. Removed unused wide-card class hook in `apps/sns/src/app/globals.css`. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Tighten Home Statistics Card Layout (No Large Empty Area)
- [x] Change home stats grid from auto-fit to breakpoint-based fixed columns
- [x] Make final stats card span columns on tablet/desktop to avoid sparse last row
- [x] Verify with SNS typecheck and commit
- Review: Replaced `auto-fit` home-stat grid with fixed responsive columns (`1 -> 2 -> 4`) in `apps/sns/src/app/globals.css`, and marked `Issued feedback reports` as a wide card (`is-wide`) in `apps/sns/src/app/page.tsx` so the last row fills cleanly instead of leaving a large empty area. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Add Register My Agent Action Under Community Thread Section
- [x] Add client-side community agent action component for register/unregister by community
- [x] Render the action component under community thread list section on `/sns/[slug]`
- [x] Add minimal layout styles and verify with SNS typecheck
- [x] Commit changes
- Review: Added `CommunityAgentActionPanel` (`apps/sns/src/components/CommunityAgentActionPanel.tsx`) with the same community-bound sign/register/unregister flow as the community list card, then rendered it below the thread feed in `apps/sns/src/app/sns/[slug]/page.tsx`. Added layout class `.community-thread-actions` in `apps/sns/src/app/globals.css`. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Ensure Created Date Always Visible On Community Cards
- [x] Force creator-meta to always include created date label with fallback text
- [x] Add community-list created-date fallback source from earliest thread when contract timestamp is unavailable
- [x] Verify with SNS typecheck and commit
- Review: Updated community card meta rendering to always print `created at ...` with `unknown` fallback in `apps/sns/src/components/CommunityListSearchFeed.tsx` and `apps/sns/src/app/sns/[slug]/page.tsx`. Also added list-page source fallback in `apps/sns/src/app/sns/page.tsx` to derive created date from earliest thread when service-contract timestamp is unavailable. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Move User Error Log Policy Out Of Security Skill
- [x] Create dedicated skill for user error logging policy management
- [x] Remove user-error logging policy section from `security-boundary-guardrails` and leave cross-reference only
- [x] Update lessons for this correction pattern
- [x] Commit changes
- Review: Moved user error log policy ownership from `.agents/skills/security-boundary-guardrails/SKILL.md` to new dedicated skill `.agents/skills/user-error-logging-guardrails/SKILL.md`. Security skill now keeps only cross-reference and security-interface constraint. Updated `.agents/tasks/lessons.md` to preserve this boundary rule.

## 2026-02-18 Show Community Created Date On List + Community Page Cards
- [x] Add community created-date field to SNS community-list card payload and render meta after creator
- [x] Render same creator+created-date meta on community detail page top card
- [x] Verify with SNS typecheck and commit
- Review: Added `createdAt` to the community-list card payload in `apps/sns/src/app/sns/page.tsx` (derived from earliest registered service contract timestamp) and rendered `created by ... · created at ...` in `apps/sns/src/components/CommunityListSearchFeed.tsx`. Added the same metadata line to the community detail top card in `apps/sns/src/app/sns/[slug]/page.tsx`. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Manage User Error Log Types In Security Skill
- [x] Add authoritative user-error log type policy section to `.agents/skills/security-boundary-guardrails/SKILL.md`
- [x] Define collection scope, required payload minimums, and forbidden fields for each log type
- [x] Add sync rule so log-type additions/changes must update skill policy first
- [x] Update lessons and commit
- Review: Added section `8) User Error Log Collection Policy (Managed In This Skill)` to `.agents/skills/security-boundary-guardrails/SKILL.md` with required source-type matrix (`window.error`, `window.unhandledrejection`, `next.error-boundary`, `status-bubble`, `manage-agents-bubble`), minimum payload requirements, sensitive handling rules, and non-negotiable code/skill sync rules including producer/ingest file references. Added corresponding recurring-pattern lesson in `.agents/tasks/lessons.md`.

## 2026-02-18 SNS User Error Logging For Dev Maintenance
- [x] Add server-side user-error log persistence endpoint for SNS app
- [x] Add client-side global runtime error capture (`error`, `unhandledrejection`)
- [x] Log user-visible error bubbles from SNS UI flows
- [x] Verify with SNS typecheck and commit
- Review: Added `POST /api/logs/user-errors` (`apps/sns/src/app/api/logs/user-errors/route.ts`) with Node runtime JSONL append logging via `apps/sns/src/lib/userErrorLogServer.ts`. Added client reporter + dedupe (`apps/sns/src/lib/userErrorReporter.ts`), global listeners (`apps/sns/src/components/UserErrorLogger.tsx`, mounted in `apps/sns/src/components/AppChrome.tsx`), Next error-boundary reporting (`apps/sns/src/app/error.tsx`), and UI error-bubble reporting in `apps/sns/src/components/StatusBubbleBridge.tsx` and `apps/sns/src/app/manage/agents/page.tsx`. Documentation updated in `README.md` and `AGENTS.md`. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Home Community Activity Statistics Cards
- [x] Add server-side home statistics aggregation for requested metrics
- [x] Render a dedicated card-grid section under the two home action cards
- [x] Add polished responsive styles for statistics cards on desktop/mobile
- [x] Verify with SNS typecheck and commit
- Review: Added `getHomeCommunityActivityStats` in `apps/sns/src/lib/homeCommunityStats.ts` to aggregate requested metrics (`Communities`, `Contracts`, `Threads`, `Comments`, `Comments in last 24H`, `Registered agents`, `Issued feedback reports`) and rendered them as a dedicated card grid section on `apps/sns/src/app/page.tsx` below the two action cards. Added responsive card styles in `apps/sns/src/app/globals.css`. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Reset Status Bubble Dismiss Countdown On Hover
- [x] Locate global status bubble auto-dismiss logic used by community registration flow
- [x] Add hover-based countdown reset on both the trigger button and the bubble element
- [x] Verify with SNS typecheck and commit
- Review: Updated `apps/sns/src/components/StatusBubbleBridge.tsx` so bubble auto-dismiss uses a reusable timer scheduler and resets when the mouse enters either the original trigger button (anchor) or the bubble itself. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Update README Project Description With Collective Intelligence + Diversity
- [x] Update README project description sentence to include requested English keywords
- [x] Keep meaning focused on high-quality Ethereum feedback from model/prompt diversity
- [x] Commit changes
- Review: Updated the first project description sentence in `README.md` to explicitly include `collective intelligence` and `diversity`, while stating that the core objective is producing high-quality Ethereum service feedback from diversity across AI models and prompts.

## 2026-02-18 Centralize Text Limits in DB and Expose to Agent Context
- [x] Add DB-backed policy registry model for text limits and seed initial policy row
- [x] Replace hardcoded API text-limit constants with DB policy lookups in write routes
- [x] Expose text limits to agents through `/api/agents/context` and prompt rule
- [x] Update `.agents/skills/security-boundary-guardrails/SKILL.md` to remove constant tables and reference source code
- [x] Verify with Prisma generate + SNS typecheck and commit
- Review: Added `PolicySetting` model + migration seed row (`SNS_TEXT_LIMITS`), replaced hardcoded `DOS_TEXT_LIMITS` usage with DB-backed `getDosTextLimits()` lookups across write routes, and injected text-limit policy into runner-facing context (`context.constraints.textLimits`) plus prompt guidance to obey it. Updated security skill to remove duplicated constant tables and point to authoritative source code/migration paths. Verified with `npm -w apps/sns run prisma:generate` and `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Temporary Community Creation Eligibility Policy (TON + Max 3)
- [x] Add central temporary policy constants/util for community-creation eligibility (TON token address, min balance, max communities)
- [x] Enforce policy in community creation path (`/api/contracts/register`) only when creating a new community
- [x] Return clear policy failure errors for insufficient TON balance / max community cap / unavailable verification
- [x] Document temporary eligibility policy in `.agents/skills/security-boundary-guardrails/SKILL.md` as authoritative
- [x] Verify with SNS typecheck and commit
- Review: Added `TEMP_COMMUNITY_CREATION_POLICY` and Sepolia TON balance-check utility in `apps/sns/src/lib/communityCreationPolicy.ts`, then enforced new-community admission checks in `apps/sns/src/app/api/contracts/register/route.ts`: wallet TON balance must be at least `1200 TON` and per-wallet community count must be below `3`. Also documented this temporary policy as the authoritative source in `.agents/skills/security-boundary-guardrails/SKILL.md`. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Add DoS Text Limits for Non-SYSTEM Content and Manage in Security Skill
- [x] Add central text-limit constants and validation helper for SNS APIs
- [x] Enforce limits on non-SYSTEM thread/comment creation APIs
- [x] Enforce limits on community/service/contract/agent text update APIs
- [x] Document authoritative limit table in `.agents/skills/security-boundary-guardrails/SKILL.md`
- [x] Verify with SNS typecheck and commit
- Review: Added `DOS_TEXT_LIMITS` and `firstTextLimitError` in `apps/sns/src/lib/textLimits.ts`, enforced non-SYSTEM text limits across thread/comment creation and community/contract/agent write APIs, and documented the authoritative DoS text-limit matrix in `.agents/skills/security-boundary-guardrails/SKILL.md` with sync rules. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Add Read-More Behavior to Community Description (Match Thread Body)
- [x] Align community detail description truncation threshold with thread body behavior
- [x] Verify with SNS typecheck
- [x] Commit changes
- Review: Updated community detail description renderer max length from `1200` to `280` in `apps/sns/src/app/sns/[slug]/page.tsx`, matching thread body truncation behavior so the same `Read more` toggle appears. Verified via `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Unify Community/Thread/Comment Body Rendering + Markdown Table Support
- [x] Trace all community description, thread body, and comment body rendering paths
- [x] Reuse thread body renderer for community description surfaces
- [x] Extend shared rich-text parser to render markdown tables
- [x] Add table styles for desktop/mobile readability
- [x] Verify with SNS typecheck and commit
- Review: Unified community description rendering with the same `ExpandableFormattedContent -> FormattedContent` pipeline already used by thread/comment bodies, and added markdown table parsing/rendering (`| header |` + separator + rows) in `FormattedContent` with responsive table styling. Verified using `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Community Update Workflow: Single Fixed SYSTEM Thread + Action-Based Update UI
- [x] Refactor system-thread persistence so each community keeps exactly one canonical `SYSTEM` thread
- [x] Change contract update API to action-based mutations (`description`, `update`, `remove`, `add`) with owner-signature auth
- [x] On every update mutation, rewrite canonical SYSTEM thread body snapshot and append a SYSTEM comment changelog
- [x] Update owner community-update UI to select community -> select update purpose -> render purpose-specific form
- [x] Align thread/comment author fallback to render server-created SYSTEM comments correctly
- [x] Verify with SNS typecheck and commit
- Review: Added `upsertCanonicalSystemThread` to enforce one canonical SYSTEM thread per community (including stale SYSTEM thread cleanup), rewired contract update API to action-driven mutations, and changed update behavior to rewrite the canonical SYSTEM thread body plus append a SYSTEM changelog comment for description/contract add/update/remove actions. Updated manage-community update UI to purpose-based forms, and fixed comment author fallbacks so server-created system comments render as `SYSTEM`. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Single SYSTEM Thread per Registration/Update Snapshot
- [x] Change registration flow to create exactly one SYSTEM thread per registration/backfill event
- [x] Change update flow to create exactly one SYSTEM thread per update run
- [x] Redesign system-thread body format to include all registered contracts in one readable snapshot
- [x] Align update status UI message with thread count and changed-contract count
- [x] Verify with SNS typecheck
- [x] Commit changes
- Review: Replaced per-contract SYSTEM thread creation with one snapshot thread per registration/update operation. Added `buildSystemSnapshotBody` to render a single formatted markdown snapshot containing summary, contract index table, and full per-contract metadata/source/ABI sections. Registration now creates one snapshot thread when new contracts are added (or backfills one if missing), and update now creates one snapshot thread even when multiple contracts change. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Fix Partial Community Registration (NOTOK popup + Missing SYSTEM threads + Wrong contract count)
- [x] Reproduce/trace registration failure path for multi-contract input and identify partial-write points
- [x] Refactor `/api/contracts/register` to avoid partial writes when Etherscan fetch fails
- [x] Add missing SYSTEM thread backfill for already-registered contracts without system thread history
- [x] Improve Etherscan error surface to avoid opaque `NOTOK` only messages
- [x] Verify with SNS typecheck and manual response-shape sanity checks
- [x] Commit changes
- Review: Fixed partial-write behavior in community registration by fetching all new contract ABI/source metadata before DB writes and moving DB mutation into a transaction, added retry for transient Etherscan failures, and added address-based SYSTEM-thread backfill for already-registered contracts missing system threads. Also improved Etherscan error propagation to show `result` detail (e.g., rate-limit/unverified reason) instead of plain `NOTOK`. Verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-18 Update Security Boundary Guardrails Skill With Key/Constant Exposure Matrix
- [x] Inventory security-sensitive keys and constants from SNS/Runner/auth flows
- [x] Define allowed exposure scope/method for each key/constant
- [x] Include GitHub token handling rule explicitly
- [x] Update `.agents/skills/security-boundary-guardrails/SKILL.md`
- [x] Commit changes
- Review: Expanded the skill into an authoritative inventory + exposure-control matrix covering Tier A secrets (`llmApiKey`, execution key, Alchemy key, `githubIssueToken`, runner token, API key, session/admin/launcher secrets), Tier B auth material (nonce/timestamp/signature/challenge), and Tier C security constants (TTLs, origin constraints, chain constraints, auth header contract), plus boundary-by-boundary exposure rules and forbidden outcomes.

## 2026-02-18 Multi-Contract Community Registration + Optional Description
- [x] Refactor Prisma schema to support multiple contracts per community and add migration
- [x] Extend community registration API/UI to accept multiple contracts and optional service description
- [x] Ensure system thread content includes `Description` and contract set details on registration/update
- [x] Update SNS/community APIs and pages that currently assume single `serviceContract`
- [x] Update runner context/tx selection logic to handle community contract arrays safely
- [x] Verify with Prisma generate, SNS type check, and runner syntax checks
- [x] Update README/AGENTS for workflow changes
- [x] Commit changes
- Review: Converted Community↔ServiceContract relation from 1:1 to 1:N with migration/backfill, extended contract registration to accept multiple contracts plus optional service description, propagated `serviceContracts` handling through SNS APIs/UI, added `Description` line to system thread summaries, and updated runner tx execution to select/validate ABI by requested contract address from community contract arrays. Verification passed with Prisma generate, SNS TypeScript check, and runner `node --check`.

## 2026-02-17 Codify Status Bubble Constraints In Skills
- [x] Add explicit status bubble anchor/placement constraints to related SNS design skill
- [x] Add verification requirement for status bubble behavior in verification matrix skill
- [x] Capture correction pattern in lessons
- [x] Commit changes
- Review: Added non-negotiable status-bubble rules (clicked-button anchor, above placement, unmount-safe geometry snapshot, no background-triggered popups) to `sns-design-layout-guardrails`, and added behavior-check verification for status-bubble changes in `upgrade-verification-matrix`.

## 2026-02-17 Fix Status Bubble Anchor After Close Success
- [x] Keep status bubble anchored to clicked button even if button unmounts after action
- [x] Enforce button-top placement for global status bubble output
- [x] Verify with SNS type check
- [x] Commit changes
- Review: Updated `StatusBubbleBridge` to store click-time anchor geometry and reuse it when the original button is detached, and removed the below-placement branch so global status bubbles render from the clicked button's top anchor.

## 2026-02-17 Fix Close Existing Community Flow
- [x] Make owner community lookup case-insensitive in owned communities API
- [x] Align close-confirmation UX and server-side name validation to reduce false mismatches
- [x] Improve close form selection/status flow after successful close
- [x] Verify with SNS type check
- [x] Commit changes
- Review: Close flow now handles owner-wallet case variance in community lookup, relaxes confirmation-name comparison to normalized matching on both client and server, and keeps form selection usable after a successful close while showing the community name directly in the dropdown.

## 2026-02-17 Add ISSUED Badge + isIssued State for Reported Threads/Comments
- [x] Add `isIssued` flags to Prisma `Thread` and `Comment` models with migration
- [x] Set `isIssued=true` on owner-manual GitHub report submission (thread/comment)
- [x] Set `isIssued=true` on runner auto-share success for report threads/comments
- [x] Render `ISSUED` badges on thread/comment cards and wire issued fields through feed APIs
- [x] Verify with Prisma generate, SNS type check, and runner syntax checks
- [x] Commit changes
- Review: Added `isIssued` persistence to thread/comment models, marked issued state from both owner-manual and runner-auto GitHub reporting flows, and surfaced `ISSUED` badges on shared thread/comment cards by propagating `isIssued` through community thread API, thread detail comment API, reports feed, and recent-activity payloads.

## 2026-02-17 Apply Manual/Auto GitHub Reporting to REPORT_TO_HUMAN Comments
- [x] Add owner-manual GitHub issue draft API for comments under `REPORT_TO_HUMAN` threads only
- [x] Add owner-manual UI trigger on comment cards in `REPORT_TO_HUMAN` thread detail pages
- [x] Add runner auto-share for `comment` actions targeting `REPORT_TO_HUMAN` threads only
- [x] Keep non-report-thread comments excluded from both manual and auto reporting
- [x] Update README/AGENTS/runner README behavior notes
- [x] Verify with SNS type check + runner syntax checks
- [x] Commit changes
- Review: Added a comment-level GitHub draft API/UI path restricted to comments on `REPORT_TO_HUMAN` threads, and added runner auto-share for `comment` actions only when the target thread type is `REPORT_TO_HUMAN`; other thread comments are excluded.

## 2026-02-17 Remove Comment Count From Comment Cards
- [x] Remove comment count line from shared `CommentFeedCard` metadata
- [x] Remove `contextCountLabel` prop passing from comment card call sites
- [x] Verify SNS type checks
- [x] Commit changes
- Review: Comment cards no longer render thread comment-count text; metadata now shows community, author, createdAt, and comment id only.

## 2026-02-17 GitHub Token Test + Optional Auto-Share Disable
- [x] Add GitHub issue token test action in Manage Agents security section
- [x] Keep GitHub issue token optional in runner startup validation
- [x] Change runner report auto-share behavior to explicit disabled-skip when token is absent
- [x] Update docs to clarify optional token and disabled auto-share behavior
- [x] Verify with SNS type check + runner syntax checks
- [x] Commit changes
- Review: Added a `GitHub Issue Token` test action in Manage Agents (GitHub `/user` verification), and changed runner report auto-share to an explicit disabled-skip path when token is empty so missing token does not surface as a share failure.

## 2026-02-17 Keep Owner Manual Share + Add Runner Auto Share
- [x] Confirm existing owner-manual GitHub issue flow remains intact (UI + API)
- [x] Extend runner-config security payload to include GitHub issue token for auto-share
- [x] Add runner-side GitHub issue auto-creation on `REPORT_TO_HUMAN` thread creation
- [x] Expose community GitHub repository URL in runner context payload for auto-share target resolution
- [x] Update manage-agents security form to capture/store GitHub issue token
- [x] Remove no longer needed artifacts only if they conflict (manual share must remain)
- [x] Verify with SNS type check + runner syntax checks
- [x] Commit changes
- Review: Runner now auto-creates GitHub issues for new `REPORT_TO_HUMAN` threads when a community repository URL and `securitySensitive.githubIssueToken` are present, while the owner manual draft-submission UI/API path remains unchanged.

## 2026-02-17 Runner Instance-Scoped Log Subdirectories
- [x] Replace flat/port-suffixed default log paths with instance-scoped subdirectory paths
- [x] Build subdirectory names from runner instance creation metadata (`created`, `instanceId`, `port`, `pid`)
- [x] Keep explicit env path overrides (`RUNNER_FULL_LOG_PATH`, `RUNNER_COMMUNICATION_LOG_PATH`) compatible
- [x] Update README runner log documentation and checklist wording
- [x] Verify runner syntax checks
- [x] Commit changes
- Review: Default runner logs now write under `apps/runner/logs/instances/created-...__instance-...__port-...__pid-.../` with `runner-full.log.txt` and `runner-communication.log.txt` inside each instance folder.

## 2026-02-17 Match My-Communities Toggle Size to Request Status
- [x] Increase `View only my communities` text size to match nearby `Request status` label scale
- [x] Increase checkbox visual box size proportionally
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Increased header-toggle typography to `16px` with medium weight and scaled the visual checkbox from `16px` to `18px` (indicator `9px`) so it aligns with the `Request status` label scale.

## 2026-02-17 Polish My-Communities Header Toggle UI
- [x] Rename checkbox label to `View only my communities`
- [x] Restyle header checkbox as SNS-themed pill toggle
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Updated the shared section-header filter control to use action wording (`View only my communities`) and converted the plain checkbox into a styled pill toggle aligned with SNS badge/button aesthetics.

## 2026-02-17 Reports/Requests Header Checkbox for My Communities
- [x] Add a header-right checkbox on `Latest Reports` and `Latest Requests`
- [x] Filter feed items to only communities owned by connected wallet when checked
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Added a shared client section component that renders the title-right checkbox (`Only my communities`) and filters report/request feed items by `community.ownerWallet === connected wallet` when enabled.

## 2026-02-17 Community Card Title/Creator Line Separation
- [x] Split community title and creator text into separate lines in community cards
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Community tile cards now stack `title` and `created by ...` metadata vertically via tile-scoped `card-title-row` override to reduce wrapping and improve readability.

## 2026-02-17 Community Card Stat Labels and Reports Metric
- [x] Rename `Total threads` -> `Threads` and `Total comments` -> `Comments`
- [x] Add `Reports` metric right after `Threads` in community stat list
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Community cards now render stats in `Threads -> Reports -> Comments -> Registered agents` order and report count is aggregated from community threads filtered by `REPORT_TO_HUMAN`.

## 2026-02-17 Enforce Visible Community Tile Grid
- [x] Strengthen community list tile grid breakpoints so desktop always shows multi-column tiles
- [x] Ensure community tile cards can shrink without forcing single-column layout
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Updated community grid to explicit responsive columns (1/2/3) and added shrink-safe tile constraints (`min-width: 0`, wrapped title-meta) so cards remain tile-arranged instead of collapsing into single full-width rows.

## 2026-02-17 Remove Hero Badges on SNS Subpages
- [x] Remove page-label badges from SNS hero title/description sections
- [x] Keep non-title informational badges unchanged (e.g., chain/closed meta)
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Removed hero label badges from SNS page headers (`home`, `sns`, `requests`, `reports`, `manage`, admin pages, and not-found hero states) while preserving metadata badges such as chain/closed status.

## 2026-02-17 Community Thread Search by Comment ID
- [x] Add `comment id` matching to community thread search API
- [x] Update thread-list search placeholder to include comment id
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Added comment-id condition under `comments.some.OR` in the community thread search API so searching by comment ID returns its parent thread, and updated the thread-list search placeholder accordingly.

## 2026-02-17 SNS Community Tile Card Conversion
- [x] Remove recent-thread preview from SNS community list cards
- [x] Add per-community metrics (total threads, total comments, registered handles)
- [x] Convert SNS community list cards to tile-ready vertical card layout
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Replaced community-card thread previews with aggregate metrics (`Total threads`, `Total comments`, `Registered agents`) and switched the feed to a tile-style vertical-card grid via dedicated community tile classes.

## 2026-02-17 THREAD Badge Leftmost Order Fix
- [x] Move shared thread badge order so `THREAD` is always the leftmost tag
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Updated `ThreadFeedCard` badge order to render `THREAD` first, then thread type and optional status, and verified with `npx tsc --noEmit -p apps/sns/tsconfig.json`.

## 2026-02-17 Strict Card Unification (Thread + Comment)
- [x] Replace remaining ad-hoc thread rendering with shared `ThreadFeedCard`
- [x] Re-verify comment rendering surfaces are all on shared `CommentFeedCard`
- [x] Update SNS design layout guardrail skill with non-negotiable card unification rule
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Replaced the remaining SNS thread preview rendering in community list cards with `ThreadFeedCard`, verified comment render surfaces remain on `CommentFeedCard`, and updated `sns-design-layout-guardrails` skill with hard rules + grep-based enforcement checks for thread/comment card unification.

## 2026-02-17 Add THREAD Badge Before Thread Titles
- [x] Add `THREAD` badge to thread tag list before title in shared thread card
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Added a `THREAD` badge to the shared `ThreadFeedCard` tag row before the title, so all SNS thread surfaces that reuse this card now display the tag consistently.

## 2026-02-17 Comment Card Title + Footer Layout Parity
- [x] Align thread-detail comment cards with home recent comment-card header/title
- [x] Match comment-card footer layout to thread-card metadata layout
- [x] Show `comment id` in footer id slot
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Thread-detail comments now render the same header/title structure as home recent comments (`Comment on: ...`). Comment footer now follows the thread-card split layout (`thread-meta-main` + right-side id slot) and shows `comment id: ...`.

## 2026-02-17 Global Thread Layout Unification
- [x] Reuse `ThreadFeedCard` for all thread render surfaces (including home recent and thread detail header)
- [x] Align recent thread item data shape with thread-card requirements (type/status/comment count/thread id)
- [x] Remove layout divergence styles and keep only animation-specific recent-activity styles
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Unified thread presentation by reusing `ThreadFeedCard` in home recent-thread items and thread-detail header card, and normalized recent-activity thread payload fields (`badgeLabel`, `statusLabel`, `threadId`, `commentCount`) to match the shared card contract.

## 2026-02-17 Upgrade Guardrail Skills Set (SNS/Runner + Design Layout)
- [x] Define project-level guardrail skill taxonomy for future upgrades
- [x] Create skill folders and `SKILL.md` for security/auth/runner/schema/api/doc-verification guardrails
- [x] Add SNS design layout guardrail skill covering page layout + component layout
- [x] Run structural validation checks for newly added skill files
- [x] Commit all guardrail skill changes
- Review: Added nine project guardrail skills under `.agents/skills/` covering triage, security boundaries, runner liveness, auth/permissions, schema migrations, API contracts, verification matrix, docs sync, and SNS design layout consistency (page + component level). Verified skill file structure/frontmatter with repository-local checks before commit.

## 2026-02-17 Comment Layout Unification + Community Pill
- [x] Introduce shared SNS comment card component
- [x] Reuse existing thread community pill design for comment community label
- [x] Replace duplicated comment rendering in thread detail and home recent feed
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Added a shared `CommentFeedCard` and applied it to thread detail comments and home recent comment items so comment layout is consistent. Comment community is now rendered with the same `thread-community-inline` pill style used in thread cards.

## 2026-02-17 Home Recent Activity Community Label Clarity
- [x] Make community affiliation explicit in every recent-activity item
- [x] Add clear community label/link styling for readability
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Recent activity cards now show `Community: ...` explicitly for every item, and community names are linked to the corresponding community page for immediate context.

## 2026-02-17 Home Recent Threads/Comments Live Section
- [x] Add home section for the latest 5 thread/comment items
- [x] Implement backend source + API endpoint for merged recent activity feed
- [x] Implement client polling without manual refresh
- [x] Add enter/exit animation for top insertion and bottom removal
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Home now includes a live `Recent Threads / Comments` section backed by a merged thread/comment feed (top 5). The client polls automatically and applies enter animation for newly inserted top items and exit animation for dropped bottom items without manual refresh.

## 2026-02-17 Request Status Permission Split + Runner Prompt
- [x] Split Request status mutation permissions by actor/status
- [x] Update Request status API to support both owner-session and agent-write auth
- [x] Restrict owner UI controls to owner-allowed statuses only
- [x] Add runner action path to update request status (`pending`/`resolved`)
- [x] Update runner agent prompt to require request-status follow-up behavior
- [x] Verify SNS TypeScript checks and runner syntax checks
- [x] Commit changes
- Review: Request status mutation now supports dual auth paths with status-specific permissions (owner: pending/rejected, request-author agent: pending/resolved). Owner UI now exposes only pending/rejected. Runner supports `set_request_status` action and prompt guidance explicitly instructs agents to keep their own request status at `resolved` (resolved) or `pending` (unresolved).

## 2026-02-17 Runner Multi-Instance E2E Checklist Documentation
- [x] Add fixed 2-port/2-agent cross-control checklist to `README.md`
- [x] Mirror checklist expectation in `AGENTS.md` operational validation section
- [x] Commit documentation update
- Review: Added a deterministic validation sequence (ports `4391/4392`, agents `A/B`) covering mismatch preflight blocking, selected-agent stop enforcement, and per-port log separation checks.

## 2026-02-17 Runner Control Accuracy Stabilization + Multi-Instance Log Split
- [x] Enforce `status.config.agentId` and selected agent consistency in `/manage/agents` runner status handling
- [x] Add Start preflight status check to block start when selected port already runs another agent
- [x] Add Stop preflight status check to stop only when running agent matches selected agent
- [x] Remove forced port auto-switch; preserve user-selected launcher port and default only when empty
- [x] Adjust runner credential issuance timing to run after launcher preflight validation and immediately before start request
- [x] Split runner txt logs by port, add `instanceId/port/pid/agentId` metadata, and apply daily rotation + retention
- [x] Update `README.md` and `AGENTS.md` with new runner control/logging behavior
- [x] Verify via SNS type-check + runner syntax checks and record review
- Review: `/manage/agents` now preflights launcher status for both start/stop and enforces selected-agent ownership (`status.config.agentId`) before treating runner as controllable. Runner logs now default to port-scoped files (`runner-full.<port>.log.txt`, `runner-communication.<port>.log.txt`), include instance metadata in each entry, and rotate daily with retention (`RUNNER_LOG_RETENTION_DAYS`, default 14). Verification passed with `npx tsc --noEmit -p apps/sns/tsconfig.json` and `node --check` for runner files (`index.js`, `engine.js`, `utils.js`, `communicationLog.js`).

## 2026-02-17 Requests Status Filter UI Parity
- [x] Replace Requests status filter chips with the same dropdown multi-select UI used by community thread `Type` filter
- [x] Keep existing filter behavior (multi-select + community-name search combined)
- [x] Verify SNS TypeScript checks
- [x] Commit changes
- Review: Requests status filtering now uses the same dropdown trigger/menu/item UI as the community thread `Type` multi-select control, while preserving combined filtering with community-name search.

## 2026-02-17 README and AGENTS Ground-Truth Refresh
- [x] Audit current README/AGENTS claims against code (auth, runner, schema, ops)
- [x] Update `README.md` to match current architecture, setup, and manual flow
- [x] Update `AGENTS.md` handover sections to match current schema/auth/runtime truth
- [x] Verify doc consistency and run targeted checks where relevant
- [x] Commit changes
- Review: Rewrote both docs to reflect current challenge-based session auth, `(ownerWallet, communityId)` agent pairing, runner-credential runtime auth, updated Prisma models (`securitySensitive`, `RunnerCredential`, `AuthChallenge`), and current local run/setup commands including required runner launcher secret.

## 2026-02-17 Requests Status Tag Filter
- [x] Extend `CommunityNameSearchFeed` to support optional status-tag filters
- [x] Add `Resolved/Pending/Rejected` filter controls to Requests page feed
- [x] Apply combined filtering (community name + selected status tags)
- [x] Add minimal CSS styles for status filter chips
- [x] Verify TypeScript checks and commit
- Review: Requests feed now supports tag-based status filtering with `Pending`, `Resolved`, and `Rejected` chips, combined with existing community-name search. Filtering is client-side and scoped to Requests only via optional props.

## 2026-02-17 SNS Ordered List Rendering Fix
- [x] Reproduce and pinpoint why numbered lists in thread/comment markdown are rendered incorrectly
- [x] Update `FormattedContent` ordered-list parsing to preserve authored start numbers when list blocks split
- [x] Harden rich-text list CSS so ordered/unordered markers render explicitly and consistently
- [x] Verify with type/syntax checks and targeted content rendering sanity check
- [x] Commit changes
- Review: `FormattedContent` now preserves ordered-list start values (`<ol start=...>`) when lists are split by nested bullets/paragraphs, and rich-text list CSS now explicitly renders `ol` decimal and `ul` disc markers to keep numbered lists visible and stable.

## 2026-02-17 Manage Agents Runner Loop Regression Fix
- [x] Reproduce infinite `Load from DB`/`Detect Launcher` loop after runner toggle feature
- [x] Break callback dependency cycle between selected-agent bootstrap effect and launcher detection
- [x] Prevent redundant state writes for detected ports/launcher port to reduce rerender churn
- [x] Verify TypeScript checks and commit
- Review: Removed status-fetch call from `detectRunnerLauncherPorts`, stabilized callback dependencies, and added equality guards for detected-port and launcher-port state updates so initial bootstrap no longer self-triggers indefinitely.

## 2026-02-17 Manage Agents Runner Start/Stop Toggle
- [x] Add local runner status detection in `manage/agents` via launcher `/runner/status`
- [x] Add runner running state and stop action in UI logic
- [x] Switch Start button to Start/Stop toggle based on detected running state
- [x] Keep detection synced when launcher ports/secret/selection change
- [x] Verify TypeScript checks and commit
- Review: `manage/agents` now queries local launcher `/runner/status` (with launcher secret) and keeps `runnerRunning` in sync; the primary action button now toggles between `Start Runner` and `Stop Runner` and calls `/runner/start` or `/runner/stop` accordingly.

## 2026-02-17 Runner Log Terminology (Manager -> Runner)
- [x] Find remaining `Manager` terminology in runner logging paths
- [x] Replace communication log direction labels with `Runner` wording
- [x] Keep backward compatibility for historical direction values (`manager_to_agent` / `agent_to_manager`)
- [x] Commit changes
- Review: Runner communication logs now print `Runner -> Agent` and `Agent -> Runner`, and direction normalization accepts legacy values while emitting runner-based canonical labels.

## 2026-02-17 Runner Logging Redaction and Security Doc Cleanup
- [x] Add centralized log redaction in `apps/runner/src/utils.js` using `hasXxx` flags for sensitive fields
- [x] Ensure redaction covers known leak paths (`llm`, `sns`, `launcher`, `engine`) via shared `logJson` pipeline
- [x] Re-verify `security_constraints.md` mandatory logging constraints against updated implementation
- [x] Delete `docs/security/sensitive_data_exposure.md` after constraints are satisfied
- [x] Commit changes
- Review: Runner full-trace logging now redacts sensitive values (`apiKey`, `token`, `secret`, `password`, `privateKey`, signatures, encoded input, auth headers) into `hasXxx` flags, and URL query keys such as `?key=` are sanitized before persistence.

## 2026-02-17 Manage Agents Decrypt Bubble False Error
- [x] Reproduce and trace the `Decrypt` -> unexpected `LLM API key is required...` bubble path
- [x] Remove stale-state dependency by allowing model loader to use decrypted API key override
- [x] Verify no false missing-key bubble appears immediately after successful decrypt
- [x] Commit the fix
- Review: `decryptSecurity` now passes the freshly decrypted `llmApiKey` directly into `fetchModelsByApiKey`, preventing the stale React state read that produced a false missing-key popup on initial decrypt flow.

## 2026-02-17 Security Constraints Skill Doc
- [x] Create `docs/security/security_constraints.md` as a reusable security skill
- [x] Encode 24/7 runner assumptions, mandatory constraints, allowed/forbidden flows
- [x] Add pre-merge checklist and verification commands for future changes
- [x] Commit documentation update
- Review: Added a single skill-style security constraints document that captures project assumptions and non-negotiable controls for SNS/Runner/auth/network changes.

## 2026-02-17 24-7 Runner Credentialization
- [x] Add agent-scoped runner credential model (hashed token) and migration
- [x] Add runner credential issue/revoke API routes for owner-authorized control
- [x] Switch runner SNS auth from owner session token to runner credential token
- [x] Update SNS nonce/write/general/context routes to accept runner credential auth
- [x] Update manage-agents Start Runner flow to mint credential and pass `runnerToken`
- [x] Refresh security doc with enforced egress policy and updated checklist
- [x] Verify (`prisma generate`, SNS `tsc`, runner syntax checks) and capture review
- Review: Runner now operates 24/7 with agent-scoped runner credentials independent of owner session token; credential plaintext is one-time issued and only hash is stored in SNS DB.

## 2026-02-17 Sensitive Data Exposure Plan Execution
- [x] Remove `snsApiKey` from SNS API responses and dependent UI paths
- [x] Replace fixed-message auth for owner/agent verify routes with challenge-nonce flow
- [x] Add runner launcher request authentication and tighten launcher CORS/origin checks
- [x] Ensure runner-start payload does not include unnecessary sensitive fields (password etc.)
- [x] Remove SNS server-side LLM model-list proxy usage from manage-agents flow
- [x] Enforce strict `AGENT_MANAGER_ORIGIN` configuration (no wildcard fallback)
- [x] Verify (`tsc` + runner syntax/runtime checks) and add review notes
- Review: Implemented P0 controls end-to-end (key exposure removal, challenge-nonce auth for verify routes, launcher auth/CORS hardening, payload minimization) and applied P1 hardening for model-list path + strict CORS origin env. Session storage migration to HttpOnly cookie remains a follow-up item documented in `docs/security/sensitive_data_exposure.md`.

## 2026-02-17 Runner Optional Max Token
- [x] Audit current max token behavior across SNS start payload and runner LLM clients
- [x] Add optional `max token` input in SNS manage/agents Runner section
- [x] Send max token to runner only when user explicitly enters it
- [x] Remove implicit max-token constraints in runner LLM provider calls when max token is not set
- [x] Verify SNS/runner checks and add review note
- Review: Added optional `Max Tokens` field in SNS Runner UI, propagated it through runner start payload/config normalization, and removed Anthropic hardcoded `max_tokens: 700`. If user leaves the field empty, no max-token limit field is sent to LLM providers.

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

## 2026-02-16 Sign-in Terminology Unification
- [x] Rename MetaMask login UI copy to MetaMask sign-in
- [x] Switch global guard target path from `/login` to `/sign-in`
- [x] Keep `/login` backward compatible via redirect to `/sign-in`
- [x] Verify SNS TypeScript checks after terminology/path update

## 2026-02-16 Remove Legacy Login Route
- [x] Remove deprecated `/login` route entirely
- [x] Update sign-in guard logic to only treat `/sign-in` as auth page
- [x] Verify SNS TypeScript checks after login-route removal

## 2026-02-16 Thread/Comment ID Mention Hyperlinks
- [x] Add mention resolver API that maps thread/comment IDs to SNS routes
- [x] Auto-link mentioned thread/comment IDs in formatted thread/comment body text
- [x] Add comment anchor targets for comment mention deep-linking
- [x] Verify SNS TypeScript checks after mention hyperlink integration

## 2026-02-16 Strict Sign-in Redirect + Minimal Sign-in Page
- [x] Expand global MetaMask guard to cover all top floating menu links/buttons
- [x] Hide floating header/footer entirely on `/sign-in`
- [x] Reduce sign-in page to single centered card with one sentence and one button
- [x] Verify SNS TypeScript checks after strict sign-in UX update

## 2026-02-16 Sign-in Home Button
- [x] Add `Home` button to sign-in card alongside `Connect Metamask`
- [x] Verify SNS TypeScript checks after sign-in home-button addition

## 2026-02-16 Signature-based Sign-in + Switch Wallet
- [x] Change sign-in button flow to include `personal_sign` and owner session creation
- [x] Change top `Switch Wallet` flow to also create owner session via signature
- [x] Extract shared client utility for owner session creation/storage
- [x] Verify SNS TypeScript checks after signature-flow integration

## 2026-02-16 Report Thread GitHub Issue Submission
- [x] Add owner-authenticated API that builds GitHub issue draft URL from report thread
- [x] Add report-thread owner control to open GitHub issue draft for registered community repository
- [x] Keep owner sign-in flow aligned with existing request/report owner controls
- [x] Verify SNS TypeScript checks after GitHub issue submission feature

## 2026-02-16 Move Agent Registration Entry to SNS Community Cards
- [x] Remove registration/community-update form functionality from `/manage/agents`
- [x] Add community-card buttons on `/sns` for handle register/unregister actions
- [x] Add backend API route for handle unregister by community with signature verification
- [x] Verify SNS TypeScript checks after migration step

## 2026-02-16 Community Card Owner Meta Label
- [x] Add right-aligned owner meta slot in shared card header
- [x] Show `created by` + abbreviated owner wallet on SNS community cards
- [x] Verify SNS TypeScript checks after community-card owner label update

## 2026-02-16 Agent Workspace Migration Step (manage/agents)
- [x] Add owner-session APIs for listing owned `(community, handle)` pairs
- [x] Add selected-agent scoped APIs for General, Security Sensitive, and Runner control
- [x] Rebuild `/manage/agents` UI with pair selector + General/Security Sensitive/Runner sections
- [x] Add SNS-side encryption utility for security-sensitive data decrypt/encrypt flow
- [x] Verify SNS TypeScript checks after workspace migration step

## 2026-02-16 Multi-Community Agent Registration Per Wallet
- [x] Remove single-wallet-single-agent DB constraint and enforce one agent per `(ownerWallet, communityId)` pair
- [x] Update registration/unregistration APIs to operate on `(wallet, community)` scope
- [x] Update lookup/community-card UI to support multiple registered pairs per wallet
- [x] Keep SNS API key issuance scoped to one active key per `(wallet, community)` pair via agent scope
- [x] Run Prisma client generation and SNS TypeScript checks

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

Move Agent Registration Entry to SNS Community Cards Review (2026-02-16):
- Replaced `/manage/agents` registration/update form with a guide card that redirects users to Agent SNS community cards.
- Added per-community register/unregister buttons to the SNS community list feed and wired signature-based register/unregister actions.
- Added new API endpoint `POST /api/agents/unregister` with wallet-signature verification and API key revocation on unregister.
- Updated management landing copy to reflect that handle registration is now driven from Agent SNS.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Community Card Owner Meta Label Review (2026-02-16):
- Extended the shared `Card` component with an optional right-aligned title meta slot.
- Added `created by <abbreviated wallet>` on SNS community cards, aligned to the right end of the title line.
- Passed `ownerWallet` from the SNS page data mapping into the community list feed.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Agent Workspace Migration Step Review (2026-02-16):
- Added `GET /api/agents/mine` to list owner-scoped registered `(community, handle)` pairs.
- Added selected-agent scoped APIs:
  - `GET/PATCH /api/agents/[id]/general`
  - `GET/POST /api/agents/[id]/secrets`
  - `POST /api/agents/[id]/runner/start`
  - `POST /api/agents/[id]/runner/stop`
- Rebuilt `/manage/agents` into an integrated workspace:
  - pair selector
  - `General` load/edit/save
  - `Security Sensitive` load/decrypt/edit/encrypt-save
  - `Runner` start/stop
- Added SNS-side crypto util `src/lib/agentSecretsCrypto.ts` reusing HKDF + AES-GCM flow.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

Multi-Community Agent Registration Per Wallet Review (2026-02-16):
- Updated Prisma `Agent` constraints to allow multi-community registrations per wallet:
  - removed `ownerWallet` unique constraint
  - added composite uniqueness on `(ownerWallet, communityId)`
- Added migration SQL `20260216193000_multi_agent_per_wallet_community`.
- Refactored `POST /api/agents/register` to register/update by `(ownerWallet, communityId)` pair while preserving one active API key per pair through the per-agent key model.
- Refactored `POST /api/agents/unregister` to target the specific `(ownerWallet, communityId)` pair.
- Updated `GET /api/agents/lookup` to return multi-pair list (`agents`) while keeping backward-compatible `agent`/`community` selected fields.
- Updated SNS community card controls to manage per-community registration independently (no single-community lock).
- Verification:
  - `npm -w apps/sns run prisma:generate` passed
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

Report Thread GitHub Issue Submission Review (2026-02-16):
- Added owner-authenticated API endpoint `POST /api/threads/[id]/github-issue` for report threads.
- Endpoint now validates owner wallet match, ensures a community repository is registered, and returns a prefilled GitHub `issues/new` draft URL.
- Added `OwnerReportIssueForm` to report thread detail pages so owners can submit a report thread to GitHub with one click.
- Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

## 2026-02-17 Agent Registration Info Restructure
- [x] Align Prisma registration schema to requested General and Security Sensitive fields
- [x] Remove legacy registration fields from Prisma (`account`, `encryptedSecrets`, `isActive`, runner/timestamp fields, hashed API key fields)
- [x] Rebuild `/manage/agents` UI around pair selection + General edit + encrypted Security Sensitive edit
- [x] Update registration/auth APIs to immutable community/owner/API-key semantics and pair-scoped reads
- [x] Fix admin agent selection/deletion flow for non-unique handles by switching to id-based targeting
- [x] Verify with Prisma client generation and TypeScript checks

Agent Registration Info Restructure Review (2026-02-17):
- Updated Prisma `Agent`/`ApiKey` schema to keep only the new registration fields plus required relations, and removed obsolete registration fields.
- Updated migration SQL to convert encrypted secret payload into `securitySensitive` and move API key storage from hash/prefix columns to immutable `value`.
- Finalized `/manage/agents` workspace to expose only requested `General` + `Security Sensitive` groups, with immutable community/owner/API-key display and editable handle/provider/model.
- Updated APIs (`register`, `lookup`, `mine`, `general`, `secrets`, auth lookup) to use `(ownerWallet, communityId)` registration pairs and immutable SNS API key behavior.
- Updated admin agent list/delete flow to use `agentId` selection so duplicate handle names across communities are safe.
- Verification:
  - `npm -w apps/sns run prisma:generate` passed
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Manage Agents Runner Card Inputs
- [x] Add a Runner card back to `/manage/agents`
- [x] Add editable inputs for `Runner Interval` and `Comment Context Limit (Community-wide)`
- [x] Load/save Runner input values per selected agent pair in local storage
- [x] Verify SNS TypeScript checks after UI update

Manage Agents Runner Card Inputs Review (2026-02-17):
- Added a dedicated `Runner` card to `apps/sns/src/app/manage/agents/page.tsx`.
- Added numeric inputs:
  - `Runner Interval (sec)`
  - `Comment Context Limit (Community-wide)`
- Added per-agent local persistence keyed by `sns.runner.config.<agentId>` so values are restored when switching back to a selected pair.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Local Runner Launcher CLI (`apps/runner`)
- [x] Create new workspace app `apps/runner` with CLI entrypoint
- [x] Implement local launcher HTTP API for runner control (`start`, `stop`, `status`, `run-once`)
- [x] Implement API-driven runner cycle (context fetch, LLM decision, signed SNS write calls)
- [x] Add usage docs and root/npm scripts for running launcher
- [x] Verify runner CLI boots and endpoint status works

Local Runner Launcher CLI Review (2026-02-17):
- Added new workspace app `apps/runner` with Node CLI launcher (`src/index.js`), runner engine (`src/engine.js`), SNS API signer client (`src/sns.js`), and LLM callers (`src/llm.js`).
- Implemented local control API:
  - `GET /health`
  - `GET /runner/status`
  - `POST /runner/start`
  - `POST /runner/stop`
  - `POST /runner/config`
  - `POST /runner/run-once`
- Implemented runner cycle with:
  - SNS context fetch (`/api/agents/context`)
  - provider-based LLM call (OPENAI/LITELLM, GEMINI, ANTHROPIC)
  - JSON action parsing
  - signed SNS writes via nonce + HMAC (`/api/agents/nonce`, `/api/threads`, `/api/threads/:id/comments`)
  - optional `tx` action execution with execution wallet + Alchemy key
- Added docs and sample config:
  - `apps/runner/README.md`
  - `apps/runner/runner.config.example.json`
- Added root scripts:
  - `runner:serve`
  - `runner:run-once`
- Verification:
  - `node --check apps/runner/src/index.js`
  - `node --check apps/runner/src/engine.js`
  - `node --check apps/runner/src/sns.js`
  - `node --check apps/runner/src/llm.js`
  - `node --check apps/runner/src/utils.js`
  - `node apps/runner/src/index.js --help`
  - one-shot server boot + endpoint checks: `GET /health`, `GET /runner/status`

## 2026-02-17 Manage Agents UX + Runner Launcher Controls
- [x] Add SNS API key Show/Hide + Test controls in General
- [x] Change LLM model selection to provider model-list loading flow using in-memory LLM API key
- [x] Add key-specific Test buttons (SNS/LLM/Execution/Alchemy) with floating bubble results
- [x] Prevent wheel-based numeric step changes in Runner inputs and keep Runner values local-only
- [x] Add runner launcher port input, auto-detect list, and `Start Runner` action from `/manage/agents`
- [x] Verify SNS TypeScript checks after UI/runner-control updates

Manage Agents UX + Runner Launcher Controls Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - General:
    - SNS API key now supports Show/Hide and Test.
    - LLM model selection now follows model-list flow: with in-memory LLM API key (typed or decrypted), user loads models and selects one from a list.
  - Security Sensitive:
    - Added Test buttons for LLM API key, Execution Wallet private key, and Alchemy API key.
  - Runner:
    - Runner Interval and Comment Context Limit inputs now use keyboard-only numeric text entry (wheel step behavior removed).
    - Values remain local-only (saved in browser localStorage per agent pair), not DB.
    - Added Runner launcher localhost port input, detected-port select list, launcher port detection, and Start Runner button.
    - Start Runner now posts configuration to local launcher `POST http://127.0.0.1:<port>/runner/start`.
- Updated `apps/sns/src/app/globals.css`:
  - Added reusable floating speech-bubble style for test/start results without layout reflow.
  - Improved inline field wrapping for multi-button key controls.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Manage Agents Model Field Alignment
- [x] Place `Load Model List` button on the same row as `LLM Model` dropdown
- [x] Keep button on the right side of the dropdown with stable responsive sizing
- [x] Verify SNS TypeScript checks after layout update

Manage Agents Model Field Alignment Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx` so `LLM Model` select and `Load Model List` button are rendered in one `manager-inline-field` row.
- Updated `apps/sns/src/app/globals.css` to give `.manager-inline-field select` the same flexible sizing behavior as input fields.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Manage Agents Bubble Anchor Positioning
- [x] Anchor floating status/error bubbles to the clicked button position
- [x] Ensure all bubble-producing button handlers pass their `event.currentTarget`
- [x] Update bubble placement styles for above/below arrow direction
- [x] Verify SNS TypeScript checks after bubble positioning fixes

Manage Agents Bubble Anchor Positioning Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Added anchor-aware bubble coordinates (`left`, `top`) and placement mode (`above`/`below`).
  - Updated button-triggered bubble actions to pass `event.currentTarget` so each message appears near the relevant button.
  - Kept fallback placement for non-button-triggered paths.
- Updated `apps/sns/src/app/globals.css`:
  - Reworked `.floating-status-bubble` to render at computed coordinates instead of fixed top-right placement.
  - Added placement variants for arrow orientation (`.floating-status-bubble-below`).
  - Preserved success/error visual variants with matching arrow borders.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Manage Agents Secret Input Runtime Error Fix
- [x] Fix security input handlers that crash on key typing (`LLM API Key`, `Execution Wallet Private Key`, `Alchemy API Key`)
- [x] Apply the same safe event-value capture pattern to runner numeric text inputs
- [x] Verify SNS TypeScript checks after handler safety fix

Manage Agents Secret Input Runtime Error Fix Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Replaced unsafe `event.currentTarget.value` access inside functional `setState` updaters with pre-captured local `value`.
  - Applied fix to:
    - `securityDraft.llmApiKey`
    - `securityDraft.executionWalletPrivateKey`
    - `securityDraft.alchemyApiKey`
    - `runnerDraft.intervalSec`
    - `runnerDraft.commentContextLimit`
- Root cause:
  - React synthetic event target was referenced inside deferred updater callback, causing null access in runtime.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Runner Card Button Cleanup + Persistence Double-Check
- [x] Remove `Load` and `Save` buttons from `/manage/agents` Runner card
- [x] Verify runner execution settings are not written to Prisma/DB routes
- [x] Verify SNS TypeScript checks after Runner card UI cleanup

Runner Card Button Cleanup + Persistence Double-Check Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Removed `Load` and `Save` buttons from the Runner action row.
- Persistence verification:
  - Runner settings (`intervalSec`, `commentContextLimit`, `runnerLauncherPort`) are handled in browser local storage via `runnerStorageKey`, `loadRunnerConfig`, and `saveRunnerConfig` in `apps/sns/src/app/manage/agents/page.tsx`.
  - No runner fields exist in Prisma `Agent` schema (`apps/sns/db/prisma/schema.prisma`).
  - Agent update APIs only persist general fields (`handle`, `llmProvider`, `llmModel`) and encrypted secrets (`securitySensitive`) in:
    - `apps/sns/src/app/api/agents/[id]/general/route.ts`
    - `apps/sns/src/app/api/agents/[id]/secrets/route.ts`
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Remove Security State Inline Status Copy
- [x] Remove `Signature / Encrypted state` inline status message from Security Sensitive card
- [x] Keep operation feedback through existing action result status messaging only
- [x] Verify SNS TypeScript checks after UI copy removal

Remove Security State Inline Status Copy Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Removed inline status text: `Signature: ... | Encrypted state: ...`.
  - Kept actionable feedback through `securityStatus` message rendering only.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Encrypt Validation Error Bubble UX
- [x] Show missing-password error for `Encrypt & Save to DB` as anchored bubble instead of inline status text
- [x] Keep button-specific bubble placement using click target anchor
- [x] Verify SNS TypeScript checks after encrypt validation UX update

Encrypt Validation Error Bubble UX Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Changed `encryptAndSaveSecurity` to accept optional anchor element from button click.
  - For missing password, clear inline `securityStatus` and show `Password is required to encrypt.` via `pushBubble("error", ...)`.
  - Updated `Encrypt & Save to DB` button click handler to pass `event.currentTarget`.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Security Actions Bubble-Only Feedback
- [x] Remove inline status rendering for Security Sensitive actions from card layout
- [x] Route `Load Encrypted from DB` and `Decrypt` feedback through anchored bubbles
- [x] Keep `Generate Signature`/`Encrypt & Save` errors and success through bubble feedback for consistency
- [x] Verify SNS TypeScript checks after security feedback UX update

Security Actions Bubble-Only Feedback Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Removed inline `securityStatus` state usage and rendering.
  - Updated security action handlers to use `pushBubble` with click-target anchors:
    - `requestSecuritySignature`
    - `loadEncryptedSecurity`
    - `decryptSecurity`
    - `encryptAndSaveSecurity`
  - Updated button `onClick` handlers for `Generate Signature`, `Load Encrypted from DB`, and `Decrypt` to pass `event.currentTarget`.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Encrypt Save Success Quiet UX
- [x] Remove success feedback output for `Encrypt & Save to DB`
- [x] Keep error-only bubble output on encrypt/save failures
- [x] Verify SNS TypeScript checks after encrypt success quieting

Encrypt Save Success Quiet UX Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Removed success bubble (`Security Sensitive data saved.`) in `encryptAndSaveSecurity`.
  - Preserved error bubble output paths for validation/API/network failures.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 SNS-Wide Button Status Bubble Bridge
- [x] Add global status-to-bubble bridge for SNS UI
- [x] Attach bridge in app chrome so all SNS pages share bubble feedback behavior
- [x] Hide inline `.status` text blocks so status feedback is popup-only
- [x] Verify SNS TypeScript checks after global bubble integration

SNS-Wide Button Status Bubble Bridge Review (2026-02-17):
- Added `apps/sns/src/components/StatusBubbleBridge.tsx`:
  - Tracks recent clicked button/link as action anchor.
  - Observes `.status` text mutations globally and displays floating bubble feedback with inferred kind (`success`/`info`/`error`).
  - Anchors bubble near the last action control within a click-context window.
- Updated `apps/sns/src/components/AppChrome.tsx`:
  - Mounted `StatusBubbleBridge` for both sign-in view and main app shell.
- Updated `apps/sns/src/app/globals.css`:
  - Set `.status` to hidden (`display: none !important`) to prevent inline status text in card layouts.
- Updated button flows that previously had no status output:
  - `apps/sns/src/components/OwnerRequestStatusForm.tsx`
  - `apps/sns/src/components/OwnerReportIssueForm.tsx`
  - `apps/sns/src/app/sign-in/page.tsx`
  - Added status updates so both success and error now emit popup feedback through the bridge.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Re-enable Encrypt Success Popup (Requirement Update)
- [x] Restore success popup for `Encrypt & Save to DB` to align with "success + error popup for all buttons"
- [x] Verify SNS TypeScript checks after behavior alignment

Re-enable Encrypt Success Popup (Requirement Update) Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Restored success bubble message (`Security Sensitive data saved.`) in `encryptAndSaveSecurity`.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Runner Port Detected-Only Selection
- [x] Remove manual `Runner Launcher Port` text input from `/manage/agents` Runner card
- [x] Require runner launcher port selection from detected ports dropdown only
- [x] Block `Start Runner` when no detected launcher port exists
- [x] Verify SNS TypeScript checks after runner-port UX enforcement

Runner Port Detected-Only Selection Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Replaced manual runner port input with a single dropdown under `Runner Launcher Port (localhost)`.
  - Dropdown now shows detected ports only and is disabled when no port is detected.
  - Added empty-state option text: `No detected ports. Click Detect Launcher.`
  - Updated `startRunnerLauncher` guard to require detected launcher ports and selected detected value before starting.
  - Reset `runnerLauncherPort` to empty when launcher detection finds no running ports.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Auto Signature on Decrypt/Encrypt
- [x] Remove `Generate Signature` button from Security Sensitive actions
- [x] Auto-request MetaMask signature when `Decrypt` or `Encrypt & Save to DB` is clicked and no cached signature exists
- [x] Keep error/success popup feedback for signature request outcomes
- [x] Verify SNS TypeScript checks after signature-flow update

Auto Signature on Decrypt/Encrypt Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Removed `Generate Signature` button from Security Sensitive action row.
  - Added `acquireSecuritySignature` helper:
    - Reuses cached `securitySignature` when available.
    - Requests MetaMask signature automatically when needed.
  - Updated `decryptSecurity` and `encryptAndSaveSecurity` to call `acquireSecuritySignature` instead of requiring manual pre-generation.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Runner Start Prerequisite Validation
- [x] Add LLM token-usage hint text next to `Comment Context Limit (Community-wide)` label
- [x] Validate all General + Security Sensitive + Runner form fields before `Start Runner`
- [x] Keep validation result in anchored error popup when any required field is missing
- [x] Verify SNS TypeScript checks after runner prerequisite enforcement

Runner Start Prerequisite Validation Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Added helper note: `(Affects LLM token usage.)` to the `Comment Context Limit (Community-wide)` label.
  - Extended `startRunnerLauncher` validation to require all form values across sections:
    - General: Registered Community, Handle Owner MetaMask Address, SNS API Key, LLM Handle Name, LLM Provider, LLM Model
    - Security Sensitive: Password, LLM API Key, Execution Wallet Private Key, Alchemy API Key
    - Runner: Runner Interval, Comment Context Limit, Runner Launcher Port
  - Emits one anchored error popup listing missing fields and blocks runner start until complete.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Agent SNS Popup Noise Cleanup
- [x] Remove `Registered handles` text from status-popup trigger path
- [x] Keep action-result statuses as popup-enabled status events
- [x] Verify SNS TypeScript checks after popup-noise fix

Agent SNS Popup Noise Cleanup Review (2026-02-17):
- Updated `apps/sns/src/components/CommunityListSearchFeed.tsx`:
  - Changed static summary text `Registered handles: ...` class from `status` to `helper`.
  - This prevents global status-bubble bridge from treating it as action feedback and showing a popup when entering `Agent SNS`.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Runner Launcher Payload Encoding + General Data Source Split
- [x] Encode `Security Sensitive` + `Runner` form values in `Start Runner` launcher API call payload
- [x] Include `agentId` in runner start payload so launcher can fetch general data from SNS DB
- [x] Update `apps/runner` to fetch general registration data via `/api/agents/:id/general`
- [x] Make runner use fetched general fields (`llmProvider`, `llmModel`, `snsApiKey`) and API-message fields for all other data
- [x] Verify SNS TypeScript checks and runner JS syntax checks

Runner Launcher Payload Encoding + General Data Source Split Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Added Base64 JSON encoder for launcher input message.
  - `Start Runner` now sends:
    - `sessionToken`
    - `agentId`
    - `encodedInput` (includes all Security Sensitive fields + Runner fields).
- Updated `apps/runner/src/sns.js`:
  - Added `fetchAgentGeneral` client for `/api/agents/:id/general`.
- Updated `apps/runner/src/engine.js`:
  - `normalizeConfig` now requires `agentId` and accepts `encodedInput`.
  - Decodes launcher input payload and reads runtime/security values from API message.
  - Fetches general data from SNS DB each cycle and uses:
    - `agent.llmProvider`
    - `agent.llmModel`
    - `snsApiKey`
  - Uses fetched `snsApiKey` for signed thread/comment writes.
- Updated docs/examples:
  - `apps/runner/README.md`
  - `apps/runner/runner.config.example.json`
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed
  - `node --check apps/runner/src/engine.js` passed
  - `node --check apps/runner/src/sns.js` passed
  - `node --check apps/runner/src/index.js` passed

## 2026-02-17 Remove Helper Copy + Bubble-Only Status Guidance
- [x] Remove all `.helper` helper-copy usage from `apps/sns` UI
- [x] Remove `.helper` style definition from global stylesheet
- [x] Ensure status feedback emits as floating bubble even without recent click anchor
- [x] Verify SNS TypeScript checks after status-feedback behavior update

Remove Helper Copy + Bubble-Only Status Guidance Review (2026-02-17):
- Updated `apps/sns/src/components/ui/Field.tsx`:
  - Removed `helper` prop and helper-text rendering path.
- Updated `apps/sns/src/components/ContractRegistrationForm.tsx`:
  - Removed GitHub repository helper note under registration form field.
- Updated `apps/sns/src/components/CommunityListSearchFeed.tsx`:
  - Removed static helper line `Registered handles: ...`.
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Removed helper subtext `(Affects LLM token usage.)` from runner label.
- Updated `apps/sns/src/app/globals.css`:
  - Removed `.helper` class style block.
- Updated `apps/sns/src/components/StatusBubbleBridge.tsx`:
  - Changed status processing so `.status` updates always trigger a floating bubble.
  - Uses clicked control as anchor when recent; otherwise falls back to default floating position.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Sensitive Data Exposure Review Documentation
- [x] Review sensitive data network exposure paths in `apps/sns`
- [x] Review sensitive data network exposure paths in `apps/runner`
- [x] Document findings and mitigations in `docs/security/sensitive_data_exposure.md`

Sensitive Data Exposure Review Documentation Review (2026-02-17):
- Added `docs/security/sensitive_data_exposure.md` with:
  - sensitive data inventory and verified network paths
  - severity-based findings (Critical/High/Medium)
  - positive controls already present
  - prioritized remediation plan (P0/P1/P2)
  - post-fix validation checklist

## 2026-02-17 Suppress Initial "General loaded" Bubble on Manage Agents Entry
- [x] Identify source of initial popup on `/manage/agents` first render
- [x] Keep manual `Load from DB` status flow, but silence automatic initial general-load status updates
- [x] Verify SNS TypeScript checks after popup behavior fix

Suppress Initial "General loaded" Bubble on Manage Agents Entry Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Added `silent` option to `loadGeneral(agentId, options?)`.
  - Automatic initial load now calls `loadGeneral(selectedAgentId, { silent: true })`.
  - In silent mode, `loadGeneral` skips `setGeneralStatus(...)` updates (`Loading/Loaded/Failed`), preventing startup bubble popup noise.
  - Manual `Load from DB` button continues to use status messaging as before.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 English Copy Cleanup (Manage Agents + Related Status Messages)
- [x] Update requested popup texts:
  - `General loaded.` -> `General data is loaded`
  - `General saved.` -> `General data is saved`
- [x] Fix awkward or broken English in nearby user-facing status/feedback strings
- [x] Verify SNS TypeScript checks after copy updates

English Copy Cleanup (Manage Agents + Related Status Messages) Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Applied exact requested replacements for General load/save messages.
  - Improved surrounding status copy for clarity/grammar (general/security-sensitive/runner statuses).
- Updated additional obvious awkward copy:
  - `apps/sns/src/components/CommunityListSearchFeed.tsx`
  - `apps/sns/src/components/AgentRegistrationForm.tsx`
  - `apps/sns/src/components/OwnerRequestStatusForm.tsx`
  - `apps/sns/src/components/OwnerReportIssueForm.tsx`
  - `apps/sns/src/app/manage/page.tsx`
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Remove Stray Non-Button Popups Across SNS
- [x] Identify why popup bubbles appear at arbitrary positions without button interactions
- [x] Restrict global status-bubble bridge to button-triggered interactions only
- [x] Verify SNS TypeScript checks after popup trigger constraints

Remove Stray Non-Button Popups Across SNS Review (2026-02-17):
- Updated `apps/sns/src/components/StatusBubbleBridge.tsx`:
  - `.status` changes now produce a popup only when there is a recent button-trigger context.
  - If no recent button anchor exists, popup is skipped.
  - Click tracking now scopes to `button`/`[role='button']` only (removed `<a>` trigger source).
- Result:
  - Page-entry/background status updates no longer create floating popups in arbitrary positions.
  - Button-driven status feedback remains anchored to the clicked control.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Security Sensitive Section Layout Restructure
- [x] Move encrypted security data display to top of Security Sensitive card
- [x] Add read-only encrypted-data input with right-aligned `Load from DB` action
- [x] Place a full-width `Decrypt` button directly below encrypted-data row
- [x] Keep remaining existing Security Sensitive fields/actions below decrypt control
- [x] Verify SNS TypeScript checks after layout change

Security Sensitive Section Layout Restructure Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Added `encryptedSecurityLine` derived from loaded encrypted payload.
  - Reordered Security Sensitive card:
    - top: `ENCRYPTED SECURITY SENSITIVE DATA` read-only input + `Load from DB` button
    - next: full-width `Decrypt` button
    - below: existing fields (`Password`, keys, test/show controls, `Encrypt & Save to DB`)
  - Reused existing `loadEncryptedSecurity` and `decryptSecurity` behavior without logic regression.
- Updated `apps/sns/src/app/globals.css`:
  - Added `.button-block` utility for full-width button layout.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Inline Password Interaction for Decrypt/Save in Security Sensitive
- [x] Replace direct Decrypt action with two-step inline password flow
- [x] Replace direct `Encrypt & Save to DB` action with two-step inline password flow and small `Save to DB` button
- [x] Auto-collapse inline password step back to original wide button when user interacts outside the active password row
- [x] Keep the rest of Security Sensitive fields and controls unchanged
- [x] Verify SNS TypeScript checks after interaction change

Inline Password Interaction for Decrypt/Save in Security Sensitive Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Added `securityPasswordMode` (`none` | `decrypt` | `encrypt`) to control staged password UI.
  - Decrypt button behavior:
    - initial wide `Decrypt` button
    - after click: inline `Password` input + compact `Decrypt` button in same row
  - Encrypt button behavior:
    - initial wide `Encrypt & Save to DB` button
    - after click: inline `Password` input + compact `Save to DB` button in same row
  - Added capture listeners (`pointerdown`, `focusin`) to collapse staged password mode when user interacts outside active row.
  - Converted `decryptSecurity` / `encryptAndSaveSecurity` to return success boolean for staged UI completion handling.
- Updated `apps/sns/src/app/globals.css`:
  - Added `.button-compact` for compact right-side action buttons in inline password rows.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Match Inline Password Input Styling to Standard Fields
- [x] Identify why staged password input looked different from other inputs
- [x] Apply standard input/select/focus styles to `manager-inline-field` inputs used by staged password rows
- [x] Verify SNS TypeScript checks after style update

Match Inline Password Input Styling to Standard Fields Review (2026-02-17):
- Updated `apps/sns/src/app/globals.css`:
  - Extended shared form-field selectors so `.manager-inline-field input/select` use the same base, read-only, focus, and focus-visible styling as `.field` controls.
- Result:
  - Inline password forms in Security Sensitive now visually match other input fields.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Manage Agents Pair Label Copy Update
- [x] Locate My Registered Pairs list rendering in SNS manage agents page
- [x] Update displayed lines to explicit labeled format requested by user
- [x] Verify SNS TypeScript checks after copy update

Manage Agents Pair Label Copy Update Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Changed pair list text format to:
    - `Agent handle: ...`
    - `Affiliated community: ...`
    - `LLM provider and model: ...`
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Revert Manage Agents Pair Label Copy
- [x] Revert My Registered Pairs list copy back to compact previous format
- [x] Keep only this rollback change with no additional UI behavior edits
- [x] Verify SNS TypeScript checks after rollback

Revert Manage Agents Pair Label Copy Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Restored list lines to previous format:
    - handle only
    - `community name (slug)`
    - `provider · model`
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 LiteLLM Provider Row Split with Base URL Field
- [x] Add local state for LiteLLM base URL in manage-agents general form
- [x] Require and pass base URL when loading model list for `LITELLM`
- [x] Render provider row as split layout (short provider select + base URL input) only when provider is `LITELLM`
- [x] Keep split layout active until provider changes away from `LITELLM`
- [x] Verify SNS TypeScript checks

LiteLLM Provider Row Split with Base URL Field Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Added `liteLlmBaseUrl` state.
  - Added LiteLLM-only base URL validation in model loading flow and passed `baseUrl` to `/api/agents/models`.
  - Updated General section rendering:
    - `LITELLM`: split row with provider dropdown (left) + base URL input (right).
    - non-`LITELLM`: existing single provider dropdown layout.
  - Cleared local LiteLLM base URL when provider changes to non-`LITELLM` and when selected pair resets.
- Updated `apps/sns/src/app/globals.css`:
  - Added `.manager-provider-row` responsive split grid styles.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Root runner:serve Supports `-p <port>`
- [x] Inspect current root runner serve script and apps/runner serve invocation path
- [x] Add root wrapper script that accepts `-p` / `--port` / positional numeric port and forwards it to apps/runner launcher
- [x] Update root script mapping to use wrapper
- [x] Update runner README usage note
- [x] Verify wrapper syntax and invocation wiring

Root runner:serve Supports `-p <port>` Review (2026-02-17):
- Updated `package.json`:
  - Changed `runner:serve` script from workspace direct call to `node scripts/runner-serve.js`.
- Added `scripts/runner-serve.js`:
  - Resolves port from `-p`, `--port`, `--port=<n>`, `-p=<n>`, or positional numeric arg.
  - Forwards to `npm -w apps/runner run serve -- --host 127.0.0.1 --port <port>`.
- Updated `apps/runner/README.md`:
  - Added root-level usage example: `npm run runner:serve -p 4318`.
- Verification:
  - `node --check scripts/runner-serve.js` passed.
  - Invocation wiring check: `npm run runner:serve -p 4399` showed forwarded command `node src/index.js serve --host 127.0.0.1 --port 4399` (sandbox prevented binding with `EPERM`, but argument propagation confirmed).

## 2026-02-17 Start Runner Validation: Remove Password Requirement
- [x] Locate Start Runner field validation in SNS manage agents page
- [x] Remove `Password` from required-field checks for launching runner
- [x] Stop sending password in runner launcher encoded payload
- [x] Verify SNS TypeScript checks

Start Runner Validation: Remove Password Requirement Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - Removed `Password` from `missingFields` validation in `startRunnerLauncher`.
  - Removed `securitySensitive.password` from encoded launcher input payload.
  - Removed now-unused `securityPassword` dependency from `startRunnerLauncher` callback deps.
- Result:
  - `Start Runner` no longer fails with `... before starting: Password` when all runner-required fields are filled.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed

## 2026-02-17 Persist LiteLLM Base URL in General Save/Load
- [x] Add persistent `llmBaseUrl` field to Agent Prisma schema and migration
- [x] Update `/api/agents/[id]/general` GET/PATCH to include `llmBaseUrl`
- [x] Validate LiteLLM save path requires non-empty base URL and normalize trailing slash
- [x] Update `apps/sns/manage/agents` General load/save flow to read/write `llmBaseUrl`
- [x] Keep runner compatible by falling back to persisted `llmBaseUrl` when runtime config base URL is not provided
- [x] Run Prisma generate + SNS TypeScript check

Persist LiteLLM Base URL in General Save/Load Review (2026-02-17):
- Updated `apps/sns/db/prisma/schema.prisma`:
  - Added `Agent.llmBaseUrl String?`.
- Added migration:
  - `apps/sns/db/prisma/migrations/20260217041000_add_agent_llm_base_url/migration.sql`
  - SQL: `ALTER TABLE "Agent" ADD COLUMN "llmBaseUrl" TEXT;`
- Updated `apps/sns/src/app/api/agents/[id]/general/route.ts`:
  - GET now returns `agent.llmBaseUrl`.
  - PATCH now accepts `llmBaseUrl`, requires it for `LITELLM`, trims trailing slashes, stores `null` for non-LiteLLM providers.
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - `GeneralPayload.agent` includes `llmBaseUrl`.
  - `Load from DB` applies persisted base URL to `liteLlmBaseUrl` state.
  - `Save to DB` sends `llmBaseUrl` when provider is `LITELLM`.
- Updated `apps/runner/src/engine.js`:
  - LLM call now uses `config.llm.baseUrl || generalAgent.llmBaseUrl` for base URL resolution.
- Verification:
  - `npm -w apps/sns run prisma:generate` passed.
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

## 2026-02-17 Start Runner LLM API Key Compatibility Fix
- [x] Trace `Start Runner` request path from SNS UI to local runner launcher config parser
- [x] Add explicit `config.llm.apiKey` forwarding in start payload while keeping encoded security input
- [x] Include LiteLLM base URL in forwarded `config.llm.baseUrl` for compatibility
- [x] Verify SNS TypeScript checks

Start Runner LLM API Key Compatibility Fix Review (2026-02-17):
- Updated `apps/sns/src/app/manage/agents/page.tsx`:
  - `Start Runner` now sends:
    - `config.encodedInput` (existing path)
    - `config.llm.apiKey` (explicit compatibility path)
    - `config.llm.baseUrl` (LiteLLM selected case)
  - Added `liteLlmBaseUrl` to the callback dependency list where referenced.
- Result:
  - Runner launch works even when local launcher expects `llm.apiKey` in explicit `llm` config instead of reading only encoded security payload.
- Verification:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json` passed.

## 2026-02-17 Runner LLM Calls: Remove Temperature Parameter
- [x] Locate provider request payloads in `apps/runner/src/llm.js`
- [x] Remove `temperature` from OpenAI-compatible and Gemini request bodies
- [x] Verify no remaining `temperature` usage in runner source
- [x] Run JS syntax check for modified file

Runner LLM Calls: Remove Temperature Parameter Review (2026-02-17):
- Updated `apps/runner/src/llm.js`:
  - Removed `temperature` from OpenAI-compatible `/chat/completions` payload.
  - Removed `temperature` from Gemini `generationConfig`.
- Verification:
  - `rg -n "temperature" apps/runner/src -g"*.js"` returned no matches.
  - `node --check apps/runner/src/llm.js` passed.

## 2026-02-17 Full Runner Trace Logging (Send/Receive/Internal)
- [x] Add shared structured JSON logging helper in runner utils
- [x] Log runner launcher inbound requests/bodies/outbound responses/errors
- [x] Log SNS client request/response payloads and signed header generation details
- [x] Log LLM client request/response payloads and call inputs/errors
- [x] Log engine internal processing data (config normalization, context shaping, prompts, parsed actions, execution results, tx internals)
- [x] Verify modified runner files pass JS syntax checks

Full Runner Trace Logging (Send/Receive/Internal) Review (2026-02-17):
- Updated `apps/runner/src/utils.js`:
  - Added `formatLogData` and `logJson` helpers for consistent structured terminal logging.
- Updated `apps/runner/src/index.js`:
  - Added logs for launcher API request metadata, parsed request bodies, responses, and error payloads.
- Updated `apps/runner/src/sns.js`:
  - Added logs for every outgoing SNS request (URL/method/headers/body), corresponding response status/body, and signed-header generation data.
- Updated `apps/runner/src/llm.js`:
  - Added logs for every provider request/response and `callLlm` input/error context.
- Updated `apps/runner/src/engine.js`:
  - Added logs for start/update/run inputs, normalized config, fetched general/context data, prompt assembly, LLM output, parsed actions, per-action execution details, tx call/tx results, and cycle success/error states.
- Verification:
  - `node --check apps/runner/src/utils.js` passed.
  - `node --check apps/runner/src/sns.js` passed.
  - `node --check apps/runner/src/llm.js` passed.
  - `node --check apps/runner/src/engine.js` passed.
  - `node --check apps/runner/src/index.js` passed.

## 2026-02-17 Runner Logging Mode Change: Full Trace to TXT, Terminal Summary Only
- [x] Redirect full structured runner traces from console to `.txt` file sink
- [x] Keep concise terminal summaries for lifecycle and action outcomes
- [x] Keep existing boundary/internal trace instrumentation but route through file logger
- [x] Verify runner file path resolution and JS syntax

Runner Logging Mode Change: Full Trace to TXT, Terminal Summary Only Review (2026-02-17):
- Updated `apps/runner/src/utils.js`:
  - `logJson` now writes full structured traces to text file instead of terminal.
  - Added default file path: `apps/runner/logs/runner-full.log.txt` (override via `RUNNER_FULL_LOG_PATH`).
  - Added `logSummary` helper for short terminal output.
- Updated `apps/runner/src/index.js`:
  - Added terminal summary lines for launcher start/stop/config/run-once actions.
  - Prints full trace log path on launcher startup.
- Updated `apps/runner/src/engine.js`:
  - Added concise summary logs for runner start/stop, cycle start/success/failure, and action completion.
  - Kept detailed traces via `trace(...)`, now persisted to file.
- Verification:
  - `node --check apps/runner/src/utils.js` passed.
  - `node --check apps/runner/src/index.js` passed.
  - `node --check apps/runner/src/engine.js` passed.
  - `node --check apps/runner/src/sns.js` passed.
  - `node --check apps/runner/src/llm.js` passed.
  - `node -e "const {fullLogPath}=require('./apps/runner/src/utils'); console.log(fullLogPath());"` returned `apps/runner/logs/runner-full.log.txt` absolute path.

## 2026-02-17 Runner Terminal Logging Aligned to Agent Manager Communication Log
- [x] Analyze `apps/agent_manager` LLM Communication Log structure (timestamp, direction, action types, content)
- [x] Add runner communication-log module with same formatted entry rendering
- [x] Print communication-log entries to terminal in the same style
- [x] Persist communication-log entries to dedicated txt file
- [x] Wire communication-log entries for both agent->manager LLM output and manager->agent tx feedback
- [x] Verify JS syntax and communication-log path resolution

Runner Terminal Logging Aligned to Agent Manager Communication Log Review (2026-02-17):
- Added `apps/runner/src/communicationLog.js`:
  - New communication log writer with normalized record shape:
    - `createdAt`
    - `direction` (`Agent -> Manager` / `Manager -> Agent`)
    - `actionTypes`
    - `content`
  - Terminal output format mirrors agent-manager communication log semantics.
  - Dedicated log file path:
    - default: `apps/runner/logs/runner-communication.log.txt`
    - override: `RUNNER_COMMUNICATION_LOG_PATH`
- Updated `apps/runner/src/engine.js`:
  - Writes communication log entry for every LLM output (`agent_to_manager`).
  - Writes communication log entry for tx feedback payload (`manager_to_agent`, action `tx`).
  - Action types for agent->manager entries are extracted from parsed LLM action objects.
- Updated `apps/runner/src/index.js`:
  - Prints communication log file path on launcher start.
- Verification:
  - `node --check apps/runner/src/communicationLog.js` passed.
  - `node --check apps/runner/src/engine.js` passed.
  - `node --check apps/runner/src/index.js` passed.
  - `node --check apps/runner/src/utils.js` passed.
  - `node -e "const {communicationLogPath}=require('./apps/runner/src/communicationLog'); console.log(communicationLogPath());"` returned absolute `apps/runner/logs/runner-communication.log.txt` path.

## 2026-02-17 Runner Prompt Source Alignment with Agent Manager
- [x] Inspect how `apps/agent_manager` loads prompt files and identify prompt sources
- [x] Add separate markdown prompt files under `apps/runner/prompts`
- [x] Copy agent-manager prompt content into runner prompt markdown files
- [x] Update runner engine defaults to load prompts from markdown files
- [x] Keep fallback defaults when prompt files are missing
- [x] Verify runner engine syntax and prompt files existence

Runner Prompt Source Alignment with Agent Manager Review (2026-02-17):
- Added prompt files:
  - `apps/runner/prompts/agent.md`
  - `apps/runner/prompts/user.md`
  - Content copied from:
    - `apps/agent_manager/public/prompts/agent.md`
    - `apps/agent_manager/public/prompts/user.md`
- Updated `apps/runner/src/engine.js`:
  - Added file-based prompt loader (`readPromptFile`) from `apps/runner/prompts`.
  - `defaultSystemPrompt()` now reads `agent.md`.
  - `defaultUserPromptTemplate()` now reads `user.md`.
  - Keeps existing inline fallback prompt text when files are unavailable.
- Updated `apps/runner/README.md`:
  - Added prompt file management section.
- Verification:
  - `node --check apps/runner/src/engine.js` passed.
  - `ls -la apps/runner/prompts` confirmed files exist.
  - `wc -l apps/runner/prompts/agent.md apps/runner/prompts/user.md` confirmed prompt content present.

## 2026-02-17 Runner vs Agent Manager Bot Parity Pass
- [x] Compare bot-cycle logic between `apps/agent_manager` and `apps/runner`
- [x] Align runner LLM provider behaviors with manager-style flow where safe
- [x] Add manager-style malformed JSON parse fallback path in runner
- [x] Align tx handling flow to manager-style guarded execution + feedback logging
- [x] Document parity status and residual architecture differences
- [x] Verify runner syntax after parity updates

Runner vs Agent Manager Bot Parity Pass Review (2026-02-17):
- Updated `apps/runner/src/llm.js`:
  - Added LiteLLM base URL normalization (`/v1`) + required check.
  - Adjusted Anthropic request (`max_tokens` alignment).
  - Added Gemini 404 fallback for suffixed model names.
- Updated `apps/runner/src/engine.js`:
  - Added malformed JSON sanitize fallback parser path for LLM outputs.
  - Aligned tx flow:
    - validates contract address against community
    - validates function name against `abiFunctions`
    - catches tx execution failures into feedback payload instead of failing whole cycle
  - Removed automatic SNS tx-result comment injection path to match manager feedback pattern.
- Added `docs/runner_agent_manager_parity.md`:
  - Includes aligned areas and remaining architecture-level differences.
- Verification:
  - `node --check apps/runner/src/llm.js` passed.
  - `node --check apps/runner/src/engine.js` passed.
  - `node --check apps/runner/src/index.js` passed.
  - `node --check apps/runner/src/sns.js` passed.
  - `node --check apps/runner/src/communicationLog.js` passed.
  - `node --check apps/runner/src/utils.js` passed.

## 2026-02-17 Runner-Agent / Runner-SNS Communication Protocol Skill
- [x] Audit current runner-agent and runner-SNS protocol behavior from code
- [x] Create/define a dedicated protocol skill spec under `.agents/skills/`
- [x] Reinforce related existing skills with explicit protocol-skill linkage
- [x] Validate skill document structure/consistency
- [x] Add review notes to this plan section
- [x] Commit changes

Runner-Agent / Runner-SNS Communication Protocol Skill Review (2026-02-17):
- Added new skill: `.agents/skills/runner-communication-protocol-guardrails/SKILL.md`
  - Encodes protocol contract for `Runner <-> Agent` (prompt/JSON action schema/parser fallback/log semantics).
  - Encodes protocol contract for `Runner <-> SNS` (headers, nonce flow, signature payload, write routes, server-side checks).
- Reinforced related skills:
  - `.agents/skills/upgrade-scope-triage/SKILL.md`: added companion-skill routing rule for protocol-level changes.
  - `.agents/skills/api-contract-guardrails/SKILL.md`: added requirement to pair protocol guardrails for runner protocol changes.
  - `.agents/skills/runner-liveness-guardrails/SKILL.md`: added runner-agent protocol semantics preservation rule.
- Validation:
  - `rg -n "^name:|^description:" .agents/skills/*/SKILL.md` passed.
  - `rg -n "runner-communication-protocol-guardrails" .agents/skills -S` passed.
  - `git diff -- ...` reviewed for intended scope only.

## 2026-02-19 SNS Type Hardening for Vercel Build Stability
- [x] Collect all current TypeScript errors in `apps/sns` (`next build`/compiler output)
- [x] Eliminate `implicit any` across SNS routes/libs/components with explicit types
- [x] Re-run `npm -w apps/sns run build` until clean
- [x] Commit and push all fixes
- [x] Add review summary and residual risk notes

SNS Type Hardening for Vercel Build Stability Review (2026-02-19):
- Changes:
  - Added explicit row typing for admin community list response mapping:
    - `apps/sns/src/app/api/admin/communities/list/route.ts`
  - Added explicit `Prisma.TransactionClient` annotations for transaction callbacks:
    - `apps/sns/src/app/api/admin/communities/delete/route.ts`
    - `apps/sns/src/app/api/communities/close/route.ts`
    - `apps/sns/src/app/api/contracts/register/route.ts`
    - `apps/sns/src/lib/community.ts`
  - Hardened build pipeline to always generate Prisma client with the project schema before type-check/build:
    - `apps/sns/package.json` (`build` now runs `npm run prisma:generate && next build`)
- Verification:
  - `npm -w apps/sns run build` passed after changes (includes Prisma generate + Next type checking).
- Residual risk:
  - Vercel can still fail due transient external font fetches (`fonts.gstatic.com`) or infra-level network conditions, which is separate from TypeScript typing correctness.
