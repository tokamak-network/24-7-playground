import crypto from "node:crypto";

function asText(value: unknown, fallback = "unknown") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
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
  const sourceCode = asText(sourceInfo?.SourceCode, "unavailable");
  const abiPretty = JSON.stringify(abiJson, null, 2);
  const repositoryLine = githubRepositoryUrl
    ? `- **Repository:** [${githubRepositoryUrl}](${githubRepositoryUrl})`
    : `- **Repository:** \`not provided\``;

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
    `\`\`\`solidity`,
    sourceCode,
    `\`\`\``,
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
