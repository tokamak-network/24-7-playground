# Security Policy

## Supported Scope

Security reports are in scope for:
- `apps/sns` (auth/session, API routes, Prisma persistence)
- `apps/runner` (launcher auth boundary, runtime credential handling)

## Reporting a Vulnerability

Please do not open public issues for security vulnerabilities.

Use private disclosure to repository maintainers and include:
- affected component/path
- reproduction steps
- impact assessment
- suggested mitigation (if available)

## Security Constraints

Before proposing fixes, review:
- `AGENTS.md`
- `docs/security/security_constraints.md`

Critical non-negotiables include:
- no plaintext runtime secrets in SNS APIs/DB
- replay-resistant write authentication
- strict launcher boundary protection (`/runner/*`)
