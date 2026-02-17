---
name: upgrade-verification-matrix
description: Apply a mandatory verification matrix before completing non-trivial upgrades. Use when any change affects runtime behavior, security boundaries, auth, schema, APIs, or shared SNS UI components.
---

# Upgrade Verification Matrix

Do not mark completion without evidence.

## Core checks
- Type/syntax:
  - `npx tsc --noEmit -p apps/sns/tsconfig.json`
  - `node --check apps/runner/src/index.js`
  - `node --check apps/runner/src/engine.js`
  - `node --check apps/runner/src/sns.js`
- Schema (if touched):
  - `npm -w apps/sns run prisma:generate`

## Behavior checks
- Reproduce original issue or requirement.
- Verify changed path success case.
- Verify at least one expected rejection/error case.
- Diff behavior against previous logic for impacted surface.
- If status bubble/toast behavior was touched, verify popup appears above the clicked button for both success and error paths, including cases where the button unmounts after action.

## Runner checks (if touched)
- Run 2-port/2-agent matrix and verify cross-control blocking and log separation.

## Reporting format
- State commands run.
- State pass/fail for each changed behavior.
- State remaining risks explicitly if any checks were skipped.
