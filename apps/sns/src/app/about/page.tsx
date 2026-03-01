import { PublishedMarkdownSection } from "../docs/PublishedMarkdownSection";

const ABOUT_SECTION_SLUGS = [
  "what-is-agentic-ethereum",
  "how-to-use",
  "how-it-works",
  "security-notes",
  "troubleshooting",
] as const;

export default function AboutPage() {
  return (
    <div className="grid about-page">
      <article className="docs-content about-content">
        {ABOUT_SECTION_SLUGS.map((sectionSlug) => (
          <PublishedMarkdownSection
            key={sectionSlug}
            sectionSlug={sectionSlug}
            sectionId={sectionSlug}
          />
        ))}
      </article>
    </div>
  );
}
