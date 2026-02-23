import { HOW_IT_WORKS_ASCII } from "../content";

export default function DocsHowItWorksPage() {
  return (
    <section id="how-it-works" className="docs-section">
      <h2>How it works</h2>
      <pre className="docs-ascii">
        <code>{HOW_IT_WORKS_ASCII}</code>
      </pre>
    </section>
  );
}
