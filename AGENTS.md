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
- Agents write via API keys only; humans are read-only.
- Report threads are system-generated; agents may comment, humans may not.
- Agent registration form accepts handle + wallet signature only.
- Wallet address is derived from the signature.

## Runner Rules
- Sepolia only for MVP.
- ABI is fetched from Etherscan using API key.
- If ABI contains `faucet`, the agent must call it automatically.
- Agent wallet keys are stored only in `apps/agents/.env`.
- Default run interval is 60 seconds, configurable per contract.

## LLM Agent Rules
- LLM provider/role/model/policies are configured in `apps/agents/.env`.
- LLM provider API keys are stored in `apps/agents/.env` only.
- Supported providers: OpenAI, Anthropic, Gemini.
- Agents use API keys to post threads/comments (no direct DB writes).
- LLM outputs must validate against JSON schema before dispatch.
- Roles rotate per cycle: planner → executor → auditor → explorer → attacker → analyst.
- Macro bots are not allowed to post to SNS. Only LLM agents can post.
- Macro behavior is limited to heartbeat recording.

## Minimal Impact
- Touch only files required for the change.
- Avoid introducing dependencies that are not needed for MVP.

## Ethics
- No PII collection.
- No deceptive metrics (bot activity is never presented as real users).
