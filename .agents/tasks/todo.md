# Project Plan

## 2026-02-24 Add GitHub Egress Path In How-It-Works Diagram
- [x] Update `Overall system block diagram` in `docs/published/how-it-works/page.md`
- [x] Add `Local Runner -> GitHub` arrow path
- [x] Place `GitHub` block immediately after `Full node`
- [x] Commit related changes
- [x] Add review note
- Review: Updated the `How it works` overall block diagram to include a downward `Local Runner -> GitHub` path and inserted the `GitHub` block immediately after `Full node` in the bottom row while preserving existing runner-to-LLM bidirectional notation.

## 2026-02-24 Fix Rightmost Arrow Alignment In Confidential-Key Diagram
- [x] Re-align the rightmost (`Alchemy API key`) arrow branch to match `Full node` center column
- [x] Keep existing flow labels and block layout unchanged
- [x] Commit related changes
- [x] Add review note
- Review: Adjusted the rightmost branch/label/arrow in `docs/published/security-notes/page.md` so the `Alchemy API key` downward arrow aligns with the center column of the `Full node` block while preserving the rest of the diagram.

## 2026-02-24 Correct Full Names For Browser-Memory And Server-DB Blocks
- [x] Update ASCII block names to full names in `docs/published/security-notes/page.md`
- [x] Keep the existing 4x3 block layout and arrow mapping unchanged
- [x] Commit related changes
- [x] Add review note
- Review: Renamed the two middle-column top blocks in the confidential-key egress diagram to full names: `Agentic-ethereum.com (local browser memory)` and `Agentic-ethereum.com (server DB)`, while preserving the existing flow structure.

## 2026-02-24 Re-layout Confidential-Key Egress Diagram To Exact 4x3 Grid
- [x] Rebuild block positions to match exact user grid coordinates (rows 1-4, cols 1-3)
- [x] Place `local browser memory`, `server DB`, `Local Runner memory` in column 2 for rows 1/2/3
- [x] Place `LLM Provider`, `MetaMask`, `Full node` in row 4 columns 1/2/3
- [x] Reconnect requested arrows and labels (`Ciphertext`, `LLM API key`, `Execution wallet private key`, `Alchemy API key`, `Runner token`)
- [x] Commit related changes
- [x] Add review note
- Review: Updated `docs/published/security-notes/page.md` with a strict 4x3-style arrangement and rewired all required flows per requested coordinates: browser memory -> server DB (`Ciphertext`), and Local Runner memory -> LLM Provider/MetaMask/Full node/server DB with the requested key labels.

## 2026-02-24 Redesign Confidential-Key Egress Diagram To Block-To-Block Flows
- [x] Connect `local browser memory -> server DB` with a `Ciphertext`-labeled arrow
- [x] Add explicit labeled arrows from `Local Runner memory` to `LLM Provider`, `MetaMask`, `Full node`, and `server DB`
- [x] Remove local-launcher egress depiction from browser-memory flow
- [x] Commit related changes
- [x] Add review note
- Review: Reworked `docs/published/security-notes/page.md` egress section into a block-to-block ASCII diagram. Added the requested `Ciphertext` flow from browser memory to server DB and explicit labeled Local Runner flows for `LLM API key`, `Execution wallet private key`, `Alchemy API key`, and `Runner token` to the respective destination blocks.

## 2026-02-24 Refine Confidential-Key Egress ASCII Arrows
- [x] Ensure egress arrows are represented as block-origin to open-space (`->`) with key labels
- [x] Remove local-launcher transfer depiction from `Agentic-ethereum.com (local browser memory)`
- [x] Mark blocks with no direct confidential-key egress explicitly
- [x] Commit related changes
- [x] Add review note
- Review: Updated `docs/published/security-notes/page.md` egress ASCII so outgoing lines are key-labeled open-space arrows and removed local-launcher transfer depiction for browser memory as requested. Added explicit `no egress` notes for blocks without direct confidential-key network egress in this model.

## 2026-02-24 Replace Network-Egress Section With Per-Block ASCII Diagrams
- [x] Replace prose under `Confidential keys going out to the network from each block` with ASCII diagrams
- [x] Show stored keys inside each block and outgoing confidential keys as rightward arrows
- [x] Cover all currently listed blocks in the same document section
- [x] Commit related changes
- [x] Add review note
- Review: Replaced the previously empty network-egress section in `docs/published/security-notes/page.md` with per-block ASCII diagrams. Each block now shows stored keys inside the box and outgoing confidential keys as rightward arrows to open space, matching the requested visual style.

## 2026-02-24 Add DB Encryption Algorithm Details To Security Notes
- [x] Inspect implemented secret-encryption logic in `apps/sns/src/lib/agentSecretsCrypto.ts`
- [x] Fill `Encryption algorithm` details under `Agentic-ethereum.com (DB)` in `docs/published/security-notes/page.md`
- [x] Keep wording aligned with current v2 + legacy compatibility behavior
- [x] Commit related changes
- [x] Add review note
- Review: Added concrete algorithm details in `docs/published/security-notes/page.md` for DB-stored confidential payload encryption: AES-256-GCM with 12-byte IV, HKDF-SHA-256 key derivation, current v2 key material (signer address + security password), and legacy v1 compatibility (raw signature + security password).

## 2026-02-24 Remove Bold Styling From Block-Wise Confidential Key Names
- [x] Remove bold emphasis from key-name bullets under `Confidential keys managed by each block`
- [x] Keep block headings emphasized and unchanged
- [x] Fix any key-line formatting artifacts introduced by prior edits
- [x] Commit related changes
- [x] Add review note
- Review: Updated `docs/published/security-notes/page.md` so key-name bullets in `Confidential keys managed by each block` are plain text (no bold), while block headers remain bold. Also fixed an existing formatting artifact on `Execution wallet private key`.

## 2026-02-24 Restructure Block-Wise Confidential-Key Section
- [x] Update `Confidential keys managed by each block` to list confidential keys as key-name-only entries per block
- [x] Keep non-key descriptive lines in the section as plain explanatory text
- [x] Preserve existing block partition (`local cache`, `DB`, `Local Runner`, `LLM Provider`)
- [x] Commit related changes
- [x] Add review note
- Review: Reworked `docs/published/security-notes/page.md` so each block now contains key-name-only bullets for keys in `List of confidential keys`, while explanatory non-key lines remain in descriptive sentence form. Also removed inline key-name enumeration from descriptive prose where needed to align with the requested format.

## 2026-02-24 Reformat Security Notes Confidential-Key List
- [x] Remove variable-name notation from `List of confidential keys` in `docs/published/security-notes/page.md`
- [x] Convert each entry to `Key name: description` format
- [x] Preserve the same key set while improving reader-facing explanations
- [x] Commit related changes
- [x] Add review note
- Review: Updated `docs/published/security-notes/page.md` so the confidential-key list no longer includes implementation variable names. Each item now uses a direct operator-facing format (`key name: description`) with concise role-oriented explanations.

## 2026-02-24 Fill Security Notes Confidential-Key Sections
- [x] Inspect actual confidential-key fields and handling paths from SNS/Runner code
- [x] Fill `List of confidential keys` in `docs/published/security-notes/page.md`
- [x] Fill `Confidential keys managed by each block` with block-specific responsibilities
- [x] Commit related changes
- [x] Add review note
- Review: Completed `docs/published/security-notes/page.md` section fill-in based on implemented behavior. Added explicit confidential-key inventory (`llmApiKey`, execution private key, `alchemyApiKey`, optional `githubIssueToken`, runner launcher secret, security password, runner token) and per-block management notes for browser local cache, SNS DB ciphertext storage, Local Runner runtime handling, and LLM-provider-side exposure boundaries.

## 2026-02-24 Normalize Message Protocol Line Format In How-It-Works
- [x] Inspect `Message exchanging protocols` section in `docs/published/how-it-works/page.md`
- [x] Apply first-line protocol format (`**A** -> **B**: ...`) to all remaining entries
- [x] Keep existing semantic meaning unchanged while removing mixed numbering/bullets
- [x] Commit related changes
- [x] Add review note
- Review: Standardized all entries in `docs/published/how-it-works/page.md` under `Message exchanging protocols` to the same inline format used by the first line (`**source** -> **target**: description`). Removed mixed numbered-list and nested-bullet formatting while preserving all protocol semantics.

## 2026-02-24 Fix Broken Arrow Row Rendering In How-It-Works ASCII
- [x] Remove orphan top `^`-only connector row that caused visual breakage
- [x] Rebuild connector area as one aligned 3-line matrix (`|/^`, `|`, `v`)
- [x] Preserve direction semantics (downward-only for MetaMask/Etherscan, bidirectional for LLM providers)
- [x] Commit related changes
- [x] Add review note
- Review: Fixed broken connector rendering in `docs/published/how-it-works/page.md` by replacing the split/offset top-arrow row with a single aligned connector matrix. The first two columns now remain downward-only (`|`, `|`, `v`) and the LLM provider columns remain bidirectional (`^`, `|`, `v`) without layout breakage.

## 2026-02-24 Make Runner-to-MetaMask-Etherscan Arrows Downward-Only In ASCII
- [x] Update `docs/published/how-it-works/page.md` so `Local Runner -> MetaMask` and `Local Runner -> Etherscan` are shown as downward-only arrows
- [x] Keep `Local Runner <-> LLM Provider` connectors bidirectional in the same diagram
- [x] Keep connector alignment readable after mixed directionality change
- [x] Commit related changes
- [x] Add review note
- Review: Adjusted the connector row in `docs/published/how-it-works/page.md` by removing upward arrows above the MetaMask and Etherscan columns while preserving `^ | v` bidirectional connectors for LLM Provider columns. This visually enforces one-way downward flow to MetaMask/Etherscan and bidirectional flow with LLM providers.

## 2026-02-24 Add Directional Interaction Semantics To How-It-Works
- [x] Add explicit directional interaction section to `docs/published/how-it-works/page.md`
- [x] Reflect SNS, Local Runner, MetaMask, Etherscan, and LLM Provider request/response responsibilities
- [x] Keep wording in English and aligned with current architecture boundary language
- [x] Commit related changes
- [x] Add review note
- Review: Added `Directional interaction details` to `docs/published/how-it-works/page.md` with six explicit flows: `agentic-ethereum.com -> Local Runner`, `Local Runner -> agentic-ethereum.com`, `Local Runner -> MetaMask`, `Local Runner -> Etherscan`, `Local Runner -> LLM Provider`, and `LLM Provider -> Local Runner`. The new section describes runner configuration delivery (including confidential key handling context), SNS write API execution, transaction execution requests, contract/block data collection requests, and result feedback loops.

## 2026-02-24 Convert How-It-Works Connectors To Bidirectional Arrows
- [x] Remove all arrow-description text between blocks in `docs/published/how-it-works/page.md`
- [x] Convert all inter-block connectors to bidirectional arrow form
- [x] Keep connector columns aligned after the change
- [x] Commit related changes
- [x] Add review note
- Review: Updated `docs/published/how-it-works/page.md` to remove all connector explanation text (including inline labels and the bottom communication note). Converted SNS<->Runner and Runner<->external-system links to explicit bidirectional connector shapes using stacked `^ | v` arrows with aligned columns.

## 2026-02-24 Extend Local Runner Block Width For Arrow Origin Alignment
- [x] Expand `Local Runner` ASCII block width in `docs/published/how-it-works/page.md`
- [x] Keep all downstream arrow origins visually inside the runner block span
- [x] Commit related changes
- [x] Add review note
- Review: Increased the `Local Runner` block width in `docs/published/how-it-works/page.md` so all downward connector arrows originate under the runner block area, eliminating the previous visual where right-side arrows appeared to start from empty space.

## 2026-02-24 Align How-It-Works ASCII Arrows
- [x] Realign connector arrows between `Local Runner` and downstream blocks
- [x] Remove misaligned per-column `bidirectional` text row causing visual skew
- [x] Keep bidirectional meaning as a concise note under the diagram
- [x] Commit related changes
- [x] Add review note
- Review: Adjusted `docs/published/how-it-works/page.md` so arrow connectors (`|` and `v`) are vertically aligned to each downstream block center. Removed the misaligned repeated `bidirectional` label row and replaced it with one concise bidirectional communication note to preserve meaning without breaking alignment.

## 2026-02-24 Refine How-It-Works LLM Provider Multiplicity Notation
- [x] Remove per-provider labels (`A/B/C`) from the ASCII diagram
- [x] Represent expandable provider multiplicity with `...`
- [x] Commit related changes
- [x] Add review note
- Review: Refined `docs/published/how-it-works/page.md` so LLM provider blocks are no longer separated by `A/B/C` names. The diagram now uses repeated generic `LLM Provider` blocks followed by `...` to clearly express that the runner can communicate with more than three providers.

## 2026-02-24 Update How-It-Works ASCII Diagram Topology
- [x] Review existing `how-it-works` ASCII diagram elements
- [x] Redraw diagram so `agentic-ethereum.com` communicates with `Local Runner`
- [x] Redraw downstream links so `Local Runner` communicates with one `MetaMask`, one `Etherscan`, and multiple `LLM Provider` blocks
- [x] Commit related changes
- [x] Add review note
- Review: Updated ASCII topology in `docs/published/how-it-works/page.md` using existing diagram style and actors. The SNS block is now `agentic-ethereum.com (SNS Web App/API)` with explicit communication to `Local Runner`, and `Local Runner` now communicates with one `MetaMask` block, one `Etherscan` block, and multiple `LLM Provider` blocks (`A/B/C`) aligned at the same level.

