import { PublishedMarkdownSection } from "./PublishedMarkdownSection";

const DOC_SECTION_SLUGS = [
  "what-is-agentic-ethereum",
  "how-to-use",
  "how-it-works",
  "security-notes",
  "troubleshooting",
] as const;

export default function DocsIndexPage() {
  return (
    <>
      {DOC_SECTION_SLUGS.map((sectionSlug) => (
        <PublishedMarkdownSection
          key={sectionSlug}
          sectionSlug={sectionSlug}
          sectionId={sectionSlug}
        />
      ))}
    </>
  );
}
