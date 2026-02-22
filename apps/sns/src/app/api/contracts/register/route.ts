import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "src/db";
import { getAddress, verifyMessage } from "ethers";
import { fetchEtherscanAbi, fetchEtherscanSource } from "src/lib/etherscan";
import { verifyPublicGithubRepository } from "src/lib/github";
import { upsertCanonicalSystemThread } from "src/lib/systemThread";
import {
  firstTextLimitError,
  getDosTextLimits,
  type DosTextLimits,
} from "src/lib/textLimits";
import {
  TEMP_COMMUNITY_CREATION_POLICY,
  verifyTonHoldingEligibility,
} from "src/lib/communityCreationPolicy";
import { mapApiError } from "src/lib/apiError";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function buildUniqueSlug(base: string) {
  const normalizedBase = slugify(base) || "community";
  let attempt = normalizedBase;
  let suffix = 2;

  while (true) {
    const existing = await prisma.community.findUnique({
      where: { slug: attempt },
      select: { id: true },
    });
    if (!existing) {
      return attempt;
    }
    attempt = `${normalizedBase}-${suffix}`;
    suffix += 1;
  }
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

const SEPOLIA_CHAIN = "Sepolia";

function detectFaucet(abi: unknown) {
  if (!Array.isArray(abi)) {
    return null;
  }
  const entry = abi.find(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "type" in item &&
      (item as { type?: string }).type === "function" &&
      "name" in item &&
      typeof (item as { name?: string }).name === "string" &&
      (item as { name: string }).name.toLowerCase() === "faucet"
  ) as { name?: string } | undefined;

  return entry?.name || null;
}

function normalizeContractAddress(value: string) {
  try {
    return getAddress(value).toLowerCase();
  } catch {
    return null;
  }
}

function buildRequestedContracts(
  body: any,
  serviceName: string,
  textLimits: DosTextLimits
) {
  const rawContracts = Array.isArray(body.contracts) ? body.contracts : [];
  const fallbackName = String(body.name || "").trim();
  const fallbackAddress = String(body.address || "").trim();
  const entries =
    rawContracts.length > 0
      ? rawContracts
      : fallbackAddress
        ? [{ name: fallbackName || serviceName, address: fallbackAddress }]
        : [];

  const byAddress = new Map<string, { name: string; address: string }>();

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i] || {};
    const contractName = String(entry.name || serviceName).trim();
    const rawAddress = String(entry.address || "").trim();

    if (!rawAddress) {
      throw new Error(`contracts[${i}].address is required`);
    }
    const textLimitError = firstTextLimitError([
      {
        field: `contracts[${i}].name`,
        value: contractName,
        max: textLimits.serviceContract.name,
      },
      {
        field: `contracts[${i}].address`,
        value: rawAddress,
        max: textLimits.serviceContract.address,
      },
    ]);
    if (textLimitError) {
      throw new Error(textLimitError);
    }

    const normalizedAddress = normalizeContractAddress(rawAddress);
    if (!normalizedAddress) {
      throw new Error(`contracts[${i}].address is invalid`);
    }

    byAddress.set(normalizedAddress, {
      name: contractName || serviceName,
      address: normalizedAddress,
    });
  }

  return Array.from(byAddress.values());
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
}

