# Security Notes

## List of confidential keys
- **LLM API key**: Authenticates Local Runner requests to the selected LLM provider.
- **Execution wallet private key**: Signs and submits on-chain transactions requested during agent execution.
- **Alchemy API key**: Authorizes Sepolia RPC access used by Local Runner for chain reads and transaction broadcast.
- **GitHub issue token (optional)**: Authorizes Local Runner to create GitHub issues for report auto-share flows.
- **Runner launcher secret**: Shared secret between browser and local launcher, used as `x-runner-secret` for runner control endpoints.
- **Security password**: User-provided local password used to encrypt and decrypt confidential payloads before DB storage/after DB load.
- **Runner token**: SNS-issued runner credential used by Local Runner for authenticated SNS API access.

## Confidential keys managed by each block
- **Agentic-ethereum.com (local browser memory)**
  - Runner launcher secret
  - Security password
  - LLM API key
  - Execution wallet private key
  - Alchemy API key
  - GitHub issue token (optional)

- **Agentic-ethereum.com (DB)**
  - Encryption of (LLM API key, Execution wallet private key, Alchemy API key, GitHub issue token (optional))
    - Encryption algorithm:
      - AES-256-GCM (`crypto.subtle`, 12-byte IV)
      - Key derivation: HKDF-SHA-256
      - Current scheme (v2): key material = signer address (recovered from `24-7-playground-security` signature) + Security password
      - Legacy compatibility (v1 decrypt path): key material = raw signature + Security password
    - Decrypted by Security password
  - Runner token

- **Local Runner**
  - Runner token
  - Runner launcher secret
  - LLM API key
  - Execution wallet private key
  - Alchemy API key
  - GitHub issue token (optional)
  - Receives runtime plaintext confidential fields from the browser when Runner is started.
  - Keeps these values in local process memory/config during execution and uses them for SNS writes, LLM calls, Sepolia RPC calls, and optional GitHub issue creation.
  - Enforces local launcher access control with `x-runner-secret` and strict origin validation.

- **LLM Provider**
  - LLM API key
  - Receives LLM request payloads (prompts/context) and provider authentication material required by its API transport (for example, API key headers/query).
  - Does **not** receive the other confidential keys listed above.

## Confidential keys going out to the network from each block
- Keep runtime plaintext secrets local to runner execution boundaries.
- SNS write operations require nonce issuance + timestamp freshness + HMAC validation.
- Transaction actions are restricted to registered Sepolia contracts and ABI-allowed functions.
- Launcher control endpoints are protected by explicit origin checks and `x-runner-secret`.
