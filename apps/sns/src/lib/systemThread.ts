import crypto from "node:crypto";
import { prisma } from "src/db";

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

function asJson(value: unknown, fallback = "{}") {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return fallback;
  }
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

export type SystemThreadContractInput = {
  id?: string;
  name: string;
  address: string;
  chain: string;
  sourceInfo: any;
  abiJson: unknown;
  faucetFunction?: string | null;
  updated?: boolean;
};

export type SystemSnapshotType = "REGISTRATION" | "UPDATE" | "BACKFILL";

export function buildSystemBody(input: {
  name: string;
  address: string;
  chain: string;
  serviceDescription?: string | null;
  sourceInfo: any;
  abiJson: unknown;
  githubRepositoryUrl?: string | null;
}) {
  const {
    name,
    address,
    chain,
    serviceDescription,
    sourceInfo,
    abiJson,
    githubRepositoryUrl,
  } = input;
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
    `- **Description:** \`${asText(serviceDescription, "not provided")}\``,
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

export function buildSystemSnapshotBody(input: {
  snapshotType: SystemSnapshotType;
  serviceName: string;
  serviceDescription?: string | null;
  githubRepositoryUrl?: string | null;
  contracts: SystemThreadContractInput[];
}) {
  const {
    snapshotType,
    serviceName,
    serviceDescription,
    githubRepositoryUrl,
    contracts,
  } = input;
  const normalizedContracts = contracts.map((contract) => ({
    ...contract,
    name: asText(contract.name),
    address: asText(contract.address),
    chain: asText(contract.chain),
    faucetFunction: String(contract.faucetFunction || "").trim() || null,
    updated: Boolean(contract.updated),
  }));
  const chainSet = Array.from(
    new Set(normalizedContracts.map((contract) => contract.chain))
  );
  const updatedCount = normalizedContracts.filter((contract) => contract.updated).length;
  const repositoryLine = githubRepositoryUrl
    ? `[${githubRepositoryUrl}](${githubRepositoryUrl})`
    : "`not provided`";

  const contractIndexRows = normalizedContracts.length
    ? normalizedContracts.map((contract, index) =>
        `| ${index + 1} | ${contract.name} | \`${contract.address}\` | ${contract.chain} | ${contract.updated ? "yes" : "no"} |`
      )
    : ["| - | - | - | - | - |"];

  const detailSections = normalizedContracts.flatMap((contract, index) => {
    const { sourceFiles, libraries } = parseSourceBundle(
      contract.sourceInfo?.SourceCode,
      asText(contract.sourceInfo?.ContractName, contract.name),
    );
    const sourceSection =
      sourceFiles.length > 0
        ? sourceFiles.flatMap(({ path, content }) => [
            `##### \`${path}\``,
            "```solidity",
            content,
            "```",
            "",
          ])
        : ["`unavailable`", ""];
    const librariesSection = libraries
      ? ["```json", asJson(libraries), "```", ""]
      : ["`not specified`", ""];

    return [
      `### ${index + 1}. ${contract.name}`,
      `- **Address:** \`${contract.address}\``,
      `- **Chain:** \`${contract.chain}\``,
      `- **Included as updated:** \`${contract.updated ? "yes" : "no"}\``,
      `- **Faucet Function:** \`${contract.faucetFunction || "not detected"}\``,
      "",
      "#### Build Metadata",
      `- **Contract Name:** \`${asText(contract.sourceInfo?.ContractName, contract.name)}\``,
      `- **Compiler:** \`${asText(contract.sourceInfo?.CompilerVersion)}\``,
      `- **Optimization:** \`${asText(contract.sourceInfo?.OptimizationUsed)}\``,
      `- **Runs:** \`${asText(contract.sourceInfo?.Runs)}\``,
      `- **EVM Version:** \`${asText(contract.sourceInfo?.EVMVersion)}\``,
      `- **License:** \`${asText(contract.sourceInfo?.LicenseType)}\``,
      `- **Proxy:** \`${asText(contract.sourceInfo?.Proxy)}\``,
      `- **Implementation:** \`${asText(contract.sourceInfo?.Implementation)}\``,
      "",
      "#### Source Code",
      ...sourceSection,
      "#### Libraries",
      ...librariesSection,
      "#### ABI",
      "```json",
      asJson(contract.abiJson, "[]"),
      "```",
      "",
    ];
  });

  return [
    "# Contract Registry Snapshot",
    "",
    "## Summary",
    `- **Snapshot Type:** \`${snapshotType}\``,
    `- **Service Name:** \`${asText(serviceName)}\``,
    `- **Description:** \`${asText(serviceDescription, "not provided")}\``,
    `- **Repository:** ${repositoryLine}`,
    `- **Total Contracts:** \`${normalizedContracts.length}\``,
    `- **Updated Contracts:** \`${updatedCount}\``,
    `- **Chains:** \`${chainSet.join(", ") || "unknown"}\``,
    `- **Generated At:** \`${new Date().toISOString()}\``,
    "",
    "## Contract Index",
    "| # | Contract | Address | Chain | Updated |",
    "| --- | --- | --- | --- | --- |",
    ...contractIndexRows,
    "",
    "## Contract Details",
    ...detailSections,
  ].join("\n");
}

export function hashSystemBody(body: string) {
  return crypto.createHash("sha256").update(body).digest("hex");
}

export async function upsertCanonicalSystemThread(input: {
  communityId: string;
  serviceName: string;
  serviceDescription?: string | null;
  githubRepositoryUrl?: string | null;
  contracts: SystemThreadContractInput[];
  snapshotType: SystemSnapshotType;
  title: string;
  commentBody?: string | null;
}) {
  const {
    communityId,
    serviceName,
    serviceDescription,
    githubRepositoryUrl,
    contracts,
    snapshotType,
    title,
    commentBody,
  } = input;
  const snapshotBody = buildSystemSnapshotBody({
    snapshotType,
    serviceName,
    serviceDescription,
    githubRepositoryUrl,
    contracts,
  });
  const bodyHash = hashSystemBody(snapshotBody);

  const existingSystemThreads = await prisma.thread.findMany({
    where: { communityId, type: "SYSTEM" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  let canonicalThreadId = existingSystemThreads[0]?.id || "";
  let created = false;

  if (!canonicalThreadId) {
    const createdThread = await prisma.thread.create({
      data: {
        communityId,
        title,
        body: snapshotBody,
        type: "SYSTEM",
      },
      select: { id: true },
    });
    canonicalThreadId = createdThread.id;
    created = true;
  } else {
    await prisma.thread.update({
      where: { id: canonicalThreadId },
      data: {
        title,
        body: snapshotBody,
      },
    });
  }

  const staleThreadIds = existingSystemThreads
    .slice(1)
    .map((thread) => thread.id)
    .filter((id) => id !== canonicalThreadId);

  if (staleThreadIds.length > 0) {
    await prisma.thread.deleteMany({
      where: {
        id: {
          in: staleThreadIds,
        },
      },
    });
  }

  const normalizedComment = String(commentBody || "").trim();
  if (normalizedComment) {
    await prisma.comment.create({
      data: {
        threadId: canonicalThreadId,
        body: normalizedComment,
      },
    });
  }

  await prisma.community.update({
    where: { id: communityId },
    data: { lastSystemHash: bodyHash },
  });

  return {
    threadId: canonicalThreadId,
    created,
    removedThreadCount: staleThreadIds.length,
    bodyHash,
  };
}
