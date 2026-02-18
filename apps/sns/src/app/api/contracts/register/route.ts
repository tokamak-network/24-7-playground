import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "src/db";
import { getAddress, verifyMessage } from "ethers";
import { fetchEtherscanAbi, fetchEtherscanSource } from "src/lib/etherscan";
import { verifyPublicGithubRepository } from "src/lib/github";
import { buildSystemBody, hashSystemBody } from "src/lib/systemThread";

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

function buildRequestedContracts(body: any, serviceName: string) {
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

export async function POST(request: Request) {
  const body = await request.json();
  const serviceName = String(body.serviceName || body.name || "").trim();
  const chain = String(body.chain || "").trim();
  const signature = String(body.signature || "").trim();
  const descriptionInput = String(body.description || "").trim();
  const githubRepositoryUrlInput = String(body.githubRepositoryUrl || "").trim();

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

  let requestedContracts: Array<{ name: string; address: string }>;
  try {
    requestedContracts = buildRequestedContracts(body, serviceName);
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

  const fallbackDescription = `Agent community for ${serviceName} on ${chain}.`;

  let community = matchedCommunity;
  if (!community) {
    const baseSlug =
      slugify(`${serviceName}-${requestedContracts[0].address.slice(0, 6)}`) ||
      `community-${Date.now()}`;
    const uniqueSlug = await buildUniqueSlug(baseSlug);

    community = await prisma.community.create({
      data: {
        name: serviceName,
        slug: uniqueSlug,
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
      community = await prisma.community.update({
        where: { id: community.id },
        data: updateData,
      });
    }
  }

  const contractsToCreate = requestedContracts.filter(
    (contract) => !existingByAddress.has(contract.address.toLowerCase())
  );

  if (!contractsToCreate.length) {
    return NextResponse.json({
      contracts: existingContracts,
      community,
      alreadyRegistered: true,
    });
  }

  const createdContracts: Array<{
    id: string;
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
      abiJson = await fetchEtherscanAbi(contractInput.address);
      sourceInfo = await fetchEtherscanSource(contractInput.address);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? `${contractInput.address}: ${error.message}`
              : `Failed to fetch ABI/source for ${contractInput.address}`,
        },
        { status: 400 }
      );
    }

    const faucetFunction = detectFaucet(abiJson);

    const contract = await prisma.serviceContract.create({
      data: {
        name: contractInput.name,
        address: contractInput.address,
        chain,
        communityId: community.id,
        abiJson: toInputJson(abiJson),
        sourceJson: toInputJson(sourceInfo),
        faucetFunction,
      },
    });

    createdContracts.push({
      id: contract.id,
      name: contract.name,
      address: contract.address,
      chain: contract.chain,
      abiJson,
      sourceInfo,
      faucetFunction,
    });
  }

  let lastSystemHash: string | null = null;
  for (const contract of createdContracts) {
    const systemBody = buildSystemBody({
      name: contract.name,
      address: contract.address,
      chain: contract.chain,
      serviceDescription: community.description,
      sourceInfo: contract.sourceInfo,
      abiJson: contract.abiJson,
      githubRepositoryUrl: community.githubRepositoryUrl,
    });
    const systemHash = hashSystemBody(systemBody);

    await prisma.thread.create({
      data: {
        communityId: community.id,
        title: `Contract registered: ${contract.name}`,
        body: systemBody,
        type: "SYSTEM",
      },
    });

    lastSystemHash = systemHash;
  }

  if (lastSystemHash) {
    await prisma.community.update({
      where: { id: community.id },
      data: { lastSystemHash: lastSystemHash },
    });
  }

  const allContracts = await prisma.serviceContract.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    contracts: allContracts,
    community,
    contractCount: allContracts.length,
  });
}
