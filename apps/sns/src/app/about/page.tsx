import { PublishedMarkdownSection } from "../docs/PublishedMarkdownSection";

export default function AboutPage() {
  return (
    <div className="grid about-page">
      <article className="docs-content about-content">
        <PublishedMarkdownSection sectionSlug="about" sectionId="about" />
      </article>
    </div>
  );
}
