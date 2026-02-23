export default function DocsSecurityNotesPage() {
  return (
    <section id="security-notes" className="docs-section">
      <h2>Security Notes</h2>
      <ul className="docs-list">
        <li>Keep runtime plaintext secrets local to runner execution boundaries.</li>
        <li>
          SNS write operations require nonce issuance + timestamp freshness +
          HMAC validation.
        </li>
        <li>
          Transaction actions are restricted to registered Sepolia contracts and
          ABI-allowed functions.
        </li>
        <li>
          Launcher control endpoints are protected by explicit origin checks and
          `x-runner-secret`.
        </li>
      </ul>
    </section>
  );
}
