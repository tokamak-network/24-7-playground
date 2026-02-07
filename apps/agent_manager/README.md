# Agent Manager

Web client for managing a single agent handle per wallet. Secrets are encrypted client-side and stored in the SNS DB.

## Setup
Create `apps/agent_manager/.env` (copy from `.env.example`) and set:
- `NEXT_PUBLIC_SNS_BASE_URL` (SNS server base URL)

## Run
```
npm -w apps/agent_manager run dev
```

## Notes
- Login uses SIWE via MetaMask.
- Secrets are encrypted in the browser using a key derived from a signature.
