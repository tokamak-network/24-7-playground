import crypto from "node:crypto";

function asText(value: unknown, fallback = "unknown") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function normalizeSourceWrapper(rawSource: string) {
  const trimmed = rawSource.trim();
  if (trimmed.startsWith("{{") && trimmed.endsWith("}}")) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSourceBundle(rawSource: unknown, contractName: string) {
  const sourceText = String(rawSource ?? "").trim();
  if (!sourceText) {
    return { sourceFiles: [], libraries: null as Record<string, unknown> | null };
  }

  const wrappedCandidate = normalizeSourceWrapper(sourceText);
  const parseCandidates =
    wrappedCandidate === sourceText
      ? [sourceText]
      : [sourceText, wrappedCandidate];

  for (const candidate of parseCandidates) {
    try {
      const parsed = JSON.parse(candidate) as {
        sources?: Record<string, { content?: unknown } | string> | null;
        settings?: {
          libraries?: unknown;
        } | null;
        libraries?: unknown;
      };

      if (!parsed?.sources || typeof parsed.sources !== "object") {
        continue;
      }

      const files = Object.entries(parsed.sources)
        .map(([path, entry]) => {
          if (typeof entry === "string") {
            return { path, content: entry };
          }

          const content = String(entry?.content ?? "").trim();
          if (!content) {
            return null;
          }
          return { path, content };
        })
        .filter((file): file is { path: string; content: string } => file !== null);

      const librariesCandidate = parsed.settings?.libraries ?? parsed.libraries;
      const libraries = isRecord(librariesCandidate) ? librariesCandidate : null;

      if (files.length > 0) {
        return { sourceFiles: files, libraries };
      }
    } catch {
      // Raw source code is also a valid format from Etherscan.
    }
  }

  return {
    sourceFiles: [{ path: `${contractName || "Contract"}.sol`, content: sourceText }],
    libraries: null as Record<string, unknown> | null,
  };
}

export function buildSystemBody(input: {
  name: string;
  address: string;
  chain: string;
  sourceInfo: any;
  abiJson: unknown;
  githubRepositoryUrl?: string | null;
}) {
  const { name, address, chain, sourceInfo, abiJson, githubRepositoryUrl } = input;
  const { sourceFiles, libraries } = parseSourceBundle(
    sourceInfo?.SourceCode,
    asText(sourceInfo?.ContractName, "Contract"),
  );
  const abiPretty = JSON.stringify(abiJson, null, 2);
  const repositoryLine = githubRepositoryUrl
    ? `- **Repository:** [${githubRepositoryUrl}](${githubRepositoryUrl})`
    : `- **Repository:** \`not provided\``;
  const sourceSection =
    sourceFiles.length > 0
      ? sourceFiles.flatMap(({ path, content }) => [
          `### \`${path}\``,
          `\`\`\`solidity`,
          content,
          `\`\`\``,
          ``,
        ])
      : [`\`unavailable\``, ``];
  const librariesPretty = libraries ? JSON.stringify(libraries, null, 2) : "";

  return [
    `# Contract Information`,
    ``,
    `## Summary`,
    `- **Community Contract:** \`${asText(name)}\``,
    `- **Address:** \`${asText(address)}\``,
    `- **Chain:** \`${asText(chain)}\``,
    repositoryLine,
    ``,
    `## Build Metadata`,
    `- **Contract Name:** \`${asText(sourceInfo?.ContractName)}\``,
    `- **Compiler:** \`${asText(sourceInfo?.CompilerVersion)}\``,
    `- **Optimization:** \`${asText(sourceInfo?.OptimizationUsed)}\``,
    `- **Runs:** \`${asText(sourceInfo?.Runs)}\``,
    `- **EVM Version:** \`${asText(sourceInfo?.EVMVersion)}\``,
    `- **License:** \`${asText(sourceInfo?.LicenseType)}\``,
    `- **Proxy:** \`${asText(sourceInfo?.Proxy)}\``,
    `- **Implementation:** \`${asText(sourceInfo?.Implementation)}\``,
    ``,
    `## Source Code`,
    ...sourceSection,
    `## Libraries`,
    libraries
      ? [`\`\`\`json`, librariesPretty, `\`\`\``, ``].join("\n")
      : `\`not specified\``,
    ``,
    `## ABI`,
    `\`\`\`json`,
    abiPretty,
    `\`\`\``,
  ].join("\n");
}

export function hashSystemBody(body: string) {
  return crypto.createHash("sha256").update(body).digest("hex");
}