function isRetryableEtherscanError(error: unknown) {
  const message = toErrorMessage(error, "").toLowerCase();
  return (
    message.includes("rate limit") ||
    message.includes("notok") ||
    message.includes("timeout") ||
    message.includes("temporarily") ||
    message.includes("fetch")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withEtherscanRetry<T>(
  action: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (!isRetryableEtherscanError(error) || attempt === maxAttempts) {
        throw error;
      }
      await sleep(attempt * 450);
    }
  }
  throw lastError;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const serviceName = String(body.serviceName || body.name || "").trim();
    const chain = String(body.chain || "").trim();
    const signature = String(body.signature || "").trim();
    const descriptionInput = String(body.description || "").trim();
    const githubRepositoryUrlInput = String(body.githubRepositoryUrl || "").trim();
    let textLimits: DosTextLimits;
    try {
      textLimits = await getDosTextLimits();
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Text limit policy is unavailable.",
        },
        { status: 503 }
      );
    }

  if (!serviceName || !chain) {
    return NextResponse.json(
      { error: "serviceName and chain are required" },
      { status: 400 }
    );
  }
  if (!signature) {
    return NextResponse.json(
      { error: "signature is required" },
      { status: 400 }
    );
  }
  const textLimitError = firstTextLimitError([
    {
      field: "serviceName",
      value: serviceName,
      max: textLimits.community.name,
    },
    {
      field: "chain",
      value: chain,
      max: textLimits.serviceContract.chain,
    },
    {
      field: "description",
      value: descriptionInput,
      max: textLimits.community.description,
    },
    {
      field: "githubRepositoryUrl",
      value: githubRepositoryUrlInput,
      max: textLimits.community.githubRepositoryUrl,
    },
  ]);
  if (textLimitError) {
    return NextResponse.json(
      { error: textLimitError },
      { status: 400 }
    );
  }

  let requestedContracts: Array<{ name: string; address: string }>;
  try {
    requestedContracts = buildRequestedContracts(body, serviceName, textLimits);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid contracts payload" },
      { status: 400 }
    );
  }

  if (!requestedContracts.length) {
    return NextResponse.json(
      { error: "At least one contract is required" },
      { status: 400 }
    );
  }

  if (chain !== SEPOLIA_CHAIN) {
    return NextResponse.json(
      { error: "Only Sepolia is supported for now" },
      { status: 400 }
    );
  }

  const authMessage = "24-7-playground";
  let ownerWallet: string;
  try {
    ownerWallet = getAddress(verifyMessage(authMessage, signature)).toLowerCase();
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const existingContracts = await prisma.serviceContract.findMany({
    where: {
      chain,
      OR: requestedContracts.map((contract) => ({
        address: { equals: contract.address, mode: "insensitive" },
      })),
    },
    include: { community: true },
  });

  const existingByAddress = new Map(
    existingContracts.map((contract) => [contract.address.toLowerCase(), contract])
  );

  const matchedCommunities = new Map<string, NonNullable<(typeof existingContracts)[number]["community"]>>();

  for (const contract of existingContracts) {
    const community = contract.community;
    if (!community) continue;

    if (community.ownerWallet && community.ownerWallet.toLowerCase() !== ownerWallet) {
      return NextResponse.json(
        { error: "Only the community owner can manage this contract" },
        { status: 403 }
      );
    }
    if (community.status === "CLOSED") {
      return NextResponse.json(
        { error: "Community is closed" },
        { status: 403 }
      );
    }

    matchedCommunities.set(community.id, community);
  }

  if (matchedCommunities.size > 1) {
    return NextResponse.json(
      { error: "Contracts already belong to different communities" },
      { status: 400 }
    );
  }

  let githubRepositoryUrl: string | null = null;
  if (githubRepositoryUrlInput) {
    try {
      githubRepositoryUrl = await verifyPublicGithubRepository(githubRepositoryUrlInput);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid GitHub repository." },
        { status: 400 }
      );
    }
  }

  const matchedCommunity = matchedCommunities.size
    ? Array.from(matchedCommunities.values())[0]
    : null;

  if (!matchedCommunity) {
    const ownedCommunityCount = await prisma.community.count({
      where: {
        ownerWallet: {
          equals: ownerWallet,
          mode: "insensitive",
        },
      },
    });

    if (
      ownedCommunityCount >= TEMP_COMMUNITY_CREATION_POLICY.maxCommunitiesPerWallet
    ) {
      return NextResponse.json(
        {
          error: `A qualified wallet can create at most ${TEMP_COMMUNITY_CREATION_POLICY.maxCommunitiesPerWallet} communities.`,
        },
        { status: 403 }
      );
    }

    const tonEligibility = await verifyTonHoldingEligibility(ownerWallet);
    if (!tonEligibility.eligible) {
      return NextResponse.json(
        {
          error:
            tonEligibility.reason ||
            `Community creation requires at least ${TEMP_COMMUNITY_CREATION_POLICY.minTonWholeBalance.toString()} TON on Sepolia.`,
        },
        { status: 403 }
      );
    }
  }

  const contractsToCreate = requestedContracts.filter(
    (contract) => !existingByAddress.has(contract.address.toLowerCase())
  );

  const resolvedContracts: Array<{
    name: string;
    address: string;
    chain: string;
    abiJson: unknown;
    sourceInfo: {
      SourceCode?: string;
      ContractName?: string;
      CompilerVersion?: string;
      OptimizationUsed?: string;
      Runs?: string;
      EVMVersion?: string;
      LicenseType?: string;
      Proxy?: string;
      Implementation?: string;
    };
    faucetFunction: string | null;
  }> = [];

  for (const contractInput of contractsToCreate) {
    let abiJson: unknown;
    let sourceInfo: {
      SourceCode?: string;
      ContractName?: string;
      CompilerVersion?: string;
      OptimizationUsed?: string;
      Runs?: string;
      EVMVersion?: string;
      LicenseType?: string;
      Proxy?: string;
      Implementation?: string;
    };

    try {
      abiJson = await withEtherscanRetry(() => fetchEtherscanAbi(contractInput.address));
      sourceInfo = await withEtherscanRetry(() => fetchEtherscanSource(contractInput.address));
    } catch (error) {
      return NextResponse.json(
        {
          error: `${contractInput.address}: ${toErrorMessage(
            error,
            "Failed to fetch ABI/source"
          )}`,
        },
        { status: 400 }
      );
    }

    resolvedContracts.push({
      name: contractInput.name,
      address: contractInput.address,
      chain,
      abiJson,
      sourceInfo,
      faucetFunction: detectFaucet(abiJson),
    });
  }

  const fallbackDescription = `Agent community for ${serviceName} on ${chain}.`;
  const uniqueSlug = !matchedCommunity
    ? await buildUniqueSlug(
        slugify(`${serviceName}-${requestedContracts[0].address.slice(0, 6)}`) ||
          `community-${Date.now()}`
      )
    : null;

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let community = matchedCommunity;

    if (!community) {
      community = await tx.community.create({
        data: {
          name: serviceName,
          slug: String(uniqueSlug || ""),
          description: descriptionInput || fallbackDescription,
          ownerWallet,
          githubRepositoryUrl,
        },
      });
    } else {
      const updateData: {
        ownerWallet?: string;
        description?: string;
        githubRepositoryUrl?: string | null;
      } = {};

      if (!community.ownerWallet) {
        updateData.ownerWallet = ownerWallet;
      }
      if (descriptionInput) {
        updateData.description = descriptionInput;
      }
      if (githubRepositoryUrlInput) {
        updateData.githubRepositoryUrl = githubRepositoryUrl;
      }

      if (Object.keys(updateData).length > 0) {
        community = await tx.community.update({
          where: { id: community.id },
          data: updateData,
        });
      }
    }

    for (const contract of resolvedContracts) {
      await tx.serviceContract.create({
        data: {
          name: contract.name,
          address: contract.address,
          chain: contract.chain,
          communityId: community.id,
          abiJson: toInputJson(contract.abiJson),
          sourceJson: toInputJson(contract.sourceInfo),
          faucetFunction: contract.faucetFunction,
        },
      });
    }

    return { community };
  });

  const allContracts = await prisma.serviceContract.findMany({
    where: { communityId: result.community.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      chain: true,
      abiJson: true,
      sourceJson: true,
      faucetFunction: true,
      createdAt: true,
      communityId: true,
      lastRunAt: true,
    },
  });

  const createdContractIds = new Set<string>(
    allContracts
      .filter((contract) =>
        contractsToCreate.some(
          (requested) =>
            requested.address.toLowerCase() === contract.address.toLowerCase()
        )
      )
      .map((contract) => contract.id)
  );

  const createdContracts = allContracts.filter((contract) =>
    createdContractIds.has(contract.id)
  );
  const registrationCommentBody =
    matchedCommunity && createdContracts.length
      ? [
          "## Contract Registry Change",
          "",
          `- **Action:** \`Contract Added\``,
          `- **Count:** \`${createdContracts.length}\``,
          "",
          ...createdContracts.map(
            (contract, index) =>
              `${index + 1}. \`${contract.name}\` · \`${contract.address}\` · ${contract.chain}`
          ),
          "",
          `- **Applied At:** \`${new Date().toISOString()}\``,
        ].join("\n")
      : null;

  const systemThreadSync = await upsertCanonicalSystemThread({
    communityId: result.community.id,
    serviceName: result.community.name,
    serviceDescription: result.community.description || null,
    githubRepositoryUrl: result.community.githubRepositoryUrl || null,
    snapshotType: createdContractIds.size
      ? matchedCommunity
        ? "UPDATE"
        : "REGISTRATION"
      : "BACKFILL",
    title: `Contract registry: ${result.community.name}`,
    contracts: allContracts.map((contract) => ({
      id: contract.id,
      name: contract.name,
      address: contract.address,
      chain: contract.chain,
      sourceInfo: contract.sourceJson || {},
      abiJson: contract.abiJson,
      faucetFunction: contract.faucetFunction || null,
      updated: createdContractIds.has(contract.id),
    })),
    commentBody: registrationCommentBody,
  });

  if (!contractsToCreate.length) {
    return NextResponse.json({
      contracts: allContracts,
      community: result.community,
      contractCount: allContracts.length,
      alreadyRegistered: true,
      systemThreadsCreated: systemThreadSync.created ? 1 : 0,
    });
  }

    return NextResponse.json({
      contracts: allContracts,
      community: result.community,
      contractCount: allContracts.length,
      systemThreadsCreated: systemThreadSync.created ? 1 : 0,
    });
  } catch (error) {
    console.error("[contracts/register]", error);
    const mapped = mapApiError(error, "Community registration failed.");
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
