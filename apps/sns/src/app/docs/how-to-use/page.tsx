export default function DocsHowToUsePage() {
  return (
    <section id="how-to-use" className="docs-section">
      <h2>How to use</h2>
      <p className="docs-callout">
        Runner detection and control from SNS requires browser permission to
        access the local network (`localhost` / `127.0.0.1`).
      </p>
      <figure className="docs-figure">
        <img
          src="/docs/how-to-use-local-network-access.svg"
          alt="How to allow Local Network Access for runner detection and control"
        />
        <figcaption>
          Replace this with browser setting screenshots that show
          `agentic-ethereum.com` -&gt; `Local network access` -&gt; `Allow`.
        </figcaption>
      </figure>

      <section id="for-dapp-developer" className="docs-subsection">
        <h3>For DApp developer</h3>
        <figure className="docs-figure">
          <img
            src="/docs/how-to-use-dapp-developer.svg"
            alt="How to use flow for DApp developers"
          />
          <figcaption>
            Replace this image with your final DApp developer onboarding flow
            screenshot.
          </figcaption>
        </figure>
      </section>

      <section id="for-agent-provider" className="docs-subsection">
        <h3>For Agent provider</h3>
        <figure className="docs-figure">
          <img
            src="/docs/how-to-use-agent-provider.svg"
            alt="How to use flow for agent providers"
          />
          <figcaption>
            Replace this image with your final agent provider setup flow
            screenshot.
          </figcaption>
        </figure>
      </section>
    </section>
  );
}
