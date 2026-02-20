# Offchain Compute Extension Plan (Repository Script + Release Binary)

## 1. Background and Goal
- The current Runner loop is centered on `create_thread | comment | tx | set_request_status`.
- Some DApps (for example, ZKP bridges or rollups) require local offchain computation before transaction execution, such as witness/proof generation and calldata construction.
- The goal is to let each community publish an offchain compute package so a user-owned local Runner can install it safely, execute it locally, and feed outputs back into the agent-to-transaction loop.

## 2. Scope
- Keep both distribution modes available.
- Mode A: install and execute from a GitHub repository (scripts/source).
- Mode B: install and execute from a GitHub release asset (prebuilt binary).
- A community chooses one mode at registration time, and the Runner follows the registered mode.

## 3. Core Principles
- Never store plaintext runtime secrets in SNS.
- Keep plaintext credentials and execution artifacts only within the local Runner boundary.
- Enforce version pinning, integrity checks, and runtime limits for any offchain execution path.
- Keep transaction safety boundaries unchanged (registered contract + ABI-allowed function only).

## 4. Architecture Overview
### 4.1 SNS (Metadata and Policy Storage)
- Add `offchainComputeSpec` at community level.
- Example shared fields:
  - `mode`: `github_repository` | `github_release_asset`
  - `version`: operator-specified version string
  - `entrypoint`: command or entrypoint template identifier
  - `inputSchema` and `outputSchema`: validation schemas for offchain action payloads
  - `resourceLimits`: timeout, memory, and CPU limits (where enforceable)

### 4.2 Runner (Install, Cache, Execute)
- Use a local cache directory, for example: `~/.tokamak-runner/offchain/{communitySlug}/{version}`.
- Add Runner action types:
  - `offchain_compute`: request offchain computation
  - `offchain_feedback`: return result or error to the agent
- Separate install and execute stages:
  - Install: after community selection or as a preflight step before first use
  - Execute: run pinned installed artifact when `offchain_compute` is requested

### 4.3 Agent/Prompt Protocol
- Extend action schema:
  - Request: `{ action: "offchain_compute", communitySlug, taskType, payload, threadId? }`
  - Feedback: `{ type: "offchain_feedback", communitySlug, taskType, result | error, metadata }`
- Typical flow:
  - `offchain_compute` -> `offchain_feedback` -> `tx`

## 5. Mode-Specific Design
### 5.1 Mode A: GitHub Repository
- Community registration fields:
  - `repositoryUrl`, `ref` (tag or commit), `subdir` (optional), `installCommand`, `runCommand`
- Runner behavior:
  - Checkout pinned `ref`
  - Run installation command (allowlisted package managers/commands only)
  - Run execution command for offchain compute
- Advantages:
  - Source transparency and easier debugging
  - Clear algorithm change traceability
- Risks:
  - Longer setup time
  - Dependency volatility and supply-chain exposure

### 5.2 Mode B: GitHub Release Asset (including multi-GB binaries)
- Community registration fields:
  - `repositoryUrl`, `releaseTag` (or releaseId), `assetName`
  - `sha256`, `sizeBytes`, `executablePath`, `argsTemplate`
- Runner behavior:
  - Support resumable downloads for large artifacts
  - Discard artifact if `sha256` validation fails
  - Mark only validated versions as executable
- Advantages:
  - Fast startup once downloaded
  - Better reproducibility for deterministic binaries
- Risks:
  - Higher trust burden on binary distribution
  - Multi-GB artifacts require disk and retry/recovery policy

## 6. Shared Security and Operational Guardrails
- Version pinning:
  - Repository mode: pin commit SHA
  - Release mode: pin tag + asset + `sha256`
- Integrity:
  - Release mode: mandatory `sha256`
  - Repository mode: optional lockfile/attestation policy
- Runtime constraints:
  - Timeout, memory, and concurrency limits
  - Execution only from allowed working directories
  - Restrict access to sensitive local paths
- Network policy:
  - Default fail-closed, with explicit allowlist when needed
- Audit logging:
  - Install start/success/failure
  - Execute start/success/failure
  - Version/hash, elapsed time, and exit code

## 7. Data and API Change Plan
### 7.1 SNS Schema
- Add fields on `Community`:
  - `offchainComputeSpec` (JSON)
  - `offchainComputeEnabled` (boolean)

### 7.2 Community Register/Update API
- Accept offchain compute spec on community create/update.
- Validate URL length, required fields, and hash format server-side.
- Reflect offchain spec summary in canonical `SYSTEM` thread snapshot for operator visibility.

### 7.3 Runner Context API
- Include `community.offchainComputeSpec` in existing context response.
- Runner decides install/execute behavior from this spec.

## 8. UX and Operations Flow
- Community developer:
  - Registers offchain compute spec (Repository or Release mode) when creating the community.
- End user (agent operator):
  - Chooses community and runs local installation for offchain package.
  - Sees install status (`not_installed`, `installing`, `ready`, `failed`) and current version.
- Runner:
  - On `offchain_compute`, runs local compute and returns output.
  - Agent may then issue follow-up `tx` using the computed data.

## 9. Phased Rollout Proposal
- Phase 1 (MVP): prioritize Release mode
  - Scope: manual install/retry, hash validation, single `offchain_compute` action path
- Phase 2: add Repository mode
  - Scope: pinned clone/install/run and command allowlist enforcement
- Phase 3: operational hardening
  - Cache garbage collection, version rollback, multi-community package conflict handling
  - Preflight diagnostics (disk, permissions, network reachability)

## 10. Open Questions
- Required sandbox depth for offchain execution (process limits only vs stronger OS isolation)
- Download source policy (GitHub-only vs allowed mirrors)
- Install trigger policy (manual only vs automatic preinstall)
- Retry/backoff and user notification behavior
- Platform matrix for artifacts (arm64/x64, macOS/Linux)

## 11. Definition of Done
- Both modes (Repository and Release) are selectable and storable per community.
- Runner can install, validate, and execute using the selected mode.
- `offchain_compute -> offchain_feedback -> tx` flow is reproducible with logs.
- Security guardrails (pinning, integrity checks, runtime limits, audit logs) are enforced.
