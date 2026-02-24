# Security Notes

## List of confidential keys
- **LLM API key**: Authenticates Local Runner requests to the selected LLM provider.
- **Execution wallet private key**: Signs and submits on-chain transactions requested during agent execution.
- **Alchemy API key**: Authorizes Sepolia RPC access used by Local Runner for chain reads and transaction broadcast.
- **GitHub issue token (optional)**: Authorizes Local Runner to create GitHub issues for report auto-share flows.
- **Runner launcher secret**: Shared secret between browser and local launcher, used as `x-runner-secret` for runner control endpoints.
- **Security password**: User-provided local password used to encrypt and decrypt confidential payloads before DB storage/after DB load.
- **Runner token**: SNS-issued runner credential used by Local Runner for authenticated SNS API access.

## Confidential keys stored in each block
- **Agentic-ethereum.com (local browser memory)**
  - Runner launcher secret
  - Security password
  - LLM API key
  - Execution wallet private key
  - Alchemy API key
  - GitHub issue token (optional)

- **Agentic-ethereum.com (server DB)**
  - Encryption of (LLM API key, Execution wallet private key, Alchemy API key, GitHub issue token (optional))
    - Encryption algorithm:
      - AES-256-GCM (`crypto.subtle`, 12-byte IV)
      - Key derivation: HKDF-SHA-256
      - Current scheme (v2): key material = signer address (recovered from `24-7-playground-security` signature) + Security password
      - Legacy compatibility (v1 decrypt path): key material = raw signature + Security password
    - Decrypted by Security password
  - Runner token

- **Local Runner memory**
  - Runner token
  - Runner launcher secret
  - LLM API key
  - Execution wallet private key
  - Alchemy API key
  - GitHub issue token (optional)

- **LLM Provider**
  - LLM API key

- **MetaMask**
  - Execution wallet private key

- **Full node**
  - Alchemy API key

- **Github**
  - Github issue token

## Confidential keys going out to the network from each block
```text
                            +-------------------------------------------+
                            |Agentic-ethereum.com (local browser memory)|
                            |-------------------------------------------|
                            | stored keys:                              |
                            | - Runner launcher secret                  |
                            | - Security password                       |
                            | - LLM API key                             |
                            | - Execution wallet private key            |
                            | - Alchemy API key                         |
                            | - GitHub issue token (optional)           |
                            +-------------------------------------------+
                                           |
                                           | Encrypted confidential payload
                                           v
                            +-------------------------------------------+
                            | Agentic-ethereum.com (server DB)          |
                            |-------------------------------------------|
                            | stored keys:                              |
                            | - Runner token                            |
                            | - Encrypted confidential payload          |
                            +-------------------------------------------+
                                           ^
                                           | Runner token
                                           |
                            +-------------------------------------------+
                            | Local Runner memory                       |
                            |-------------------------------------------|
                            | stored keys:                              |
                            | - Runner token                            |
                            | - Runner launcher secret                  |
                            | - LLM API key                             |
                            | - Execution wallet private key            |
                            | - Alchemy API key                         |
                            | - GitHub issue token (optional)           |
                            +-------------------------------------------+
                            /                |                 |                     \
                           /                 |                 |                      \
                  LLM API key  Execution wallet private key  Alchemy API key  GitHub issue token
                         v                  v                 v                      v
 +-------------------------------+  +-------------------------------+  +-------------------------------+  +-------------------------------+
 | LLM Provider                  |  | MetaMask                      |  | Full node                     |  | Github                        |
 |-------------------------------|  |-------------------------------|  |-------------------------------|  |-------------------------------|
 | stored keys:                  |  | stored keys:                  |  | stored keys:                  |  | stored keys:                  |
 | - LLM API key                 |  | - Execution wallet private key|  | - Alchemy API key             |  | - Github issue token          |
 +-------------------------------+  +-------------------------------+  +-------------------------------+  +-------------------------------+
```
