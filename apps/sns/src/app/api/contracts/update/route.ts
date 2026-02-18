import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { fetchEtherscanAbi, fetchEtherscanSource } from "src/lib/etherscan";
import { getAddress, verifyMessage } from "ethers";
import { upsertCanonicalSystemThread } from "src/lib/systemThread";
import { cleanupExpiredCommunities } from "src/lib/community";
import { firstTextLimitError, getDosTextLimits } from "src/lib/textLimits";

const FIXED_MESSAGE = "24-7-playground";
const SEPOLIA_CHAIN = "Sepolia";
const UPDATE_ACTIONS = [
  "UPDATE_DESCRIPTION",
  "UPDATE_CONTRACT",
  "REMOVE_CONTRACT",
  "ADD_CONTRACT",
] as const;

type UpdateAction = (typeof UPDATE_ACTIONS)[number];

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

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

function parseAction(value: unknown): UpdateAction | null {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  return UPDATE_ACTIONS.includes(normalized as UpdateAction)
    ? (normalized as UpdateAction)
    : null;
}

function formatValue(value: string | null | undefined, fallback = "not provided") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function normalizeComparableJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeComparableJson(item));
  }
  if (value && typeof value === "object") {
    const sortedEntries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => a.localeCompare(b)
    );
    const normalized: Record<string, unknown> = {};
    for (const [key, nestedValue] of sortedEntries) {
      normalized[key] = normalizeComparableJson(nestedValue);
    }
    return normalized;
  }
  return value;
}

