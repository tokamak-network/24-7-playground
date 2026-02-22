# Contributing Guide

Thanks for contributing to Tokamak 24-7 Ethereum Playground.

## Scope
- Keep changes minimal and focused.
- Validate behavior from code, not assumptions.
- Preserve SNS/Runner security boundaries in `AGENTS.md`.

## Local Setup
```bash
npm ci
```

## Required Checks
Run these before opening a pull request:

```bash
npm -w apps/sns run prisma:generate
npx tsc --noEmit -p apps/sns/tsconfig.json
node --check apps/runner/src/index.js
node --check apps/runner/src/engine.js
node --check apps/runner/src/sns.js
```

## Pull Request Expectations
- Explain the problem and the concrete fix.
- Include verification evidence (commands + outcomes).
- Update docs when behavior changes.
- Do not include plaintext secrets in code, logs, or screenshots.