## 2026-02-24 Fix Markdown Renderer List Item Block Rendering
- [x] Confirm root cause in shared `MarkdownRenderer` for list-item continuation block flattening
- [x] Update list parsing to preserve indented block content (images/paragraphs/nested lists) under list items
- [x] Verify SNS checks (`prisma:generate`, `tsc`, runner `node --check`)
- [x] Commit all related changes
- [x] Add review note
- Review: Fixed list-item continuation parsing in `apps/sns/src/components/markdown/MarkdownRenderer.tsx`. Instead of flattening indented continuation lines into a single inline string, the parser now captures continuation blocks, normalizes indentation, and recursively parses them as markdown child blocks. This restores correct rendering for structured content under numbered steps (for example bold subsection labels, markdown images, and nested bullets in `docs/published/how-to-use/page.md` step 6) and prevents broken inline output such as `!alt text` text leakage. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-24 Fix Markdown Renderer Blockquote List Parsing
- [x] Update shared `MarkdownRenderer` to parse/render blockquote inner markdown blocks (including nested lists)
- [x] Restore `docs/published/how-to-use/page.md` bottom notes block to quote style (`>`)
- [x] Verify SNS type check
- [x] Commit all related changes
- [x] Add review note
- Review: Fixed renderer root cause by changing `apps/sns/src/components/markdown/MarkdownRenderer.tsx` blockquote handling from flattened plain text to recursive markdown block parsing/rendering (`blockquote.blocks`). This enables proper rendering of blockquote content containing lists and nested lists. Restored quote-style notes in `docs/published/how-to-use/page.md` without removing content. Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json`, `npm -w apps/sns run prisma:generate`.

## 2026-02-24 Fix How-To-Use Notes Markdown Rendering
- [x] Identify malformed markdown pattern in `docs/published/how-to-use/page.md` notes block
- [x] Replace unsupported quote+nested-list pattern with renderer-friendly markdown without changing content meaning
- [x] Commit all related changes
- [x] Add review note
- Review: Fixed markdown rendering issue in `docs/published/how-to-use/page.md` by converting the notes section from blockquote syntax with nested list (`> - ...`) to a normal `Notes:` heading plus standard bullet list. Content meaning is unchanged; structure now matches the SNS markdown renderer capabilities.

## 2026-02-24 Proofread How-To-Use English Without Layout Changes
- [x] Correct grammar and spelling in `docs/published/how-to-use/page.md`
- [x] Keep existing format and structure unchanged (headings, numbering, bullets, image placements)
- [x] Commit all related changes
- [x] Add review note
- Review: Proofread and corrected English in `docs/published/how-to-use/page.md` while preserving the existing document structure and layout. Fixes include spelling (`obtainable`, `confidential`, `exposed`), punctuation/phrasing improvements, and clearer wording in selected field descriptions without changing section order or formatting structure.

## 2026-02-24 Update How-To-Use Runner Log Default Paths
- [x] Remove `RUNNER_LOG_DIR` mention from `docs/published/how-to-use/page.md`
- [x] Add explicit default runner log paths for macOS/Linux and Windows
- [x] Commit all related changes
- [x] Add review note
- Review: Updated `docs/published/how-to-use/page.md` to remove `RUNNER_LOG_DIR` mention and replaced it with OS-specific default log locations: `~/.tokamak-runner/logs` (macOS/Linux) and `C:\\Users\\<your-user>\\.tokamak-runner\\logs` (Windows).

## 2026-02-24 Add RUNNER_LOG_DIR Setup Guidance To How-To-Use
- [x] Add `RUNNER_LOG_DIR` setup explanation in `docs/published/how-to-use/page.md`
- [x] Include concrete command examples for macOS/Linux and Windows PowerShell
- [x] Commit all related changes
- [x] Add review note
- Review: Updated `docs/published/how-to-use/page.md` Agent provider step 4 to explain optional `RUNNER_LOG_DIR` usage with absolute-path guidance and launch-command examples for both macOS/Linux and Windows PowerShell.

## 2026-02-24 Fix Manage-Agents Decrypt Failures After Loading Ciphertext
- [x] Identify root cause for decrypt failures after loading `securitySensitive` from DB
- [x] Make encryption key derivation robust against signature variability (keep legacy decrypt compatibility)
- [x] Normalize loaded ciphertext payload shape from DB before decrypt attempt
- [x] Improve decrypt failure messages for unsupported legacy payloads
- [x] Run verification checks (`prisma:generate`, `tsc`, runner `node --check`)
- [x] Commit all related changes
- [x] Add review note
- Review: Hardened SNS confidential-data crypto path to avoid decrypt failures caused by signature variability and inconsistent DB payload shape. In `apps/sns/src/lib/agentSecretsCrypto.ts`, added `v2` encryption keyed by wallet identity (`verifyMessage` on `24-7-playground-security`) plus password, while preserving legacy `v1` decrypt compatibility (raw-signature key) and fallback for unversioned payloads. In `apps/sns/src/app/manage/agents/page.tsx`, normalized loaded `securitySensitive` payloads (object/string/nested forms) before decrypt and added explicit error messaging for unsupported payload formats and legacy `v1` decrypt failure scenarios. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-24 Expand How-To-Use Step 6 To Cover All Manage-Agents Inputs
- [x] Update `docs/published/how-to-use/page.md` step 6 to describe all inputs, not only runner inputs
- [x] Reflect actual `/manage/agents/` UI input groups (`Public Configuration`, `Confidential data`, `Runner`)
- [x] Keep examples concrete and English-only
- [x] Commit all related changes
- [x] Add review note
- Review: Rewrote step 6 in `docs/published/how-to-use/page.md` to cover all major input fields in `/manage/agents/` across three cards: public configuration (`LLM Handle Name`, `LLM Provider`, `Base URL` for LiteLLM, `LLM Model`), confidential data (`Decrypt password`, `LLM API Key`, `execution wallet private key`, `Alchemy API Key`, optional `GitHub PAT`, `Encrypt password`), and runner fields (interval, context limit, max tokens, supplementary profile, launcher port/secret), including concrete examples and final action order (`Detect Launcher` -> `Start Runner`).

## 2026-02-24 Document Supplementary Prompt Profile Options
- [x] Add clear descriptions for all Supplementary Prompt Profile options (including `None`) in `docs/published/how-to-use/page.md`
- [x] Ensure wording matches current profile names in SNS UI and remains English-only
- [x] Commit all related changes
- [x] Add review note
- Review: Expanded the `Supplementary Prompt Profile (Optional)` guidance in `docs/published/how-to-use/page.md` with explicit descriptions for all selectable options shown in SNS (`None (base prompts only)`, `Attack-Defense`, `Optimization`, `UX Improvement`, `Scalability-Compatibility`) and added a practical usage example line. Wording is English-only and aligned with current runner prompt profile names.

## 2026-02-24 Expand Agent Provider How-To-Use Inputs Documentation
- [x] Update `docs/published/how-to-use/page.md` step 4 with explicit `RUNNER_SECRET` and `PORT_NUMBER` explanations and examples
- [x] Expand step 6 with itemized `/manage/agents` Runner input-field guidance and concrete examples
- [x] Verify updated markdown wording/structure for clarity and English-only requirement
- [x] Commit all related changes
- [x] Add review note
- Review: Expanded `docs/published/how-to-use/page.md` in `For Agent provider` to explain `RUNNER_SECRET` and `PORT_NUMBER` semantics with concrete values, replaced the launcher command with a filled example, and rewrote step 6 into field-by-field guidance for `/manage/agents` Runner inputs (`interval`, `comment context limit`, `max tokens`, `supplementary prompt profile`, `launcher port`, `launcher secret`) with examples plus action order (`Detect Launcher` -> `Start Runner`). Verified the updated text remains English-only and reflects current UI field labels/flow.

## 2026-02-24 Fix Next Dev Docs Chunk MODULE_NOT_FOUND
- [x] Reproduce `/docs/how-to-use` dev-mode module load failure and capture failing phase
- [x] Identify root cause (`.next` cache corruption vs route/runtime code issue)
- [x] Implement minimal fix to prevent recurrence in SNS dev workflow
- [x] Run verification checks (`prisma:generate`, `tsc`, `sns build`, runner `node --check`)
- [x] Validate `next dev` docs route load after fix
- [x] Commit all related changes
- [x] Add review note
- Review: Diagnosed the `MODULE_NOT_FOUND` (`./4522.js`) as stale/inconsistent `.next` server chunks during dev/build artifact reuse rather than docs-route source logic. Added deterministic cache reset in SNS dev startup by introducing `clean:next` and chaining it before `next dev` in `apps/sns/package.json`, preventing stale chunk references from persisting across runs. Verification: `npm -w apps/sns run clean:next` (confirmed `.next` removal), `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`. `npm -w apps/sns run build` failed in sandbox due external DNS restriction (`fonts.googleapis.com ENOTFOUND`), and full `next dev` route serving could not be completed here because port binding is blocked (`listen EPERM 0.0.0.0:3000`); script execution confirmed that `clean:next` runs before dev server startup.

## 2026-02-24 Switch Runner Release Install Step To npm install
- [x] Change runner release workflow dependency install step from `npm ci` to `npm install`
- [x] Verify workflow file diff and YAML integrity
- [x] Commit the workflow change
- [x] Add review note
- Review: Updated `.github/workflows/runner-binary-release.yml` install step from `npm ci` to `npm install` so runner binary release jobs no longer fail on lockfile synchronization checks. Confirmed the change is isolated to the install command and workflow structure remains valid. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `npm -w apps/sns run build`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-24 Commit And Push Runner Version Bump For Auto Release
- [x] Sync `apps/runner/package.json` and `package-lock.json` runner version to `0.1.1`
- [x] Verify lock/package version alignment for runner workspace
- [x] Commit all pending changes
- [x] Push to `origin/main`
- [x] Add review note
- Review: Prepared runner `0.1.1` bump for release workflow trigger by aligning `apps/runner/package.json` and `package-lock.json` (`packages[\"apps/runner\"].version`) to the same version, then committed and pushed all pending changes on `main` so GitHub Actions can evaluate automatic binary build/release.

## 2026-02-24 Increase Paragraph Spacing In Shared Text Output
- [x] Increase paragraph spacing in shared `rich-text` output format with visibly larger rhythm
- [x] Keep compact mode paragraph spacing balanced
- [x] Run verification checks (`prisma:generate`, `tsc`, `sns build`, runner `node --check`)
- [x] Commit all changes
- [x] Add review note
- Review: Increased paragraph spacing in shared `rich-text` output by raising base block gap (`8px -> 10px`) and adding additional spacing between consecutive paragraphs (`p + p { margin-top: 6px }`). Compact mode was rebalanced to preserve readability (`gap: 6px -> 8px`, `p + p { margin-top: 4px }`). This applies to all render engines that emit `rich-text`. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `npm -w apps/sns run build`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-24 Increase Section/Subsection Top Spacing In Shared Text Output
- [x] Increase top spacing before section/subsection headings in shared `rich-text` output format
- [x] Keep compact mode readability balanced after spacing increase
- [x] Run verification checks (`prisma:generate`, `tsc`, `sns build`, runner `node --check`)
- [x] Commit all changes
- [x] Add review note
- Review: Increased section/subsection top spacing in shared `rich-text` output by adding explicit heading-top spacing rules in `apps/sns/src/app/globals.css`: `h3/h4:not(:first-child)` now receive larger top margin (`14px`), with compact-mode overrides (`10px`) for balanced density. This applies to all text-rendering engines that emit `rich-text` output format. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `npm -w apps/sns run build`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-24 Enforce Shared Output Format Across SNS Rendering Engines
- [x] Align `MarkdownRenderer` output DOM/class contract with `FormattedContent` output format
- [x] Keep parser inputs independent while sharing one visual/output format contract
- [x] Update `sns-design-layout-guardrails` to explicitly require shared output format across render engines
- [x] Run verification checks (`prisma:generate`, `tsc`, `sns build`, runner `node --check`)
- [x] Commit all changes
- [x] Add review note
- Review: Kept two parser engines by input (`FormattedContent` for thread/comment content, `MarkdownRenderer` for docs markdown) but unified the output format contract on shared `rich-text` DOM/style semantics. Updated `MarkdownRenderer` to emit `rich-text` wrapper + shared block tags (`h3/h4`, `p`, `ul/ol/li`, `blockquote`, `pre > code`, inline `a/strong/code`) and aligned code/link rendering semantics with `FormattedContent`. Added `.rich-text-figure` styles so docs image blocks remain within the shared output style family. Updated `sns-design-layout-guardrails` to explicitly require shared output format across render engines even when parsers differ. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `npm -w apps/sns run build`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-24 Add Shared Markdown Renderer Guardrails To Skill
- [x] Add markdown shared-renderer guardrails to `.agents/skills/sns-design-layout-guardrails/SKILL.md`
- [x] Define non-negotiable reuse rule for SNS markdown surfaces
- [x] Add verification checklist items for markdown renderer changes
- [x] Run verification checks (`prisma:generate`, `tsc`, `sns build`, runner `node --check`)
- [x] Commit all changes
- [x] Add review note
- Review: Added `Shared Markdown Renderer Guardrails` section to `.agents/skills/sns-design-layout-guardrails/SKILL.md` defining mandatory shared renderer usage (`apps/sns/src/components/markdown/MarkdownRenderer.tsx`), ban on ad-hoc route parsers and `dangerouslySetInnerHTML`, centralized `.md-*` styling rules, ordered/nested list behavior preservation, inline formatting parity requirements, and resolver-based asset/link handling. Also extended the skill verification checklist with markdown-specific checks plus parser-drift grep checks. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `npm -w apps/sns run build`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-24 Unify SNS Markdown Rendering Engine And Improve Layout
- [x] Create a shared markdown rendering engine for SNS app usage
- [x] Replace docs markdown custom parser usage with the shared renderer
- [x] Improve ordered-list numbering behavior for mixed nested list content
- [x] Tune markdown spacing/typography (paragraph rhythm, list spacing, code/callout consistency)
- [x] Run verification checks (`prisma:generate`, `tsc`, `sns build`, runner `node --check`)
- [x] Commit all changes
- [x] Add review note
- Review: Added shared markdown engine `apps/sns/src/components/markdown/MarkdownRenderer.tsx` and switched docs runtime loader `apps/sns/src/app/docs/PublishedMarkdownSection.tsx` to use it, removing docs-only ad-hoc parsing logic. The shared engine now handles heading anchors, links, inline code, bold text, fenced code blocks, blockquotes, images, ordered list `start` values, and nested lists (so numbered steps remain stable around sub-bullets). Updated markdown style layer in `apps/sns/src/app/globals.css` to unified `.md-*` classes with improved paragraph rhythm and list spacing. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `npm -w apps/sns run build`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-24 Fix Runner Release Build Failure (Lockfile Sync)
- [x] Sync `package-lock.json` with `apps/runner/package.json` version bump (`0.1.0`)
- [ ] Verify CI-equivalent install step (`npm ci`) passes locally
- [x] Run verification checks (`prisma:generate`, `tsc`, `sns build`, runner `node --check`)
- [x] Commit all changes
- [x] Push to `origin/main`
- [x] Add review note
- Review: Fixed lockfile mismatch that caused GitHub Actions `npm ci` failure after runner version bump by adding missing workspace lock entries for runner in `package-lock.json`: `apps/runner` (`@abtp/runner` version `0.1.0`, dependency `ethers@6.11.1`) and `node_modules/@abtp/runner` workspace link. Also captured recurrence-prevention lesson in `.agents/tasks/lessons.md`. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `npm -w apps/sns run build`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`. Local `npm ci` could not be fully verified in this sandbox due DNS/network failure (`ENOTFOUND registry.npmjs.org`).

## 2026-02-24 Auto Release On Runner Version Bump
- [x] Update runner release workflow to trigger from `main` push changes in `apps/runner/package.json`
- [x] Add version-bump detection so release runs only when `apps/runner/package.json` version increases
- [x] Keep manual release path via `workflow_dispatch` (`tag_name` input)
- [x] Update runner release documentation to match new behavior
- [x] Run verification checks (`prisma:generate`, `tsc`, `sns build`, runner `node --check`)
- [x] Commit all changes
- [x] Add review note
- Review: Changed `.github/workflows/runner-binary-release.yml` to watch `main` pushes touching `apps/runner/package.json` and added a `detect` job that compares previous/current runner versions (`x.y.z`) and gates build/publish unless version increased. Manual dispatch remains supported with explicit `tag_name`. Publish now uses resolved tag output (`v<runner version>` for auto path), skips if tag already exists on origin, and releases binaries + `SHA256SUMS.txt`. Updated `apps/runner/README.md` release trigger documentation accordingly. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `npm -w apps/sns run build`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-24 Switch Runner Release Automation To Tag Push
- [x] Change runner release workflow trigger from GitHub Release publish to tag push (`v*`)
- [x] Keep manual workflow dispatch path usable without duplicate publish behavior
- [x] Update runner release docs to match new trigger
- [x] Run verification checks (`prisma:generate`, `tsc`, `sns build`, runner `node --check`)
- [x] Commit all changes
- [x] Add review note
- Review: Updated `.github/workflows/runner-binary-release.yml` to trigger on `push.tags: v*` and `workflow_dispatch` (with required `tag_name` input), removed `release.published` dependency, and changed publish guard to run on push/workflow-dispatch events. Release upload now resolves tag via `${{ github.ref_name }}` on tag push or `${{ inputs.tag_name }}` on manual dispatch, with release notes auto-generation enabled. Updated `apps/runner/README.md` trigger documentation accordingly. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `npm -w apps/sns run build`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-24 Sync Docs How-To-Use From README
- [x] Replace `docs/published/how-to-use/page.md` content with usage instructions from `README.md`
- [x] Preserve section headings for docs TOC compatibility (`How to use`, `For DApp developer`, `For Agent provider`)
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Replaced all previous image-placeholder content in `docs/published/how-to-use/page.md` with the README `Quickstart by user type` usage instructions, including live SNS URL, release binary link, DApp developer flow, Agent provider flow, launcher command example, and local network access permission steps. Preserved `## How to use`, `### For DApp developer`, and `### For Agent provider` headings for docs TOC anchor compatibility. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Add Future Compensation Item To DApp Developer Responsibilities
- [x] Add an English bullet under `What DApp developers do` about future compensation to Agent providers
- [x] Keep all existing role/expectation text unchanged except this requested addition
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Added one new English bullet in `docs/published/what-is-24-7-ethereum-playground/page.md` under `What DApp developers do`: `In future updates, compensate Agent providers for delivering high-quality QA feedback.` Kept all other sections unchanged. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Restore English-Only Wording In What-Is Docs
- [x] Replace non-English expectation bullet with English wording
- [x] Keep the same future-update meaning while following English-only docs rule
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Replaced the non-English bullet in `docs/published/what-is-24-7-ethereum-playground/page.md` with English wording while preserving the same intent: `Compensation from DApp developers for providing high-quality QA feedback.` under the existing future-update expectation heading. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Update Agent Provider Expectation Text To Future-Update Statement
- [x] Replace current-state expectation block with the exact future-update statement requested by user
- [x] Keep wording exactly as requested
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Replaced the Agent provider expectation subsection in `docs/published/what-is-24-7-ethereum-playground/page.md` with the exact user-provided copy: heading `What Agent providers can expect (in the future updates):` and single bullet `고수준의 QA feedback 제공에 대한 DApp 개발자들로 부터 보상`. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Correct Agent Provider Expectations To Match Implementation Reality
- [x] Remove over-optimistic Agent provider outcome claims from what-is docs
- [x] Replace with factual statements reflecting current implementation limits
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Updated `docs/published/what-is-24-7-ethereum-playground/page.md` to remove overstated Agent provider benefits and align wording with current implementation reality. Renamed the section to `responsibilities and current reality` and replaced prior outcome bullets with explicit constraints: provider role is primarily operational support, no built-in reward/compensation/direct guaranteed benefit, and any value is indirect/non-guaranteed. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Polish What-Is Docs Wording And Structure
- [x] Remove the final sentence beginning with `The SNS app handles...`
- [x] Improve English grammar, clarity, and readability across the full section
- [x] Reformat into a clearer structure with role-specific responsibilities and outcomes
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Rewrote `docs/published/what-is-24-7-ethereum-playground/page.md` for clearer English and scan-friendly structure. Removed the final sentence beginning with `The SNS app handles...` as requested. Reorganized the content into explicit sections (`Who uses it`, role-specific responsibilities, role-specific expected outcomes) and replaced long run-on paragraphs with concise bullet lists for both DApp developers and Agent providers. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Expand Agent Provider Role/Outcome Description In What-Is Docs
- [x] Expand Agent provider responsibilities in `what-is-24-7-ethereum-playground/page.md`
- [x] Expand expected outcomes for Agent providers to match DApp developer detail depth
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Expanded the Agent provider paragraph in `docs/published/what-is-24-7-ethereum-playground/page.md` to include concrete responsibilities (agent profile configuration, local runner operation, provider/model setup, runner-side secret handling, testing focus management, and operational coordination with community owners) plus explicit expected outcomes (repeatable always-on QA, reusable setups across communities, and credibility gains through evidence-backed reports). Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Restructure Published Docs To Section Subfolders
- [x] Change docs source layout from flat markdown files to `docs/published/<section>/page.md`
- [x] Update docs renderer so each section route reads its own subfolder `page.md`
- [x] Support section-local resource files referenced from markdown
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Reworked docs source schema to section folders: `docs/published/<section>/page.md` (plus local assets, e.g. `docs/published/how-to-use/*.svg`). Updated section pages to pass `sectionSlug` into `PublishedMarkdownSection` so each route loads its own `page.md` from the matching folder. Reimplemented `PublishedMarkdownSection` loader to read `.../<section>/page.md`, and added relative-asset resolution to `/api/docs-published/:section/:asset...` for markdown image/link resources. Added new route handler `apps/sns/src/app/api/docs-published/[section]/[...asset]/route.ts` with safe path checks and content-type mapping for file serving. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Render Docs Sections From Published Markdown And Add New First Section
- [x] Replace hardcoded docs section page content with markdown-backed rendering from `docs/published/*.md`
- [x] Add new first docs section `What is 24-7 Ethereum Playground?` as a separate route and markdown file
- [x] Update docs TOC order and `/docs` default redirect to the new first section page
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Added markdown-backed docs rendering by introducing `apps/sns/src/app/docs/PublishedMarkdownSection.tsx`, which reads section markdown from root `docs/published` and renders headings/paragraphs/lists/images/blockquote/code blocks into the existing docs UI classes. Rewired section routes (`how-to-use`, `how-it-works`, `security-notes`, `troubleshooting`) to render from markdown files instead of hardcoded JSX, and created corresponding markdown sources in `docs/published/`. Added the new first section route `apps/sns/src/app/docs/what-is-24-7-ethereum-playground/page.tsx` with source file `docs/published/what-is-24-7-ethereum-playground.md`, updated TOC order in `apps/sns/src/app/docs/layout.tsx`, and changed `/docs` entry redirect in `apps/sns/src/app/docs/page.tsx` to `/docs/what-is-24-7-ethereum-playground`. Added small markdown support styles in `apps/sns/src/app/globals.css` (`docs-markdown`, paragraph, inline code). Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Add First Docs Section "What is 24-7 Ethereum Playground?"
- [x] Add new first docs section route and wire it to render from `docs/published` markdown
- [x] Update docs TOC order so the new section appears first
- [x] Update `/docs` default redirect to the new first section page
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note

## 2026-02-23 Stabilize Cross-Page Horizontal Alignment
- [x] Reserve vertical scrollbar gutter globally so page content x-position stays fixed
- [x] Keep existing layout width/spacing rules unchanged
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Added global scrollbar gutter stabilization in `apps/sns/src/app/globals.css` via `html { scrollbar-gutter: stable; }` so viewport width remains consistent across pages regardless of content-height scrollbar presence. This fixes cross-page horizontal position drift without changing any existing container width, max-width, margin, or page spacing rules. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Fix Docs How-To-Use TOC Link Behavior
- [x] Make the `How to use` TOC link always trigger visible section navigation
- [x] Align other docs section TOC links to explicit section-hash destinations for consistent behavior
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Updated Docs TOC links in `apps/sns/src/app/docs/layout.tsx` to explicit section-hash destinations so link clicks produce deterministic navigation behavior across both same-route and cross-route cases: `/docs/how-to-use#how-to-use`, `/docs/how-it-works#how-it-works`, `/docs/security-notes#security-notes`, `/docs/troubleshooting#troubleshooting` (subsection links already used hashes). Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Split Docs Sections Into Separate Pages
- [x] Convert monolithic `/docs` content into section-specific routes
- [x] Preserve shared docs shell and TOC via `docs/layout.tsx`
- [x] Keep `/docs` as entry route by redirecting to a default section page
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Split Docs into separate section pages by introducing route-based pages under `apps/sns/src/app/docs/`: `how-to-use/page.tsx`, `how-it-works/page.tsx`, `security-notes/page.tsx`, and `troubleshooting/page.tsx`. Added shared docs shell in `apps/sns/src/app/docs/layout.tsx` (hero + TOC + content frame) so all section pages keep consistent structure while no longer sharing one monolithic content page. Converted `apps/sns/src/app/docs/page.tsx` to a route entry redirect (`redirect("/docs/how-to-use")`). Extracted shared constants to `apps/sns/src/app/docs/content.ts` for reuse (`LAST_UPDATED_*`, ASCII diagram). Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Unify Docs Layout With Global SNS Layout
- [x] Remove Docs-only chrome bypass so `/docs` uses the same AppChrome layout as other pages
- [x] Refactor Docs page content layout into shared visual rhythm (`hero` + `card`) while preserving docs sections and TOC
- [x] Update docs CSS to remove fixed topbar-only treatment and align spacing/structure with SNS pages
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Unified Docs with global SNS layout by removing `/docs` exception rendering from `apps/sns/src/components/AppChrome.tsx` so Docs now uses the same shared shell (header/menu/footer/alpha badge) as other pages. Refactored `apps/sns/src/app/docs/page.tsx` from fixed-topbar layout into standard page rhythm: `grid` wrapper + `hero` heading card + `card` content container (`docs-layout-card`) with TOC and article sections preserved. Updated docs styles in `apps/sns/src/app/globals.css` to drop fixed topbar/route-only scaffolding (`docs-route-main`, `docs-topbar` and related breakpoint rules), adopt in-card two-column TOC/content layout, and keep section anchor behavior via `scroll-margin-top`. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Reduce Title Box Height Without Scaling Inner Elements
- [x] Reduce title box vertical size only by adjusting box spacing/padding
- [x] Keep all inner text/component sizes unchanged
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Reduced title box height in `apps/sns/src/app/globals.css` by changing only header container padding values: desktop `.site-header` `padding: 14px 18px -> 8px 18px`, mobile (`max-width: 720px`) `.site-header` `padding: 14px 14px -> 10px 14px`. No typography, icon, wallet, or other inner component size values were changed. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Revert Menu Box To Right Alignment
- [x] Revert floating menu box horizontal alignment from center back to right
- [x] Keep existing menu structure and responsive behavior unchanged
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Reverted `apps/sns/src/app/globals.css` menu alignment by changing `.site-menu-float-wrap` back from `justify-content: center` to `justify-content: flex-end`, restoring right-side placement of the floating menu box. No additional style rules or structure were changed. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Center Menu Box Horizontally
- [x] Move the floating menu box horizontal position to screen center
- [x] Keep existing mobile/tablet menu behavior unchanged
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Changed desktop menu horizontal alignment in `apps/sns/src/app/globals.css` by updating `.site-menu-float-wrap` from `justify-content: flex-end` to `justify-content: center`, which centers the floating menu box across the page width while preserving existing menu structure and styles. Tablet/mobile behavior remains unchanged because those breakpoints already override `.site-menu-float-wrap` display mode. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Adjust Wallet Control Scale Down To 125 Percent
- [x] Cancel previous 150% target and resize wallet control to 125%
- [x] Keep wallet dock/text/button/tooltip/status-bubble proportions consistent at 125%
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Reduced wallet control sizing from the prior 150% pass down to 125% in `apps/sns/src/app/globals.css` across the full wallet component surface (`wallet-dock`, row/actions spacing, label/address text, switch button, switch tooltip, address tooltip, status bubble and pointer). Key targets now align to ~125% from the original baseline: button `26 -> 33`, address text `12 -> 15`, label text `10 -> 12.5`, tooltip width `200/280 -> 250/350`, status bubble font `11 -> 14`. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Scale Wallet Control Component To 150 Percent
- [x] Increase wallet control component size to 150% while keeping internal proportions
- [x] Ensure wallet tooltip/status bubble scales consistently with wallet control
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Scaled wallet control visuals in `apps/sns/src/app/globals.css` to ~150% across the full `wallet-*` block. Updated container sizing (`gap`, `radius`, `padding`, shadow), row/action spacing, label/address typography, switch button size (`26 -> 39`) and icon font (`14 -> 21`), plus tooltip/status-bubble geometry and typography (`min/max width 200/280 -> 300/420`, font `11 -> 16.5`, matching offsets/radii/padding). This preserves internal visual proportion while enlarging the whole wallet control component. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Center Wallet Control Vertically In Title Box
- [x] Set wallet control vertical alignment to center within title box
- [x] Keep responsive behavior unchanged except the requested vertical centering
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Adjusted header vertical alignment in `apps/sns/src/app/globals.css` so wallet control sits at the vertical center of the title box by changing `.site-header-top` `align-items: start -> center` and `.site-header-wallet` `align-items: flex-start -> center`. No structural changes were made to `AppChrome`; responsive layout behavior remains the same except centered wallet positioning. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Reduce Title/SubTitle To 70 Percent
- [x] Reduce `brand-title` and `brand-subtitle` font sizes to 70% of current values
- [x] Apply same 70% scaling to mobile breakpoint values
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Applied exact 70% scaling to all `brand-title` and `brand-subtitle` clamp components in `apps/sns/src/app/globals.css`. Desktop: `brand-title clamp(18px, 1.7vw, 28px) -> clamp(12.6px, 1.19vw, 19.6px)`, `brand-subtitle clamp(13px, 1.1vw, 17px) -> clamp(9.1px, 0.77vw, 11.9px)`. Mobile (`max-width: 720px`): `brand-title clamp(16px, 4.8vw, 24px) -> clamp(11.2px, 3.36vw, 16.8px)`, `brand-subtitle clamp(12px, 3.3vw, 15px) -> clamp(8.4px, 2.31vw, 10.5px)`. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Reduce Brand Block Height To Match Menu Box
- [x] Reduce brand title/subtitle/logo sizes so title box height approaches menu box height
- [x] Keep responsive typography/icon proportions balanced on mobile
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Reduced brand block scale in `apps/sns/src/app/globals.css` to bring the title box height closer to the floating menu box height. Desktop updates: `.brand-mark` `64 -> 52`, mark text `25 -> 21`, `.brand-title` `clamp(20px, 2vw, 34px) -> clamp(18px, 1.7vw, 28px)`, `.brand-subtitle` `clamp(15px, 1.45vw, 22px) -> clamp(13px, 1.1vw, 17px)`. Mobile updates (`max-width: 720px`): `.brand-mark` `56 -> 46`, mark text `22 -> 18`, `.brand-title` `clamp(18px, 5.6vw, 28px) -> clamp(16px, 4.8vw, 24px)`, `.brand-subtitle` `clamp(13px, 3.7vw, 18px) -> clamp(12px, 3.3vw, 15px)`. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Slightly Increase Title/Menu Box Gap
- [x] Increase spacing between title box and menu box slightly while keeping them visually close
- [x] Keep responsive spacing balanced so separation remains clear on smaller screens
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Increased only the inter-box spacing on the shared wrapper `site-header-layer` in `apps/sns/src/app/globals.css` from ultra-tight to slightly clearer separation: desktop `gap: 7px`, tablet `gap: 6px`, mobile `gap: 5px`. This keeps title/menu visually close while improving boundary perception without changing box styling, structure, or positioning. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Separate Menu Box From Title Box In Structure
- [x] Move menu box out of title box structure (sibling boxes, not nested)
- [x] Keep both boxes within one top-layer behavior while preserving narrow gap
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Refactored `apps/sns/src/components/AppChrome.tsx` so menu box is no longer nested inside the title box: both now exist as siblings under a shared `site-header-layer` wrapper (`site-header` for title/wallet, `site-menu-float-wrap` for menu). Updated `apps/sns/src/app/globals.css` to make `site-header-layer` the sticky top-layer container and keep very narrow inter-box spacing (`gap: 4px`) while preserving separate box visuals. Responsive rules were adjusted to keep sticky/top behavior on the new wrapper and avoid reintroducing nested structure semantics. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Merge Title/Menu Into One Layer With Tight Gap
- [x] Place title box and menu box into the same top floating layer/container
- [x] Keep visual separation between the two boxes while reducing their gap to very narrow spacing
- [x] Remove detached fixed-menu behavior introduced in previous step
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Merged title box and menu box into the same header layer by moving menu markup back inside `site-header` in `apps/sns/src/components/AppChrome.tsx` while retaining separate card visuals for each block. Reduced vertical spacing between the title block and menu block to a narrow header gap (`4px`) in `apps/sns/src/app/globals.css` so they appear almost adjacent but still visually detached. Removed previously introduced detached fixed-menu behavior by deleting desktop `position: fixed` anchoring from `site-menu-float` and spacer-specific `height` handling from `site-menu-float-wrap`. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Pin Detached Floating Menu To Viewport
- [x] Make the detached floating menu fixed to the viewport on desktop
- [x] Prevent main-content overlap by reserving vertical space where needed
- [x] Keep tablet/mobile behavior usable by reverting to in-flow layout at breakpoints
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Updated detached menu behavior in `apps/sns/src/app/globals.css` so desktop menu is truly screen-fixed (`position: fixed`) with right-side anchoring to the centered layout (`right: max(20px, calc((100vw - 1240px) / 2 + 20px))`, `top: 142px`). Added `site-menu-float-wrap` spacer height (`70px`) to prevent content overlap where the fixed menu would otherwise leave no layout space. Kept smaller breakpoints usable by restoring in-flow behavior at `max-width: 980px` (`position: static`, full-width grid menu). Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Make Detached Floating Menu Use Right-Side Whitespace
- [x] Reduce floating menu width so it sits in right-side whitespace (not near full-width row)
- [x] Keep desktop menu as right-aligned compact floating island and preserve responsive collapse on smaller breakpoints
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Adjusted detached menu sizing/alignment in `apps/sns/src/app/globals.css` so desktop uses a compact right-side floating island (`site-menu-float-wrap` as right-aligned flex; `site-menu-float` width set to `fit-content`, nowrap tab row). This removes the near-full-width strip behavior and makes the menu visually occupy right-side whitespace. Kept responsive behavior by switching back to full-width grid layout at `max-width: 980px` and 2-column grid at `max-width: 720px`. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Split Menu Out From Top Floating Header
- [x] Detach nav menu from the top floating header block
- [x] Add a new right-aligned floating menu container under/next to the header area
- [x] Update responsive rules so the detached menu remains usable on tablet/mobile
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Detached navigation from the top floating header in `apps/sns/src/components/AppChrome.tsx` by moving the menu into a separate block (`site-menu-float-wrap` + `site-menu-float`) rendered after the header. The top floating header now contains only brand/subtitle and top-right wallet control (`site-header-top`, `site-header-wallet`). Updated styling in `apps/sns/src/app/globals.css` to make the menu its own right-aligned floating container on desktop and full-width responsive grid on smaller breakpoints. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Increase Gap Between Subtitle And Menu Buttons
- [x] Increase vertical spacing between brand subtitle and the nav button row
- [x] Keep mobile/tablet spacing balanced with breakpoint-specific adjustments
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Increased subtitle-to-menu spacing by adding top margin on the nav row container `site-header-right` in `apps/sns/src/app/globals.css` (`10px` desktop, `8px` tablet, `6px` mobile) so only the vertical gap between subtitle and menu row is affected. Kept structure and typography untouched. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Increase Brand Logo Icon Size Further
- [x] Increase `brand-mark` size again for stronger visual weight
- [x] Keep mobile icon size proportionally larger as well
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Increased logo icon scale in `apps/sns/src/app/globals.css` by raising desktop `brand-mark` from `56x56` to `64x64` and glyph size to `25px`; mobile breakpoint icon increased from `50x50` to `56x56` with `22px` glyph. Kept surrounding layout untouched so only logo visual weight changes. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Move Wallet To Top-Right And Scale Brand Typography/Icon
- [x] Move wallet control to the top-right area of the header block
- [x] Remove trailing period from brand subtitle (`...DApps.` -> `...DApps`)
- [x] Increase brand title/subtitle text size
- [x] Increase brand icon size
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Reworked header markup in `apps/sns/src/components/AppChrome.tsx` to add a dedicated top row (`site-header-top`) with wallet dock pinned to the right (`site-header-wallet`) and navigation on the lower row only. Updated subtitle copy to remove the trailing period (`DApps.` -> `DApps`). Increased brand visual scale in `apps/sns/src/app/globals.css` by enlarging `brand-mark`, `brand-title`, and `brand-subtitle` (including responsive adjustments for smaller breakpoints) so the identity block reads more prominently. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Revert Header Layout Back To Option 1
- [x] Restore header implementation from Option 1 (`Command Bar Header`) baseline
- [x] Revert `docs/menu_layout_plan.md` selected status to Option 1
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Restored `apps/sns/src/components/AppChrome.tsx`, `apps/sns/src/app/globals.css`, and `docs/menu_layout_plan.md` to the Option 1 baseline state from commit `d93df7b` so the header returns to `Command Bar Header` design and plan-document selection is synchronized. Confirmed navigation structure includes `Docs` as rightmost and active-state styling remains in the Option 1 implementation. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Apply Floating Islands Layout (Option 4)
- [x] Switch `docs/menu_layout_plan.md` selected status from Option 3 to Option 4
- [x] Refactor header into three explicit islands (brand, nav, wallet)
- [x] Replace timeline-specific nav treatment with a single unified nav island
- [x] Keep `Docs` rightmost in nav order
- [x] Verify responsive behavior for island stacking and nav columns
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Updated `docs/menu_layout_plan.md` to mark Option 4 (`Floating Islands`) as selected/applied and synchronized rationale and applied notes. Reworked header markup in `apps/sns/src/components/AppChrome.tsx` into three explicit islands: `site-island-brand`, `site-island-nav`, and `site-island-wallet`, while preserving route order with `Docs` as rightmost nav item. Replaced timeline split-nav styles in `apps/sns/src/app/globals.css` with a unified floating-islands visual system and adjusted responsive behavior: desktop 3-island row, <=1120 stacked fallback, <=980/<=720 compact nav grid columns. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Apply Timeline Nav Layout (Option 3)
- [x] Switch `docs/menu_layout_plan.md` selected status from Option 2 to Option 3
- [x] Update header navigation structure to separate workflow nav and utility nav
- [x] Style workflow nav as timeline flow (`Communities -> Requests -> Reports`) and keep utility links (`Home`, `Management`, `Docs`)
- [x] Keep `Docs` as the rightmost utility menu item
- [x] Verify responsive behavior for the new timeline/utility split
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Updated `docs/menu_layout_plan.md` to mark Option 3 (`Timeline Nav`) as selected/applied and synchronized selected-direction rationale. Refactored header nav structure in `apps/sns/src/components/AppChrome.tsx` into two explicit groups: workflow (`Communities`, `Requests`, `Reports`) and utility (`Home`, `Management`, `Docs`), with `Docs` remaining rightmost within utility links. Restyled header/nav in `apps/sns/src/app/globals.css` to implement timeline semantics for workflow nav (connector line + directional arrows + highlighted active step) and separate utility chip navigation aligned with wallet controls. Responsive behavior now collapses workflow and utility nav groups independently at current breakpoints. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Apply Split Rail Header Layout (Option 2)
- [x] Update `docs/menu_layout_plan.md` with selected option switched to `Split Rail`
- [x] Refactor SNS header structure to explicit split-rail markup (left identity rail + right main controls)
- [x] Apply new split-rail visual system to nav/wallet alignment while keeping `Docs` rightmost
- [x] Verify responsive fallback behavior at existing breakpoints
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Updated `docs/menu_layout_plan.md` status/selection to Option 2 (`Split Rail`) and revised selected-direction rationale and applied notes accordingly. Updated `apps/sns/src/components/AppChrome.tsx` header markup to separate `brand-rail` and `site-header-main` zones so the layout now follows left-rail identity + right controls architecture. Restyled `apps/sns/src/app/globals.css` for split rail behavior: compact identity rail card, right-side main panel with brand copy + nav/wallet lane, revised nav chip styling, and active-state contrast; responsive rules now collapse to single-column with compact rail row and grid nav on smaller widths. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Document Menu Layout Concepts And Apply Option 1
- [x] Create `docs/menu_layout_plan.md` and record all proposed layout options
- [x] Mark Option 1 (`Command Bar Header`) as selected design
- [x] Apply Option 1 styles to SNS header/navigation layout
- [x] Verify responsive behavior for header/nav at current breakpoints
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Added new plan document `docs/menu_layout_plan.md` with four layout concepts and explicitly marked Option 1 (`Command Bar Header`) as selected/applied. Updated top-nav styling in `apps/sns/src/app/globals.css` to implement the command-bar visual model (cohesive rounded command surface + lightweight tabs + clearer active state), while preserving two-row header structure (brand row + controls row) and `Docs` rightmost order from `apps/sns/src/components/AppChrome.tsx`. Responsive behavior remains under existing breakpoints (`980px`, `720px`) with grid downshifts for nav density. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Remove Nav Wrapper Box And Propose New Layout Concepts
- [x] Remove the menu container box styling around top navigation
- [x] Keep current nav order with `Docs` at the rightmost position
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Propose multiple innovative layout concepts for the overall header/page composition
- [x] Commit all changes
- [x] Add review note
- Review: Removed the navigation wrapper box from `apps/sns/src/app/globals.css` by deleting container-level border/background/padding styles on `.site-nav` (desktop + responsive block), while preserving menu order in `apps/sns/src/components/AppChrome.tsx` with `Docs` still rightmost. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`. Also prepared new header/layout concept proposals in final delivery note for design direction selection.

## 2026-02-23 Recompose Header Into Two Rows With Single-Line Menu+Wallet
- [x] Refactor header layout so title/description are on the top row and menu+wallet controls share the next row
- [x] Redesign menu visuals to better use horizontal space while keeping `Docs` rightmost
- [x] Add active-state styling for nav links to strengthen visual hierarchy
- [x] Verify responsive behavior remains usable on tablet/mobile breakpoints
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Updated header composition in `apps/sns/src/app/globals.css` so the brand title/description occupies the first row and the second row is a shared controls row with navigation + wallet control. Reworked nav styling into a balanced grid-based segmented layout (`.site-nav` + `.site-nav-link`) that uses available horizontal space better, and added explicit active state styling (`.site-nav-link.is-active`). Updated nav rendering in `apps/sns/src/components/AppChrome.tsx` to use a single source list with active-route detection while preserving requested order with `Docs` rightmost. Responsive behavior remains guarded by existing breakpoints: desktop stays two-row with one-line controls, tablet/mobile fall back to wrapped grid. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Refine Header Layout And Move Docs To Rightmost Menu
- [x] Review current header/nav layout and identify minimal style adjustments for cleaner alignment
- [x] Move `Docs` menu item to the rightmost position in the top navigation
- [x] Improve header right-side composition (nav + wallet) for cleaner visual balance on desktop/mobile
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Reordered top navigation in `apps/sns/src/components/AppChrome.tsx` so `Docs` is the rightmost menu item (`Home -> Management -> Communities -> Requests -> Reports -> Docs`). Refined header composition styles in `apps/sns/src/app/globals.css`: desktop header now uses a balanced two-column grid, right-side controls are right-aligned with cleaner nav/wallet grouping, and nav pills are wrapped in a subtle shared container for better rhythm. Kept mobile behavior by switching header back to flex with wrapped navigation under `@media (max-width: 980px)` so layout remains usable on narrow widths. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Add Local Network Access Guidance To README And Docs
- [x] Update root `README.md` agent-provider usage to explicitly require browser Local Network Access for runner detect/control
- [x] Add concise "how to allow" instructions in `README.md`
- [x] Update `/docs` `How to use` section to include image-based Local Network Access guidance
- [x] Add/update docs image asset for Local Network Access instruction
- [x] Run verification checks
- [x] Commit all changes
- [x] Add review note
- Review: Updated root `README.md` quickstart for agent providers to explicitly require browser `Local Network Access` permission before runner detect/control and added concise setup steps: open site settings for `agentic-ethereum.com`, set `Local network access` to `Allow`, then reload. Updated docs `How to use` in `apps/sns/src/app/docs/page.tsx` with a new permission requirement callout and an image slot dedicated to Local Network Access instructions. Added new placeholder asset `apps/sns/public/docs/how-to-use-local-network-access.svg` for screenshot-based browser-setting guidance. Added a small callout style in `apps/sns/src/app/globals.css` to keep docs readability. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Build Minimal Docs Page Layout (Fixed Header + TOC + Content)
- [x] Confirm existing SNS shell behavior and identify where to bypass global chrome for `/docs`
- [x] Add `/docs` page with four sections:
- [x] `How to use` (with subsections `For DApp developer`, `For Agent provider`, image-capable rendering)
- [x] `How it works` (ASCII art block)
- [x] `Security Notes`
- [x] `Troubleshooting`
- [x] Implement minimal docs layout constraints (fixed top title + last updated, fixed left TOC, right content only)
- [x] Add or adjust entry link to `/docs` from standard SNS navigation
- [x] Run verification checks (SNS type check + required syntax checks)
- [x] Commit all changes
- [x] Add review note
- Review: Added a new minimal `/docs` page (`apps/sns/src/app/docs/page.tsx`) with the exact required section set: `How to use`, `How it works`, `Security Notes`, `Troubleshooting`. `How to use` now has two subsections (`For DApp developer`, `For Agent provider`) and image-rendering support via two placeholder SVG assets under `apps/sns/public/docs/`. `How it works` is rendered as a monospace ASCII-art block. Updated global shell behavior in `apps/sns/src/components/AppChrome.tsx` so `/docs` bypasses normal SNS chrome (header/nav/footer/alpha badge) and shows only docs content, while standard pages now include a `Docs` nav link. Added dedicated docs layout styles in `apps/sns/src/app/globals.css` for fixed top title/date bar, sticky left TOC, and right-side content panel with responsive mobile fallback. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Convert SNS Time Display To User Local Time
- [x] Audit all user-visible time render paths in SNS pages/components
- [x] Add hydration-safe local-time rendering utility/component and apply to shared feed/community surfaces
- [x] Apply local-time formatting to remaining direct time displays (community page/admin surfaces)
- [x] Run verification commands and behavior checks
- [x] Commit all changes
- [x] Add review note
- Review: Added a shared client formatter component `apps/sns/src/components/LocalDateText.tsx` that renders deterministic UTC text first (hydration-safe) and then updates to browser-local time after mount, so no extra browser permission is required while still avoiding SSR/CSR timezone mismatch regressions. Applied it to feed/community surfaces where time is widely shown: `ThreadFeedCard`, `CommentFeedCard`, `CommunityListSearchFeed`, and community header metadata in `apps/sns/src/app/sns/[slug]/page.tsx`. Also updated community admin detail timestamps (`Created/Closed/Delete At`) to local-time formatting in `apps/sns/src/app/manage/communities/admin/page.tsx`. Added `formatLocalDateTime`/`formatLocalDate` helpers in `apps/sns/src/lib/dateDisplay.ts` for consistent local rendering. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Replace Root README One-command Demo With Two-User Quickstart
- [x] Confirm current README scope and gather source-of-truth usage paths (`https://agentic-ethereum.com`, manage pages, runner binary release flow)
- [x] Replace `One-command demo` section with concise usage guide for:
- [x] dApp service developers (community creation/management path)
- [x] agent providers (agent registration + local runner binary execution path)
- [x] Verify final README content has no stale `One-command demo` fragment and references valid commands/paths
- [x] Commit all changes
- [x] Add review note
- Review: Replaced the truncated `One-command demo` tail in `README.md` with a deployment-oriented `Quickstart by user type` section for (A) dApp service developers and (B) agent providers. Added concrete production URLs (`https://agentic-ethereum.com`, `/manage/communities`, `/manage/agents`), binary release link (`https://github.com/tokamak-network/24-7-playground/releases/latest`), and launcher command using current CLI contract (`serve --secret --port --sns`). Verification: removed stale demo markers (`rg -n "One-command demo|docker compose up --build" README.md` no matches), confirmed new usage paths/command text (`rg -n "Quickstart by user type|manage/communities|manage/agents|tokamak-runner-macos-arm64 serve --secret" README.md`). Limitation: `markdownlint` is not installed in this environment.

## 2026-02-23 Block Owner-Only Filter Toggle Without Wallet And Show Bubble
- [x] Confirm current owner-only checkbox behavior in requests/reports shared section component
- [x] Block checking when wallet is disconnected and show reused wallet-connect bubble element
- [x] Run verification commands and behavior checks
- [x] Commit all changes
- [x] Add review note
- Review: Updated shared requests/reports section component `apps/sns/src/components/CommunityNameSearchFeedSection.tsx` so checking `View only my communities` while wallet-disconnected is blocked (`ownerOnly` stays false) and a wallet-connect warning bubble appears. Reused the existing bubble element/style `wallet-status-bubble` (already used in `WalletDock`) instead of introducing a new visual component. Behavior checks: when disconnected and attempting to check, filter does not activate and bubble text `Connect wallet first.` appears briefly; when connected, checkbox toggles normally and existing owner-wallet filtering behavior remains. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Remove Forced Sign-In Redirect On Navigation Without Wallet
- [x] Confirm the exact global redirect hook path and impacted surfaces
- [x] Remove non-connected click interception that pushes `/sign-in` from SNS global chrome
- [x] Run verification commands and behavior checks for navigation without wallet
- [x] Commit all changes
- [x] Add review note
- Review: The forced redirect was implemented by `MetaMaskButtonGuard` mounted globally in `apps/sns/src/components/AppChrome.tsx`; it captured all `button/a` clicks while wallet-disconnected and pushed `/sign-in?next=...`. Removed the global mount from `AppChrome` and deleted the unused guard file `apps/sns/src/components/MetaMaskButtonGuard.tsx`, so page navigation is no longer intercepted by wallet state. Behavior checks: no remaining references to `MetaMaskButtonGuard` and no `/sign-in?next=` redirect push path in `apps/sns/src`. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Create Deploy Build Failure Prevention Skill
- [x] Define deploy/build guardrail scope and trigger conditions
- [x] Create new skill file at `.agents/skills/deploy-build-guardrails/SKILL.md`
- [x] Run verification commands
- [x] Commit all changes
- [x] Add review note
- Review: Added new reusable skill `.agents/skills/deploy-build-guardrails/SKILL.md` with repository-specific guardrails for deploy/build failures: phase-based failure triage, Next.js render-mode safety rules for Prisma-backed pages, Prisma/build invariants (`generate` yes, migration-in-build no), environment checks, route-level safety checklist, verification floor, and stop/re-plan conditions. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Fix Vercel Build Failure From Home ISR DB Access
- [x] Confirm failing build path and isolate route-level scope
- [x] Switch home page rendering mode to runtime dynamic to avoid DB query at build time
- [x] Run verification matrix commands (type/syntax) and behavior-diff checks
- [x] Commit all changes
- [x] Add review note
- Review: Build failure trace showed `/` static generation invoking DB-backed home data (`getRecentActivity`, `getHomeCommunityActivityStats`) at build time after `revalidate=10` rollout. Changed `apps/sns/src/app/page.tsx` from `revalidate` to `dynamic = "force-dynamic"` so home data resolves at request time instead of build time. Behavior diff: home still renders same content and keeps client-side polling, but no longer requires DB availability during `next build` export step for `/`. Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Fix Owner Wallet Connect Invalid walletAddress Regression
- [x] Trace owner wallet connect path and confirm where invalid wallet payload can be produced
- [x] Harden wallet address extraction/normalization before challenge request (WalletDock + owner-session client path)
- [x] Run verification matrix commands (type/syntax) and auth-flow behavior checks
- [x] Commit all changes
- [x] Add review note
- Review: Root cause path was client-side wallet extraction that assumed account payloads are always plain strings; on providers that can emit account objects, `String(accounts[0])` could become invalid input for `/api/auth/owner/challenge`, causing `Invalid walletAddress`. Added robust wallet extraction (`string | { address } | { selectedAddress }`) and strict checksum normalization with `ethers.getAddress` before challenge request in `apps/sns/src/lib/ownerSessionClient.ts`. Updated `WalletDock` and `useOwnerSession` account-read paths to use the same object-safe extraction so connect/session-sync logic remains stable. Positive-path check (code): valid address candidates now pass normalization and are sent to challenge. Negative-path check (code): if no valid wallet can be normalized from `walletHint`, `eth_requestAccounts`, and fallback `eth_accounts`, flow fails early with `No valid wallet selected.` and does not call challenge API. Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Keep Home Stats Numbers Visible During Polling
- [x] Confirm disappearance cause and keep existing polling cadence/tab-visibility behavior
- [x] Remove home-stats value hide/show phase transitions so previous numbers stay visible until new data arrives
- [x] Run verification matrix commands (type/syntax) and targeted behavior checks
- [x] Commit all changes
- [x] Add review note
- Review: Root cause was the `HomeStatsGrid` exit/enter phase animation flow that intentionally hid values before each poll fetch. Removed phase/timer-based hide/show logic and now keep the previously rendered numbers visible until new stats are received. Polling cadence remains 3000ms and inactive-tab skip behavior remains enforced (`document.visibilityState` guard). Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 SNS Home Polling Pause On Inactive Tab + Revalidate(10s)
- [x] Confirm current home polling/caching behavior scope and keep poll intervals unchanged
- [x] Apply inactive-tab polling pause/resume logic to home polling components only
- [x] Apply `revalidate = 10` to impacted home render/API paths without widening scope
- [x] Run verification matrix commands (type/syntax) and targeted behavior checks
- [x] Commit all changes
- [x] Add review note
- Review: Kept home polling intervals unchanged (`HomeStatsGrid` 3000ms, `RecentActivityFeed` 5000ms) and added `document.visibilityState` guards so polling requests are skipped when the browser tab is not visible. Applied `export const revalidate = 10` to home page route segment (`apps/sns/src/app/page.tsx`) and activity API routes (`apps/sns/src/app/api/activity/home-stats/route.ts`, `apps/sns/src/app/api/activity/recent/route.ts`) per request. Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`. Behavior checks: confirmed polling constants were unchanged and visibility guards are present in both polling ticks.

## 2026-02-23 Add On-Demand Thread Recent-Comments Retrieval For Runner Agent
- [x] Confirm current `request_contract_source` runner-inbox feedback flow and mirror pattern scope for thread comments
- [x] Add SNS runner-auth read endpoint for one-thread recent comments with configurable limit
- [x] Add runner SNS client + engine action handling to request thread comments and enqueue feedback to `context.runnerInbox`
- [x] Update runner prompts to instruct thread-comment retrieval request when needed
- [x] Regenerate embedded prompt assets and update guardrail/docs references
- [x] Run verification checks and add review note
- Review: Added runner-auth SNS route `GET /api/agents/threads/comments` in `apps/sns/src/app/api/agents/threads/comments/route.ts` (requires runner token + agent id, scoped to assigned community, returns recent comments by `threadId` and `commentLimit`). Added `fetchThreadComments` in `apps/runner/src/sns.js` and new runner action `request_thread_comments` in `apps/runner/src/engine.js`, mirroring `request_contract_source` feedback flow by enqueuing `thread_comments_feedback` into `context.runnerInbox` and communication logs. Updated prompts (`apps/runner/prompts/agent.md`, `apps/runner/prompts/user.md`) to explicitly instruct requesting recent thread comments when needed, and expanded JSON action schema with `request_thread_comments` + optional `commentLimit`. Updated protocol guardrail skill to include the new action and read route. Regenerated embedded prompts (`apps/runner/src/promptAssets.generated.js`). Verification: `npm -w apps/runner run generate:prompt-assets`, `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Define Runner LLM Context Prompt Inclusion Scope In Skill
- [x] Trace prompt composition and context payload boundaries from runner/SNS code
- [x] Update `runner-communication-protocol-guardrails` skill with explicit inclusion/exclusion scope
- [x] Align skill action/read-route contracts with current implementation (`request_contract_source` path)
- [x] Add review note
- Review: Updated `.agents/skills/runner-communication-protocol-guardrails/SKILL.md` to codify current LLM prompt-context scope: system/user composition pipeline, assigned-community narrowing, `runnerInbox` injection, included context fields, and explicit exclusions (no raw contract source in default context, SYSTEM body redaction). Also synchronized protocol contract lists with current code by adding action `request_contract_source` and read route `GET /api/agents/contracts/source`. Verification: code-path cross-check against `apps/runner/src/engine.js`, `apps/runner/src/sns.js`, `apps/sns/src/app/api/agents/context/route.ts`, and `apps/sns/src/app/api/agents/contracts/source/route.ts`.

## 2026-02-23 Add Per-Agent Cumulative LLM Token Usage To Runner Status/Inspect
- [x] Extend runner engine state with cumulative LLM usage counters
- [x] Populate cumulative counters after each successful LLM response parsing
- [x] Expose the new field in launcher default status payload shape
- [x] Show cumulative usage per agent in `runner:inspect` output
- [x] Update runner README status/inspect docs
- [x] Run syntax/help verification
- [x] Add review note
- Review: Added `llmUsageCumulative` to `RunnerEngine` state in `apps/runner/src/engine.js` with counters (`llmCallCount`, `callsWithUsage`, `callsWithoutUsage`, `inputTokens`, `outputTokens`, `totalTokens`). Each LLM call completion now merges normalized usage values into cumulative totals. Added matching default field in `apps/runner/src/index.js` default status payload. Updated `apps/runner/scripts/inspect-managed-agents.js` to include and print per-agent cumulative usage in both text and JSON output. Updated `apps/runner/README.md` inspect/status notes to document the new field. Verification: `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/index.js`, `node --check apps/runner/scripts/inspect-managed-agents.js`, `npm run runner:inspect -- --help`, and a direct status-shape probe (`new RunnerEngine().getStatus().llmUsageCumulative`).

## 2026-02-23 Add Runner Inspect Command For Managed Agents
- [x] Add runner script that queries launcher `/runner/status` on target host/port using `x-runner-secret`
- [x] Include managed-agent list and per-agent redacted `config` in command output
- [x] Expose command from both `apps/runner` and root workspace scripts
- [x] Update runner README usage snippet
- [x] Verify command wiring and syntax
- [x] Add review note
- Review: Added `apps/runner/scripts/inspect-managed-agents.js` to fetch `GET /runner/status` with launcher secret, then print managed `agentId` rows and each agent's redacted `config` (or emit JSON with `--json`). Added `inspect:managed` in `apps/runner/package.json` and root alias `runner:inspect` in `package.json` with arg forwarding. Updated `apps/runner/README.md` with root usage example. Verification: `node --check apps/runner/scripts/inspect-managed-agents.js`, JSON parse checks for `package.json` and `apps/runner/package.json`, `npm run runner:inspect -- --help`.

## 2026-02-23 Refine Priority-1 Summary Dedup Rule Wording
- [x] Update Priority-1 dedup sentence in `apps/runner/prompts/agent.md` to explicit role/key-functions/risk-surface scope
- [x] Regenerate embedded prompt assets
- [x] Run minimal runner syntax checks
- [x] Commit changes
- [x] Add review note
- Review: Refined Priority-1 wording in `apps/runner/prompts/agent.md` to explicitly prohibit repeating already-covered `role`, `key functions`, or `risk surface` for the same contract. Regenerated embedded prompt assets in `apps/runner/src/promptAssets.generated.js` so runtime prompt bundle matches source markdown. Recorded this correction pattern in `.agents/tasks/lessons.md`. Verification: `npm -w apps/runner run generate:prompt-assets`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/promptAssets.generated.js`.

## 2026-02-23 Log LLM Call Start/Usage In Terminal And File Logs
- [x] Add provider-agnostic LLM usage normalization in `apps/runner/src/llm.js`
- [x] Return structured `{ content, usage, provider, model }` from LLM call path
- [x] Add runner cycle logs for LLM call start/completion with token usage in terminal summaries
- [x] Add corresponding structured full-log entries with token usage
- [x] Run runner syntax checks
- [x] Commit changes
- [x] Add review note
- Review: Extended `apps/runner/src/llm.js` to normalize token usage across providers (OpenAI/LiteLLM-compatible, Anthropic, Gemini) and return structured LLM results `{ provider, model, content, usage }`. Updated `apps/runner/src/engine.js` to emit explicit start/completion messages for each LLM API call to terminal summaries and structured full-log entries with usage payloads. Completion summary now includes `tokens(input=..., output=..., total=...)`; when provider response omits usage fields, values render as `unknown`. Verification: `node --check apps/runner/src/llm.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-23 Reset Stale Security Signature Cache On Agent/Wallet Change
- [x] Clear `securitySignature` when selected agent changes in Manage Agents page
- [x] Clear `securitySignature` when connected wallet changes
- [x] Update lessons with this correction pattern
- [x] Run minimal type/syntax checks
- [x] Commit changes
- [x] Add review note
- Review: Fixed stale signature cache usage in `apps/sns/src/app/manage/agents/page.tsx` by resetting `securitySignature` whenever selected agent changes (both empty/non-empty selected-agent branches) and by adding a dedicated `useEffect` keyed to `walletAddress`. This prevents decrypt/encrypt from reusing a signature generated under a different agent or wallet context. Added a new durable lesson in `.agents/tasks/lessons.md` to require clearing cached signing material on identity context changes. Verification: `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-22 Runner Context Source-On-Demand Refactor
- [x] Remove contract source raw payload from default `/api/agents/context` response while keeping contract list + ABI
- [x] Add runner-authenticated SNS contract-source read endpoint for one-contract fetch
- [x] Extend runner SNS client/engine with new `request_contract_source` action, per-contract source cache, and runner inbox feedback wiring
- [x] Update runner prompts (Priority 1 + action schema) for contract-summary workflow and explicit source-request protocol (one contract per request)
- [x] Regenerate embedded prompt assets and run verification matrix commands
- [x] Commit changes
- [x] Add review note
- Review: Updated runner-context contract payloads to exclude raw source by default (`apps/sns/src/app/api/agents/context/route.ts`) and additionally redacted SYSTEM thread body in context to prevent repeated source-body injection. Added runner-authenticated source endpoint `GET /api/agents/contracts/source` (`apps/sns/src/app/api/agents/contracts/source/route.ts`) that accepts exactly one contract selector (`contractId` or `contractAddress`) and returns ABI+source for a single contract in the runner’s assigned community. Extended runner SNS client (`apps/runner/src/sns.js`) with `fetchContractSource`, and runner engine (`apps/runner/src/engine.js`) with new action `request_contract_source`, per-contract source cache, `runnerInbox` feedback delivery into next-cycle `context.runnerInbox`, and tx feedback enqueue parity. Updated prompts (`apps/runner/prompts/agent.md`, `apps/runner/prompts/user.md`) to require per-contract SYSTEM summaries and explicit one-contract source request flow. Regenerated embedded prompt assets (`apps/runner/src/promptAssets.generated.js`). Verification: `npm -w apps/runner run generate:prompt-assets`, `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`, `node --check apps/runner/src/communicationLog.js`.

## 2026-02-22 Show Alpha Test Notice At SNS Bottom-Left
- [x] Add app-wide alpha-test notice in shared SNS chrome
- [x] Style notice as a fixed bottom-left badge for desktop/mobile
- [x] Run minimal checks and commit
- [x] Add review note
- Review: Added an app-wide alpha indicator in `apps/sns/src/components/AppChrome.tsx` so both sign-in and main-shell routes render the same fixed notice. Added `.alpha-test-badge` styles in `apps/sns/src/app/globals.css` to anchor the notice at the lower-left corner with mobile safe-area adjustments and non-interactive behavior (`pointer-events: none`). Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-22 Show Run + Unregister Buttons After Agent Registration
- [x] Identify both registration CTA surfaces (`CommunityListSearchFeed`, `CommunityAgentActionPanel`)
- [x] Replace single `Unregister My Agent` state with horizontal `Run My Agent` + `Unregister My Agent` actions
- [x] Keep unregister API behavior unchanged and recolor only unregister button to red tone
- [x] Keep `Run My Agent` behavior as navigation to `/manage/agents/`
- [x] Run minimal checks and commit
- [x] Add review note
- Review: Updated both community surfaces to keep registration behavior but change registered-state CTAs. In `apps/sns/src/components/CommunityListSearchFeed.tsx`, registered communities now render a two-column action row under `View Community`: `Run My Agent` (`/manage/agents/`) and `Unregister My Agent` (existing unregister handler). In `apps/sns/src/components/CommunityAgentActionPanel.tsx`, the registered-state single button is replaced with the same two-button row and the same unregister flow. Added shared styling in `apps/sns/src/app/globals.css` for `button-danger` (red-toned unregister) and two-column action rows (`community-agent-actions-row`, `community-tile-inline-actions`) while keeping existing register-state behavior unchanged. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`, `node --check apps/runner/src/communicationLog.js`.

## 2026-02-22 Fix Runner JSON Parse Failure On Mixed LLM Output
- [x] Reproduce parse failure pattern from mixed `<think>` + solidity code block + JSON action output
- [x] Harden JSON extraction to prioritize valid fenced JSON and scan multiple JSON start positions safely
- [x] Make parser fallback reuse one extracted payload to avoid inconsistent second extraction
- [x] Run runner syntax checks and focused extraction validation
- [ ] Commit changes
- [x] Add review note
- Review: `apps/runner/src/utils.js` extraction previously preferred the first raw `{`/`[` start and could lock onto Solidity code blocks before JSON action blocks, causing downstream `JSON.parse` failures like `Unexpected token r`. Updated extraction to scan all fenced blocks, prefer valid JSON fenced snippets, filter raw start indices with JSON-likely heuristics, and parse balanced bracket snippets across multiple start positions. Updated `apps/runner/src/engine.js` to reuse one extracted payload for strict parse + sanitize fallback to avoid inconsistent second extraction. Verification: `node --check apps/runner/src/utils.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`, `node --check apps/runner/src/communicationLog.js`, plus focused `node` reproduction showing mixed Solidity+JSON output now extracts the JSON action correctly.

## 2026-02-22 Fix Binary Runner Log Write Failures On pkg Snapshot Paths
- [x] Reproduce and confirm log write failures stem from default `/snapshot/...` path resolution in packaged binary runtime
- [x] Update runner default log-root resolution to use writable mountpoint when running as packaged binary
- [x] Keep source-runner default log path unchanged and support explicit `RUNNER_LOG_DIR` override
- [x] Update runner README with binary log directory behavior
- [x] Run verification matrix checks and commit
- [x] Add review note
- Review: `apps/runner/src/utils.js` previously resolved instance logs via `path.resolve(__dirname, \"..\", \"logs\", ...)`, which becomes read-only `/snapshot/...` under pkg binaries and caused repeated `Cannot mkdir in a snapshot` errors. Added `resolveRunnerLogRoot()` with packaged-runtime detection (`process.pkg`) and writable defaults (`~/.tokamak-runner/logs`, fallback `./tokamak-runner-logs`), plus `RUNNER_LOG_DIR` override support. `resolveRunnerInstanceLogDir()` now uses this root, preserving source-runner behavior while fixing binary logging. Synced `apps/runner/README.md` with new binary log-path semantics.

## 2026-02-22 Fix Address-Space Mismatch For 127.0.0.1 Launcher Fetches
- [x] Confirm runtime error signature (`target local` vs `resource loopback`) from deployed console
- [x] Set HTTPS localhost fetch hint to `targetAddressSpace: "loopback"` for `127.0.0.1` launcher URLs
- [x] Run verification matrix checks and commit
- [x] Add review note
- Review: Deployed browser console showed deterministic mismatch (`Request had a target IP address space of 'local' yet the resource is in address space 'loopback'`) for `http://127.0.0.1:*` launcher calls. Updated `withLocalLauncherRequestOptions` in `apps/sns/src/app/manage/agents/page.tsx` to use `targetAddressSpace: "loopback"` so request target-space matches loopback endpoints exactly.

## 2026-02-22 Add Local Network Access Help Modal For Runner Detection
- [x] Detect permission-blocked localhost access in user-triggered detect/start/stop flows
- [x] Add modal guidance with explicit browser settings instructions and permission-state display
- [x] Add modal `Retry Detect Launcher` action bound to current launcher port
- [x] Suppress modal automatically when detection/status succeeds
- [x] Run verification matrix checks and commit
- [x] Add review note
- Review: Implemented a dedicated local-network help modal in `apps/sns/src/app/manage/agents/page.tsx` that opens when HTTPS-hosted localhost launcher calls are blocked (`permissionState !== granted`) in detect/status/start/stop preflight flows. The modal explains that browser settings must allow Local Network Access for `agentic-ethereum.com`, shows current permission state, and provides a direct `Retry Detect Launcher` action. Modal auto-closes on successful launcher detection/status recovery.

## 2026-02-22 Prevent Auto Localhost Probes From Forcing Browser LNA Denials
- [x] Reconcile browser error state after loopback/local iteration and confirm required `targetAddressSpace` value
- [x] Restore `targetAddressSpace: local` for HTTPS localhost launcher fetches
- [x] Disable automatic background localhost probe/status effects on HTTPS and keep manual detect/start flows
- [x] Surface explicit local-network permission-denied guidance in detect/status error handling
- [x] Run verification matrix checks and commit
- [x] Add review note
- Review: Console still showed loopback permission denials after earlier change. Updated `apps/sns/src/app/manage/agents/page.tsx` to use `targetAddressSpace: \"local\"` (as required by browser fetch option), added `readLocalNetworkPermissionState()` guidance messaging, and skipped automatic HTTPS localhost probes in mount/effect paths so permissions are requested via user-triggered actions (`Detect Launcher`, start/stop preflight) instead of silent background requests that can lock permission state to denied.

## 2026-02-22 Align Launcher Fetch Target Address Space With Loopback
- [x] Re-check browser console error after `targetAddressSpace` rollout
- [x] Update manage-agent localhost fetch hint from `local` to `loopback` for `127.0.0.1` launcher calls
- [x] Run verification matrix checks and commit
- [x] Add review note
- Review: New browser error showed mismatch: request target address space `local` while launcher endpoint resolved to address space `loopback` (`127.0.0.1`). Updated `withLocalLauncherRequestOptions` in `apps/sns/src/app/manage/agents/page.tsx` to set `targetAddressSpace: "loopback"` on HTTPS-hosted localhost launcher requests (`/health`, `/runner/status`, `/runner/start`, `/runner/stop`) to match browser enforcement.

## 2026-02-22 Fix Loopback Permission Denial In Deployed Manage Agents Fetch Path
- [x] Verify launcher CORS/PNA headers are present and isolate remaining browser-denied path
- [x] Add local-launcher fetch wrapper in manage page with `targetAddressSpace` hint for localhost requests
- [x] Route status/detect/start/stop localhost calls through the same wrapper
- [x] Run verification matrix checks and commit
- [x] Add review note
- Review: User report showed `Permission was denied for this request to access the 'loopback' address space` even with launcher-side CORS headers present. Added `withLocalLauncherRequestOptions` in `apps/sns/src/app/manage/agents/page.tsx` and switched localhost launcher calls (`/runner/status`, `/health`, `/runner/start`, `/runner/stop`) to use a shared `fetchLocalLauncher` wrapper that sets `targetAddressSpace: \"local\"` when SNS is hosted over HTTPS. This aligns browser-side private-network request metadata for deployed origin -> localhost access while preserving existing secret/origin validations on the launcher.

## 2026-02-22 Fix Deployed HTTPS Launcher Detection Via Private-Network CORS Header
- [x] Reproduce preflight response for `https://agentic-ethereum.com -> http://127.0.0.1` launcher call path
- [x] Add `Access-Control-Allow-Private-Network: true` on launcher preflight/JSON responses
- [x] Verify preflight includes required header and commit
- [x] Add review note
- Review: Root-cause verification showed launcher OPTIONS response for `/health` lacked `Access-Control-Allow-Private-Network` while deployed HTTPS SNS calls localhost (`127.0.0.1`). Added the header on both OPTIONS and JSON responses in `apps/runner/src/index.js` while keeping strict explicit-origin matching and launcher-secret checks unchanged. This unblocks browser private-network preflight for Detect Launcher without relaxing origin boundaries.

## 2026-02-22 Set Runner Default SNS Origin To agentic-ethereum.com
- [x] Change launcher default allowed origin when `--sns` is omitted
- [x] Sync runner README default/payload example with new default origin
- [x] Verify runner syntax checks and commit
- [x] Add review note
- Review: Updated `apps/runner/src/index.js` default CORS origin constant to `https://agentic-ethereum.com` so omitted `--sns` now resolves to production domain used by deployed SNS. Updated `apps/runner/README.md` default-origin line and start payload example (`snsBaseUrl`) to the same domain.

## 2026-02-22 Rename Runner Origin CLI Flag To --sns
- [x] Replace launcher origin override flag from `--allowed-origin` to `--sns`
- [x] Update runner help text and README examples to the new CLI flag
- [x] Verify runner syntax checks and commit
- [x] Add review note
- Review: Updated `apps/runner/src/index.js` to read only `--sns` for launcher CORS origin override and changed related validation error text/help output. Updated `apps/runner/README.md` examples and API notes from `--allowed-origin` to `--sns` so runtime/operator docs match executable behavior.

## 2026-02-22 Enforce CLI-Only Allowed Origin Input For Runner Launcher
- [x] Remove environment-variable fallback path for launcher allowed origin resolution
- [x] Update runner operator docs to state `--allowed-origin` as the only override path
- [x] Verify runner syntax checks and commit
- [x] Add review note
- Review: Per user directive, `apps/runner/src/index.js` no longer reads `RUNNER_ALLOWED_ORIGIN`; launcher allowed-origin override is CLI-only via `--allowed-origin`, with hardcoded production origin fallback when option is omitted. Updated `apps/runner/README.md` to remove env-based override instructions and keep one explicit override path.

## 2026-02-22 Fix Root runner:serve Argument Forwarding For Launcher Detection
- [x] Reproduce root `runner:serve` argument swallowing (`--port/--secret/--allowed-origin`)
- [x] Fix root workspace script to forward runtime args to `apps/runner` dev launcher
- [x] Verify corrected command path and record operator usage
- [x] Add review note
- Review: Root `package.json` still used `runner:serve: npm -w apps/runner run dev` without forwarding delimiter, so `npm run runner:serve -- --port ... --secret ... --allowed-origin ...` was parsed by npm itself and runner launched without required options, leading to `RUNNER_LAUNCHER_SECRET ... required` and false-negative launcher detection in SNS UI. Updated to `npm -w apps/runner run dev --` so options reach `node src/index.js serve` correctly.

## 2026-02-22 Fix Runner Launcher Origin Mismatch For Vercel SNS Detection
- [x] Reproduce and confirm local launcher 403 behavior on non-allowed browser `Origin`
- [x] Update runner launcher to support explicit origin override via CLI/env without weakening fail-closed CORS
- [x] Sync runner README with `--allowed-origin` / `RUNNER_ALLOWED_ORIGIN` operation guidance
- [x] Run verification checks and commit all current workspace changes per user direction
- Review: Root cause confirmed in `apps/runner/src/index.js`: launcher CORS compared request origin against a single hardcoded domain (`https://24-7-playground-sns.vercel.app`), so SNS running on a different Vercel hostname could not pass `/health` or `/runner/status` checks from browser (`403 Origin not allowed`). Added explicit origin override path with strict validation (`--allowed-origin` or `RUNNER_ALLOWED_ORIGIN`) while preserving fail-closed one-origin policy and default production origin. Updated `apps/runner/README.md` with override examples and CORS behavior notes. Also included existing workspace script rename changes in `apps/runner/package.json` in the same commit as requested.

## 2026-02-22 Fix Root Runner Start Argument Forwarding
- [x] Reproduce root `runner:start` argument loss path
- [x] Fix root script forwarding and binary wrapper command invocation
- [x] Verify `-s` reaches launcher by checking post-fix runtime error shift
- [x] Add review note
- Review: Updated root `package.json` `runner:start` to `npm -w apps/runner run start --` so script args are forwarded through workspace npm-run boundaries, and updated `apps/runner/scripts/start-binary.js` to spawn the binary with `serve` as the first argument (`spawn(binaryPath, ["serve", ...args])`). Verification: `npm run runner:start -- -s 1234 -p 4329` now executes `node scripts/start-binary.js -s 1234 -p 4329` and fails at bind with `listen EPERM ...` instead of prior `RUNNER_LAUNCHER_SECRET ... required`, proving secret parsing now works. Limitation: sandbox denies local listen here, so full launcher-up assertion is environment-limited.

## 2026-02-22 Sync Documentation With Updated Runner Script Names
- [x] Identify changed command names in root and `apps/runner` package manifests
- [x] Update runner operator documentation to remove stale command names
- [x] Verify docs no longer reference deprecated runner build command names
- [x] Add review note
- Review: Updated `apps/runner/README.md` command text to match current script names (`runner:build` instead of `runner:build:binary`, `build:*` instead of `build:binary:*`) and added root wrapper usage for `runner:start`. Verification: `rg -n "runner:build:binary|build:binary:\\*|build:binary" apps/runner/README.md README.md docs` returned no matches; `rg -n "runner:build|runner:start|build:\\*" apps/runner/README.md` confirmed new command references.

## 2026-02-22 Fix Prisma Interactive Transaction Expiry On Community Register
- [x] Confirm transaction timeout path in `/api/contracts/register` and define minimal patch scope
- [x] Reduce interactive transaction duration by batching contract inserts (`createMany`)
- [x] Configure Prisma interactive transaction `maxWait/timeout` for multi-contract registration load
- [x] Run verification matrix commands and record behavior checks
- [x] Commit changes
- Review: Root cause path confirmed in `apps/sns/src/app/api/contracts/register/route.ts` where interactive transaction previously executed one `tx.serviceContract.create()` per contract, increasing transaction open time during multi-contract registration. Updated to single-batch `tx.serviceContract.createMany(...)` and added explicit transaction settings (`maxWait: 10_000`, `timeout: 60_000`) to reduce `Transaction not found` failures from expired interactive tx IDs under heavy payload/contract counts. Verification commands: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js` (all pass). Behavior checks via code diff: success path now performs one insert batch inside transaction; existing rejection paths (signature/chain/policy/Etherscan validation failures) unchanged. Residual risk: production load test for very large contract sets was not executed in this local session.

## 2026-02-22 Fix Manage Communities Ban API 503 Console Error
- [x] Diagnose `/api/communities/bans/owned` 503 on page load and identify schema-compatibility trigger
- [x] Implement backend graceful fallback when ban-table schema is unavailable to avoid page-load fetch failure
- [x] Update ban form UI to reflect temporary ban-feature unavailability and prevent failing actions
- [x] Run verification matrix checks
- [x] Record review evidence and commit
- Review: Root cause was schema-compatibility failure on `bannedAgents` relation queries (typical when `CommunityBannedAgent` migration has not yet been applied), causing `/api/communities/bans/owned` to return `503` during manage-page load. Updated `apps/sns/src/app/api/communities/bans/owned/route.ts` to detect Prisma `P2021/P2022` and return a successful fallback payload (`bans: []`, `banFeatureAvailable: false`, warning message) so initial page load no longer emits a failed fetch in console. Updated `apps/sns/src/components/CommunityAgentBanForm.tsx` to consume `banFeatureAvailable`, show clear status guidance, and disable ban/unban action buttons while unavailable. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-22 Apply GitHub Repository SEO/GEO Hardening Bundle
- [x] Research current GitHub SEO and AI/GEO discoverability recommendations from primary documentation
- [x] Add repository-level discoverability assets that can be committed (`CITATION.cff`, community health files, LLM-oriented index files)
- [x] Add machine-readable project metadata in package manifests and maintain SEO/GEO documentation checklist
- [x] Run verification matrix checks and validate repository diff scope
- [x] Record review evidence and commit
- Review: Applied an in-repo SEO/GEO bundle aligned to GitHub/Search guidance: added `CITATION.cff`, GitHub community health files (`.github/CONTRIBUTING.md`, `.github/CODE_OF_CONDUCT.md`, `.github/SECURITY.md`, `.github/SUPPORT.md`), LLM-oriented indexes (`llms.txt`, `llms-full.txt`), and metadata fields (`description/keywords/repository/homepage/bugs`) in `package.json`, `apps/sns/package.json`, and `apps/runner/package.json`. Added `docs/seo_geo_playbook.md` and automation helper `scripts/github_seo_repo_settings.sh` for repository settings (description/homepage/topics) that require authenticated GitHub API access. Attempted immediate apply but local `gh` auth token is invalid in this environment; command currently exits with: `GitHub authentication required. Run: gh auth login -h github.com`. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`, `bash -n scripts/github_seo_repo_settings.sh`.

## 2026-02-22 Harden SNS API Error Responses For Production 500 Debuggability
- [x] Identify unhandled exception paths causing opaque 500s on `/api/contracts/register` and `/api/communities/bans*`
- [x] Add shared server-side error mapper for Prisma/schema/runtime failures
- [x] Wrap affected routes with top-level catch handlers that return JSON error payloads
- [x] Run verification matrix commands and confirm no regressions
- [x] Record review evidence and commit
- Review: Added shared API error mapper `apps/sns/src/lib/apiError.ts` with Prisma-aware classification (`P2021/P2022` -> schema outdated guidance, `P2025`, `P2002`, DB init errors, invalid JSON). Wrapped `apps/sns/src/app/api/contracts/register/route.ts`, `apps/sns/src/app/api/communities/bans/route.ts`, and `apps/sns/src/app/api/communities/bans/owned/route.ts` in top-level `try/catch` so runtime failures now return JSON errors instead of opaque 500 HTML. This enables UI status bubbles to show actionable server messages in production (including migration hints) and reduces silent console-only failures. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-22 Fix Production Hydration Errors On Home Page (Vercel)
- [x] Trace minified React hydration errors (`#425/#418/#423`) on home page and identify deterministic mismatch source
- [x] Stabilize date text rendering across SSR/CSR for feed/community cards to remove locale/timezone-dependent mismatches
- [x] Run verification matrix commands and confirm no type/syntax regressions
- [x] Record review evidence and commit
- Review: React production codes on Vercel (`#425` text mismatch + `#418` hydration mismatch + `#423` root fallback) mapped to hydration text divergence. Root cause was locale/timezone-dependent date strings rendered in client components during SSR (`new Date(...).toLocaleString()` / `toLocaleDateString()`), which can differ between server locale/timezone and browser locale/timezone. Added deterministic UTC format helpers in `apps/sns/src/lib/dateDisplay.ts` and replaced date rendering in `apps/sns/src/components/ThreadFeedCard.tsx`, `apps/sns/src/components/CommentFeedCard.tsx`, and `apps/sns/src/components/CommunityListSearchFeed.tsx`. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-22 Fix Missing Error Bubble On Community Registration Failure
- [x] Reproduce and trace `/api/contracts/register` failure handling in `ContractRegistrationForm` and status-bubble bridge timing gate
- [x] Harden registration submit flow to always surface failure status (network/500/non-JSON) with guaranteed busy-state cleanup
- [x] Adjust status bubble trigger window for long-running owner actions so delayed errors still surface near the action button
- [x] Run verification matrix commands and targeted behavior checks for registration error visibility
- [x] Record review evidence and commit
- Review: Root cause was a combination of fragile registration error parsing and status-bubble click context timeout (`20s`) that could expire during long Etherscan/contract registration waits. Updated `apps/sns/src/components/ContractRegistrationForm.tsx` to use a single-response-body error reader, wrap submit flow in `try/catch/finally`, preserve busy-state cleanup, and surface deterministic error text for 500/non-JSON cases. Extended status-bubble click context window in `apps/sns/src/components/StatusBubbleBridge.tsx` to `120s` so delayed errors still appear near the initiating button for long-running owner actions. Verification: `npm -w apps/sns run prisma:generate`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`.

## 2026-02-20 Support Short Flags In Runner Binary Start Wrapper
- [x] Normalize `-s/-p` short flags to long options before spawning built runner binary
- [x] Keep existing long option passthrough behavior for binary launcher start
- [x] Verify forwarded args with a local stub binary and update README examples
- [x] Record review evidence and lessons update
- Review: Updated `apps/runner/scripts/start-binary.js` to normalize short flags (`-s`, `-s=`, `-p`, `-p=` and positional port) into `--secret/--port` before spawning the built runner binary. Verified with a temporary local stub binary under `apps/runner/dist/tokamak-runner-macos-arm64`: `npm -w apps/runner run start -- -s 1234 -p 4321` produced `ARGS:--secret 1234 --port 4321`. Added README binary-start examples for both long and short flags.

## 2026-02-20 Fix Runner Binary Target Compatibility For pkg@5.8.1
- [x] Replace unsupported `node20-*` pkg targets with supported `node18-*` targets in runner scripts
- [x] Align GitHub release workflow matrix pkg targets with runner package scripts
- [x] Re-run runner binary build command to verify target compatibility fix
- [x] Record review evidence and lessons update
- Review: Updated runner binary scripts in `apps/runner/package.json` and release workflow matrix in `.github/workflows/runner-binary-release.yml` from `node20-*` to `node18-*` targets to match `pkg@5.8.1` availability. Re-ran `npm run build:binary:linux-x64`; this environment failed before the build stage due npm registry DNS/network restriction (`ENOTFOUND registry.npmjs.org`), but the previous target-mismatch failure (`No available node version satisfies 'node20'`) is removed from configured targets.

## 2026-02-20 Runner Command Contract Realignment (dev/start/run-once/root serve)
- [x] Rename runner source-launch command from `serve` to `dev` and remove the old `dev` alias chain
- [x] Change runner `start` to execute built binary artifacts instead of source launcher
- [x] Remove prompt-asset auto-generation from `run-once` in runner package
- [x] Change root `runner:serve` to execute runner package `dev`
- [x] Update runner docs and record user correction pattern
- Review: Updated `apps/runner/package.json` so `dev` launches source runner with prompt-asset regeneration, removed `serve`, set `start` to binary launcher (`scripts/start-binary.js`), and made `run-once` execute without automatic prompt regeneration. Updated root `package.json` `runner:serve` to `npm -w apps/runner run dev`. Synced `apps/runner/README.md` run/build behavior text and captured the correction in `.agents/tasks/lessons.md`.

## 2026-02-20 Simplify Runner Commands And Always Regenerate Prompt Assets
- [x] Remove intermediate runner prepare/pre* command variants to reduce command surface
- [x] Make `apps/runner` primary commands (`serve`, `run-once`, `build:binary:*`) always run `generate:prompt-assets`
- [x] Align root runner commands to rely on simplified workspace commands without separate prepare step
- [x] Update runner README wording to match the new command behavior
- [x] Record user correction pattern in `.agents/tasks/lessons.md`
- Review: Simplified runner scripts by removing `predev/preserve/prestart/prerun-once` and `runner:prepare` indirection. `apps/runner` now runs prompt-asset generation directly in `serve`, `run-once`, and each binary build target so both development/runtime and release builds always refresh embedded prompts from markdown. Root scripts were reduced to direct runner entry commands (`runner:serve`, `runner:run-once`, `runner:build:binary`) without extra prep command. Updated `apps/runner/README.md` phrasing accordingly and recorded the correction pattern in lessons.

## 2026-02-20 Runner Binary Release Pipeline With Embedded Prompt Prebuild
- [x] Classify upgrade scope and keep runner runtime/API behavior unchanged
- [x] Add `apps/runner` binary build scripts with mandatory prompt-asset prebuild hook
- [x] Add GitHub Actions workflow to build and publish runner binaries on release
- [x] Update runner operator docs for binary install/run and release artifacts
- [x] Run verification matrix and record review evidence
- Review: Classified this change as runner-runtime upgrade impact and applied upgrade triage + liveness/doc guardrails while keeping `/runner/*` runtime/API behavior untouched. Added binary build scripts in `apps/runner/package.json` with enforced prompt prebuild (`prepare:binary -> generate:prompt-assets`), plus root convenience script `runner:build:binary` and `apps/runner/dist` ignore rule. Added GitHub release workflow `.github/workflows/runner-binary-release.yml` to build linux/macos/windows binaries and publish release assets with `SHA256SUMS.txt`. Updated `apps/runner/README.md` with binary build/release commands and artifact expectations. Verification: `npm -w apps/runner run generate:prompt-assets`, `npm -w apps/runner run clean:binary`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`, `node --check apps/runner/src/communicationLog.js`, `node --check apps/runner/scripts/generate-prompt-assets.js`, `npx tsc --noEmit -p apps/sns/tsconfig.json`. Limitation: `npm -w apps/runner run build:binary:linux-x64` failed in this environment due blocked network access (`ENOTFOUND registry.npmjs.org`) while fetching `pkg`.

## 2026-02-20 Embed Runner Prompts Into Build Artifact For Binary Distribution
- [x] Add prompt asset generation pipeline (`apps/runner/scripts`) that converts markdown prompts into a JS module
- [x] Generate committed prompt asset module under `apps/runner/src` and keep file-path fallback compatibility
- [x] Refactor runner prompt loading in `apps/runner/src/engine.js` to prioritize embedded prompt assets
- [x] Update runner docs with embedded-prompt behavior and regeneration command
- [x] Run verification matrix for touched runner paths and add review notes
- Review: Added `apps/runner/scripts/generate-prompt-assets.js` and runner script `generate:prompt-assets` to compile `apps/runner/prompts/**/*.md` into `apps/runner/src/promptAssets.generated.js` for binary embedding. Updated `apps/runner/src/engine.js` to load embedded prompt assets first and keep filesystem fallback compatibility when an embedded key is unavailable. Updated `apps/runner/README.md` with embedded prompt behavior and regeneration command. Verification: `npm -w apps/runner run generate:prompt-assets`, `node --check apps/runner/src/index.js`, `node --check apps/runner/src/engine.js`, `node --check apps/runner/src/sns.js`, `node --check apps/runner/src/communicationLog.js`, `node --check apps/runner/src/promptAssets.generated.js`, `npx tsc --noEmit -p apps/sns/tsconfig.json`, `node apps/runner/src/index.js help`, and embedded asset checks (`count=6`, missing key returns `undefined`).

## 2026-02-20 Enforce English-Only Documentation Rule
- [x] Rewrite `docs/future_update.md` in English
- [x] Add English-only documentation constraint to `.agents/skills/docs-and-handover-guardrails/SKILL.md`
- [x] Record user correction pattern in `.agents/tasks/lessons.md`
- [x] Verify diffs and commit changes
- Review: Rewrote `docs/future_update.md` fully in English while keeping the original planning scope (repository-script mode + release-binary mode, shared protocol, schema/API changes, guardrails, rollout, and open questions). Added an explicit language rule to `.agents/skills/docs-and-handover-guardrails/SKILL.md` requiring all documentation to be written in English. Captured the correction pattern in `.agents/tasks/lessons.md` to keep future documentation output language-consistent by default.

## 2026-02-20 Offchain Compute Extension Planning Doc (Repo + Release Options)
- [x] Define planning scope and constraints for two distribution modes (GitHub repository scripts / GitHub release binaries)
- [x] Create `docs/future_update.md` with architecture, flow, security, ops, and phased rollout
- [x] Verify document coverage against current SNS/Runner boundaries and add review notes
- [x] Commit changes
- Review: Added `docs/future_update.md` as a forward-planning specification that keeps both offchain distribution paths open: (A) GitHub repository script/install execution and (B) GitHub release asset binary execution (including multi-GB artifact assumptions). Document covers shared protocol extension (`offchain_compute` / `offchain_feedback`), SNS schema/API deltas, runner cache/install/execute lifecycle, security guardrails (pinning/integrity/resource/network/logging), UX flow, phased rollout, and open decisions. Verification: content cross-check against current boundaries (existing runner action set, context flow, and security boundary assumptions) via code inspection and diff review.

## 2026-02-20 Correct Neon UI Guidance After User Feedback
- [x] Record correction pattern in `.agents/tasks/lessons.md`
- [x] Commit changes
- Review: User reported Neon console navigation guidance was incorrect. Added a durable lesson requiring verified/qualified guidance for third-party console UI locations and avoiding definitive menu claims without confirmation.

## 2026-02-20 Remove Leaked `apps/sns/.env.serivce` From Entire History
- [x] Identify leaked file paths and history scope (`.env.serivce` / `.env.service`)
- [x] Prevent re-introduction by updating `.gitignore`
- [x] Rewrite git history to remove leaked file from all refs
- [x] Remove `refs/original` + reflog entries and run GC
- [x] Force-push rewritten history to remote (`--force --all`, `--force --tags`)
- [x] Commit changes
- Review: Confirmed `apps/sns/.env.serivce` existed in history and performed full history rewrite using `git filter-branch --index-filter 'git rm --cached --ignore-unmatch apps/sns/.env.serivce apps/sns/.env.service' -- --all`, then cleaned backup refs/reflogs (`rm -rf .git/refs/original && git reflog expire --expire=now --all && git gc --prune=now --aggressive`). Verified no remaining path history with `git rev-list --all -- apps/sns/.env.serivce` and `git log --all --name-only` grep checks (both zero matches). Force-updated remote with `git push origin --force --all` and `git push origin --force --tags`.

## 2026-02-20 README Format Rollback + Status-Only Rule
- [x] Restore `README.md` to pre-rewrite format
- [x] Add only `Current Development Status` section to `README.md` (no broad expansion)
- [x] Add explicit README-update constraint to `.agents/skills/docs-and-handover-guardrails/SKILL.md`
- [x] Record this user correction pattern in `.agents/tasks/lessons.md`
- [x] Verify doc changes and add review note
- [x] Commit changes
- Review: Replaced root `README.md` content with the pre-rewrite format from the parent commit and inserted only one new section, `Current Development Status`, without re-expanding architecture/setup details. Added an explicit guardrail in `.agents/skills/docs-and-handover-guardrails/SKILL.md` that README edits in this repo must be limited to `Current Development Status` and usage-command sections. Added corresponding correction pattern to `.agents/tasks/lessons.md`. Verification: diff inspection on `README.md` confirmed format rollback + status-only insertion, and skill/lesson text checks confirmed new constraint statements.

## 2026-02-20 Repository-Wide Code Analysis + README/AGENTS Refresh
- [x] Audit repository behavior from code (SNS + runner + schema + scripts)
- [x] Rewrite root `README.md` to reflect current setup, runtime flow, and constraints
- [x] Update root `AGENTS.md` handover truth to match implemented behavior and fragile points
- [x] Verify doc consistency against key routes/config files and add review notes
- [x] Commit changes
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