function stableJson(value: unknown): string {
  return JSON.stringify(normalizeComparableJson(value));
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  await cleanupExpiredCommunities();

  const body = await request.json();
  const communityId = String(body.communityId || "").trim();
  const signature = String(body.signature || "").trim();
  const action = parseAction(body.action);
  const checkOnly = body.checkOnly === true || String(body.checkOnly || "").trim() === "true";
  let textLimits: Awaited<ReturnType<typeof getDosTextLimits>>;
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
      { status: 503, headers: corsHeaders() }
    );
  }

  if (!communityId) {
    return NextResponse.json(
      { error: "communityId is required" },
      { status: 400, headers: corsHeaders() }
    );
  }
  if (!signature) {
    return NextResponse.json(
      { error: "signature is required" },
      { status: 400, headers: corsHeaders() }
    );
  }
  if (!action) {
    return NextResponse.json(
      {
        error: `action must be one of: ${UPDATE_ACTIONS.join(", ")}`,
      },
      { status: 400, headers: corsHeaders() }
    );
  }
  if (checkOnly && action !== "UPDATE_CONTRACT") {
    return NextResponse.json(
      { error: "checkOnly is only supported for UPDATE_CONTRACT" },
      { status: 400, headers: corsHeaders() }
    );
  }
  const commonTextLimitError = firstTextLimitError([
    {
      field: "communityId",
      value: communityId,
      max: textLimits.ids.communityId,
    },
  ]);
  if (commonTextLimitError) {
    return NextResponse.json(
      { error: commonTextLimitError },
      { status: 400, headers: corsHeaders() }
    );
  }

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      serviceContracts: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!community) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404, headers: corsHeaders() }
    );
  }
  if (community.status === "CLOSED") {
    return NextResponse.json(
      { error: "Community is closed" },
      { status: 403, headers: corsHeaders() }
    );
  }

  let walletAddress = "";
  try {
    walletAddress = getAddress(verifyMessage(FIXED_MESSAGE, signature)).toLowerCase();
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const ownerWallet = community.ownerWallet?.toLowerCase() || "";
  if (ownerWallet && ownerWallet !== walletAddress) {
    return NextResponse.json(
      { error: "Only the community owner can update this community" },
      { status: 403, headers: corsHeaders() }
    );
  }

  if (!ownerWallet && !checkOnly) {
    await prisma.community.update({
      where: { id: community.id },
      data: { ownerWallet: walletAddress },
    });
  }

  let changedContractCount = 0;
  const updatedContractIdSet = new Set<string>();
  let commentBody = "";

  if (action === "UPDATE_DESCRIPTION") {
    const nextDescription = String(body.description || "").trim();
    const prevDescription = String(community.description || "").trim();
    const textLimitError = firstTextLimitError([
      {
        field: "description",
        value: nextDescription,
        max: textLimits.community.description,
      },
    ]);
    if (textLimitError) {
      return NextResponse.json(
        { error: textLimitError },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (prevDescription === nextDescription) {
      return NextResponse.json(
        {
          updated: false,
          action,
          message: "Description is unchanged.",
        },
        { headers: corsHeaders() }
      );
    }

    await prisma.community.update({
      where: { id: community.id },
      data: {
        description: nextDescription || null,
      },
    });

    commentBody = [
      "## Contract Registry Change",
      "",
      "- **Action:** `Service Description Updated`",
      `- **Before:** ${formatValue(prevDescription)}`,
      `- **After:** ${formatValue(nextDescription)}`,
      `- **Applied At:** \`${new Date().toISOString()}\``,
    ].join("\n");
  }

  if (action === "UPDATE_CONTRACT") {
    const contractId = String(body.contractId || "").trim();
    if (!contractId) {
      return NextResponse.json(
        { error: "contractId is required for UPDATE_CONTRACT" },
        { status: 400, headers: corsHeaders() }
      );
    }
    const contractIdLimitError = firstTextLimitError([
      {
        field: "contractId",
        value: contractId,
        max: textLimits.ids.contractId,
      },
    ]);
    if (contractIdLimitError) {
      return NextResponse.json(
        { error: contractIdLimitError },
        { status: 400, headers: corsHeaders() }
      );
    }

    const target = community.serviceContracts.find((contract) => contract.id === contractId);
    if (!target) {
      return NextResponse.json(
        { error: "Contract not found in selected community" },
        { status: 404, headers: corsHeaders() }
      );
    }

    const nextName = String(body.name || "").trim() || target.name;
    const rawNextAddress = String(body.address || "").trim() || target.address;
    const textLimitError = firstTextLimitError([
      {
        field: "name",
        value: nextName,
        max: textLimits.serviceContract.name,
      },
      {
        field: "address",
        value: rawNextAddress,
        max: textLimits.serviceContract.address,
      },
    ]);
    if (textLimitError) {
      return NextResponse.json(
        { error: textLimitError },
        { status: 400, headers: corsHeaders() }
      );
    }
    const nextAddress = normalizeContractAddress(rawNextAddress);

    if (!nextAddress) {
      return NextResponse.json(
        { error: "Contract address is invalid" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const duplicateInCommunity = await prisma.serviceContract.findFirst({
      where: {
        communityId: community.id,
        id: { not: target.id },
        address: { equals: nextAddress, mode: "insensitive" },
      },
      select: { id: true },
    });

    if (duplicateInCommunity) {
      return NextResponse.json(
        { error: "Another contract in this community already uses that address" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const duplicateInOtherCommunity = await prisma.serviceContract.findFirst({
      where: {
        id: { not: target.id },
        chain: target.chain,
        address: { equals: nextAddress, mode: "insensitive" },
        communityId: { not: community.id },
      },
      include: {
        community: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (duplicateInOtherCommunity) {
      return NextResponse.json(
        {
          error: `Address already belongs to another community (${duplicateInOtherCommunity.community?.name || duplicateInOtherCommunity.community?.slug || "unknown"})`,
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    let abiJson: unknown;
    let sourceInfo: unknown;
    try {
      abiJson = await fetchEtherscanAbi(nextAddress);
      sourceInfo = await fetchEtherscanSource(nextAddress);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? `${nextAddress}: ${error.message}`
              : "ABI/source fetch failed",
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    const nameChanged = nextName !== target.name;
    const addressChanged = nextAddress !== target.address.toLowerCase();
    const abiChanged = stableJson(abiJson) !== stableJson(target.abiJson);
    const sourceChanged = stableJson(sourceInfo || {}) !== stableJson(target.sourceJson || {});

    if (!nameChanged && !addressChanged && !abiChanged && !sourceChanged) {
      return NextResponse.json(
        {
          updated: false,
          action,
          checkOnly,
          canUpdate: false,
          differences: {
            nameChanged,
            addressChanged,
            abiChanged,
            sourceChanged,
          },
          message: "Selected contract has no change.",
        },
        { headers: corsHeaders() }
      );
    }

    if (checkOnly) {
      return NextResponse.json(
        {
          updated: false,
          action,
          checkOnly: true,
          canUpdate: true,
          changedContractCount: 1,
          differences: {
            nameChanged,
            addressChanged,
            abiChanged,
            sourceChanged,
          },
          message: "Contract update is available.",
        },
        { headers: corsHeaders() }
      );
    }

    await prisma.serviceContract.update({
      where: { id: target.id },
      data: {
        name: nextName,
        address: nextAddress,
        abiJson: toInputJson(abiJson),
        sourceJson: toInputJson(sourceInfo),
        faucetFunction: detectFaucet(abiJson),
      },
    });

    changedContractCount = 1;
    updatedContractIdSet.add(target.id);

    commentBody = [
      "## Contract Registry Change",
      "",
      "- **Action:** `Contract Updated`",
      `- **Contract:** \`${target.name}\` -> \`${nextName}\``,
      `- **Address:** \`${target.address}\` -> \`${nextAddress}\``,
      `- **Metadata Refresh:** \`${abiChanged || sourceChanged ? "yes" : "no"}\``,
      `- **Applied At:** \`${new Date().toISOString()}\``,
    ].join("\n");
  }

  if (action === "REMOVE_CONTRACT") {
    const contractId = String(body.contractId || "").trim();
    if (!contractId) {
      return NextResponse.json(
        { error: "contractId is required for REMOVE_CONTRACT" },
        { status: 400, headers: corsHeaders() }
      );
    }
    const contractIdLimitError = firstTextLimitError([
      {
        field: "contractId",
        value: contractId,
        max: textLimits.ids.contractId,
      },
    ]);
    if (contractIdLimitError) {
      return NextResponse.json(
        { error: contractIdLimitError },
        { status: 400, headers: corsHeaders() }
      );
    }

    const target = community.serviceContracts.find((contract) => contract.id === contractId);
    if (!target) {
      return NextResponse.json(
        { error: "Contract not found in selected community" },
        { status: 404, headers: corsHeaders() }
      );
    }

    await prisma.serviceContract.delete({ where: { id: target.id } });
    changedContractCount = 1;

    commentBody = [
      "## Contract Registry Change",
      "",
      "- **Action:** `Contract Removed`",
      `- **Contract:** \`${target.name}\``,
      `- **Address:** \`${target.address}\``,
      `- **Applied At:** \`${new Date().toISOString()}\``,
    ].join("\n");
  }

  if (action === "ADD_CONTRACT") {
    const name = String(body.name || "").trim() || community.name;
    const rawAddress = String(body.address || "").trim();
    const chain = String(body.chain || community.serviceContracts[0]?.chain || SEPOLIA_CHAIN).trim() || SEPOLIA_CHAIN;
    const textLimitError = firstTextLimitError([
      {
        field: "name",
        value: name,
        max: textLimits.serviceContract.name,
      },
      {
        field: "address",
        value: rawAddress,
        max: textLimits.serviceContract.address,
      },
      {
        field: "chain",
        value: chain,
        max: textLimits.serviceContract.chain,
      },
    ]);
    if (textLimitError) {
      return NextResponse.json(
        { error: textLimitError },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (!rawAddress) {
      return NextResponse.json(
        { error: "address is required for ADD_CONTRACT" },
        { status: 400, headers: corsHeaders() }
      );
    }
    if (chain !== SEPOLIA_CHAIN) {
      return NextResponse.json(
        { error: "Only Sepolia is supported for now" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const address = normalizeContractAddress(rawAddress);
    if (!address) {
      return NextResponse.json(
        { error: "Contract address is invalid" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const existingContract = await prisma.serviceContract.findFirst({
      where: {
        chain,
        address: { equals: address, mode: "insensitive" },
      },
      include: {
        community: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    });

    if (existingContract?.communityId === community.id) {
      return NextResponse.json(
        { error: "This contract is already registered in the selected community" },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (existingContract?.communityId && existingContract.communityId !== community.id) {
      return NextResponse.json(
        {
          error: `Address already belongs to another community (${existingContract.community?.name || existingContract.community?.slug || "unknown"})`,
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    let abiJson: unknown;
    let sourceInfo: unknown;
    try {
      abiJson = await fetchEtherscanAbi(address);
      sourceInfo = await fetchEtherscanSource(address);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? `${address}: ${error.message}`
              : "ABI/source fetch failed",
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    const created = await prisma.serviceContract.create({
      data: {
        name,
        address,
        chain,
        communityId: community.id,
        abiJson: toInputJson(abiJson),
        sourceJson: toInputJson(sourceInfo),
        faucetFunction: detectFaucet(abiJson),
      },
      select: { id: true, name: true, address: true, chain: true },
    });

    changedContractCount = 1;
    updatedContractIdSet.add(created.id);

    commentBody = [
      "## Contract Registry Change",
      "",
      "- **Action:** `Contract Added`",
      `- **Contract:** \`${created.name}\``,
      `- **Address:** \`${created.address}\``,
      `- **Chain:** \`${created.chain}\``,
      `- **Applied At:** \`${new Date().toISOString()}\``,
    ].join("\n");
  }

  const refreshedCommunity = await prisma.community.findUnique({
    where: { id: community.id },
    include: {
      serviceContracts: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!refreshedCommunity) {
    return NextResponse.json(
      { error: "Community not found after update" },
      { status: 404, headers: corsHeaders() }
    );
  }

  const systemThreadSync = await upsertCanonicalSystemThread({
    communityId: refreshedCommunity.id,
    serviceName: refreshedCommunity.name,
    serviceDescription: refreshedCommunity.description,
    githubRepositoryUrl: refreshedCommunity.githubRepositoryUrl,
    snapshotType: "UPDATE",
    title: `Contract registry: ${refreshedCommunity.name}`,
    contracts: refreshedCommunity.serviceContracts.map((contract) => ({
      id: contract.id,
      name: contract.name,
      address: contract.address,
      chain: contract.chain,
      sourceInfo: contract.sourceJson || {},
      abiJson: contract.abiJson,
      faucetFunction: contract.faucetFunction || null,
      updated: updatedContractIdSet.has(contract.id),
    })),
    commentBody,
  });

  return NextResponse.json(
    {
      updated: true,
      action,
      changedContractCount,
      contractCount: refreshedCommunity.serviceContracts.length,
      systemThreadId: systemThreadSync.threadId,
      systemThreadCreated: systemThreadSync.created,
      removedSystemThreadCount: systemThreadSync.removedThreadCount,
    },
    { headers: corsHeaders() }
  );
}
