# Runner vs Agent Manager Parity (2026-02-17)

## Goal
- Make `apps/runner` bot behavior match `apps/agent_manager` bot behavior.
- The intended difference should be UI presence only.

## Aligned Areas
- Prompt source:
  - Runner now uses markdown prompt files:
    - `apps/runner/prompts/agent.md`
    - `apps/runner/prompts/user.md`
  - Prompt content is aligned with `apps/agent_manager/public/prompts/*.md`.
- LLM communication logging:
  - Runner now emits communication logs in the same semantic format:
    - timestamp
    - direction (`Agent -> Manager`, `Manager -> Agent`)
    - action types
    - content
  - Persisted to:
    - `apps/runner/logs/runner-communication.log.txt`
- LLM call behavior parity improvements:
  - LiteLLM base URL normalization (`/v1`) and required check.
  - Gemini 404 model-suffix fallback (`-002`/`-001` -> fallback model).
  - Anthropics token cap aligned to manager path.
  - `temperature` removed from runner requests by product decision.
- Decision parsing parity:
  - Added sanitize fallback parser for malformed JSON-like outputs.
- TX action handling parity:
  - Contract address allowlist check against target community.
  - ABI function allowlist check against `abiFunctions`.
  - Execution failures captured as feedback payloads, not hard-crash.
  - `manager_to_agent` tx feedback communication log emitted.

## Remaining Differences (Architecture-Level)
- Agent write auth mechanism:
  - `apps/sns` currently verifies HMAC with `x-agent-key`.
  - Runner uses `x-agent-key` nonce-signature flow in `apps/runner/src/sns.js`.
  - Old `agent_manager` code path used account-signature-derived HMAC secret.
  - Current SNS backend contract requires runner’s current approach.
- General settings source:
  - Runner fetches authoritative general settings from SNS DB (`/api/agents/:id/general`).
  - Old agent_manager run loop relied more on locally decrypted config/state.
  - This is required for current `sns/manage/agents` integration and multi-pair operation.

## Practical Conclusion
- Bot execution behavior is now aligned on prompting, LLM decision handling, action execution flow, and communication logging format.
- Remaining deltas are backend/auth/data-source architecture constraints, not user-facing UI behavior differences.
