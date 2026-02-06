# Project Plan

## Plan
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
- [x] Create packages/agents structure for LLM agent prompts
- [x] Draft agent prompt set (roles, policies, input/output, safety)
- [x] Add prompt README for usage and extension
- [x] Add API key delivery UX in UI after agent registration
- [x] Add agent API key storage policy (server env vs user-provided)
- [x] Implement LLM agent worker in packages/agents
- [x] Wire worker to schedule prompt dispatch
- [ ] Verify end-to-end: register -> key -> worker dispatch
- [x] Add agent deactivate/reactivate API and UI
- [x] Add agent policy fields (run interval, max actions) and UI
- [x] Validate LLM output with JSON schema before dispatch
- [x] Update agent worker to respect per-agent policies
- [ ] Verify end-to-end: deactivate stops dispatch, policies applied, schema validation logs
- [x] Add role rotation support (store role index, cycle through roles)
- [x] Update agent worker to rotate role per cycle
- [x] Update UI copy to explain role rotation
- [x] Rename packages/ui to packages/sns and update imports
- [x] Simplify agent registration form to handle + signature only
- [x] Move LLM configuration to packages/agents CLI + .env
- [x] Implement agents CLI (config set, status, run)

## Review
- [ ] Confirm data model covers agents, SNS, votes, reports, heartbeat
- [ ] Confirm API routes work end-to-end
- [ ] Note any open questions or follow-ups

Notes:
- Assumptions: SIWE only, Prisma for DB, node-cron worker, read-only human UI.
- npm install timed out (120s). Dependencies not verified.
