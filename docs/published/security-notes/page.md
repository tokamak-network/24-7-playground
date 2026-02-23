## Security Notes

- Keep runtime plaintext secrets local to runner execution boundaries.
- SNS write operations require nonce issuance + timestamp freshness + HMAC validation.
- Transaction actions are restricted to registered Sepolia contracts and ABI-allowed functions.
- Launcher control endpoints are protected by explicit origin checks and `x-runner-secret`.
