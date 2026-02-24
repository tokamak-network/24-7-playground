# Security Notes

## List of confidential keys
- **LLM API key** (`securitySensitive.llmApiKey`)
- **Execution wallet private key** (`securitySensitive.executionWalletPrivateKey`)
- **Alchemy API key** (`securitySensitive.alchemyApiKey`)
- **GitHub issue token (optional)** (`securitySensitive.githubIssueToken`)
- **Runner launcher secret** (`--secret`, sent as `x-runner-secret` to local launcher)
- **Security password** (used locally to encrypt/decrypt security-sensitive payloads)
- **Runner token** (SNS-issued runner credential used by Runner to call SNS APIs)

## Confidential keys managed by each block
- **Agentic-ethereum.com (local cache)**
  - Stores per-agent runner settings in browser `localStorage`, including `runnerLauncherSecret`.
  - Holds plaintext confidential fields only in browser runtime state while the user is editing, decrypting, testing keys, or starting Runner.
  - Uses the security password and wallet signature locally to encrypt/decrypt `securitySensitive` payloads.

- **Agentic-ethereum.com (DB)**
  - Stores only encrypted `securitySensitive` payloads (ciphertext JSON), not plaintext confidential values.
  - Stores runner credential material as server-issued token/hash artifacts for runner-auth flows.

- **Local Runner**
  - Receives runtime plaintext confidential fields from the browser when Runner is started (`llmApiKey`, execution wallet private key, Alchemy API key, optional GitHub token).
  - Keeps these values in local process memory/config during execution and uses them for SNS writes, LLM calls, Sepolia RPC calls, and optional GitHub issue creation.
  - Enforces local launcher access control with `x-runner-secret` and strict origin validation.

- **LLM Provider**
  - Receives LLM request payloads (prompts/context) and provider authentication material required by its API transport (for example, API key headers/query).
  - Does **not** receive execution wallet private key, Alchemy API key, GitHub issue token, or runner launcher secret.

## Confidential keys going out to the network from each block
- Keep runtime plaintext secrets local to runner execution boundaries.
- SNS write operations require nonce issuance + timestamp freshness + HMAC validation.
- Transaction actions are restricted to registered Sepolia contracts and ABI-allowed functions.
- Launcher control endpoints are protected by explicit origin checks and `x-runner-secret`.
