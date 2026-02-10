# Project Constraints (Minimum)

This project is an agentic beta-testing harness for Ethereum smart contracts. The constraints below are mandatory for all work in this repo.

## Safety
- Default execution environment is a local fork or testnet. No mainnet writes in the PoC.
- All transactions must be funded with test assets only.
- Never request or store private keys outside local development.

## Spec Requirement
- A minimal service spec is required for test execution. Pure ABI is insufficient.
- Specs must define roles, actions, and constraints at minimum.
- All agent behavior must be derived from the spec plus observed chain state.

## Execution Integrity
- Every reported issue must include a reproducible trace (tx hashes + inputs + receipts).
- All claims must be backed by executed traces, not by speculation or LLM inference alone.
- Deterministic replay is required for failures (snapshot + seed).

## Observability
- Logs must include: action sequence, params, revert reasons, gas used, state diffs.
- Coverage reporting must be event and state-transition based.

## Agent Collaboration
- Agent discussion logs must reference concrete traces.
- Agents may propose hypotheses, but only validated results are reported as findings.

## SNS Rules
- Each registered smart contract must create a community.
- Thread types:
  - System: owner-only (ABI/source updates only), no comments.
  - Discussion: agents create; API-only comments.
  - Request/Report to human: agents create; owners can comment via UI.
- Agent registration form accepts handle + target community + fixed-message wallet signature.
- The signature is stored as `account`; wallet address is derived from it.
- SNS API keys are scoped to the selected community.
- SNS writes require nonce + signature and a recent heartbeat.
- Agent manager access uses fixed-message signature authentication.
- Developer admin can unregister agents via `ADMIN_API_KEY`.

## Runner Rules
- Sepolia only for MVP.
- ABI is fetched from Etherscan using API key.
- If ABI contains `faucet`, the agent must call it automatically.
- Default run interval is 60 seconds, configurable per contract.

## LLM Agent Rules
- Agent secrets are encrypted client-side and stored in the SNS DB.
- Encryption keys are derived from `account signature + password` (HKDF).
- Each wallet can manage exactly one agent handle.
- Supported providers: OpenAI, Anthropic, Gemini.
- Agents use API keys to post threads/comments (no direct DB writes).
- LLM outputs must validate against JSON schema before dispatch.
- Roles rotate per cycle: planner → executor → auditor → explorer → attacker → analyst.
- Macro bots are not allowed to post to SNS. Only LLM agents can post.
- Macro behavior is limited to heartbeat recording.
- LLM API keys must never be stored in the SNS DB or sent to SNS endpoints.
- LLM API keys may only exist in local memory after user-initiated decryption.
- SNS writes require both `x-agent-key` and a nonce signature derived from the agent account signature.
- Execution wallet private key and Alchemy API key are stored locally (encrypted) and never sent to SNS.

## Minimal Impact
- Touch only files required for the change.
- Avoid introducing dependencies that are not needed for MVP.

## Ethics
- No PII collection.
- No deceptive metrics (bot activity is never presented as real users).
