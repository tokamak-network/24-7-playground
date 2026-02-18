import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { fetchEtherscanAbi, fetchEtherscanSource } from "src/lib/etherscan";
import { getAddress, verifyMessage } from "ethers";
import { buildSystemSnapshotBody, hashSystemBody } from "src/lib/systemThread";
import { cleanupExpiredCommunities } from "src/lib/community";

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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  await cleanupExpiredCommunities();

  const body = await request.json();
  const communityId = String(body.communityId || "").trim();
  const signature = String(body.signature || "").trim();
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
  if (!community.serviceContracts.length) {
    return NextResponse.json(
      { error: "No contracts are registered for this community" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const authMessage = "24-7-playground";
  let walletAddress = "";
  try {
    walletAddress = getAddress(verifyMessage(authMessage, signature)).toLowerCase();
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const ownerWallet = community.ownerWallet?.toLowerCase() || "";
  if (ownerWallet && ownerWallet !== walletAddress) {
    return NextResponse.json(
      { error: "Only the community owner can update system threads" },
      { status: 403, headers: corsHeaders() }
    );
  }

  const pendingUpdates: Array<{
    contractId: string;
    abiJson: unknown;
    sourceInfo: any;
    faucetFunction: string | null;
  }> = [];

  for (const contract of community.serviceContracts) {
    let abiJson: unknown;
    let sourceInfo: any;
    try {
      abiJson = await fetchEtherscanAbi(contract.address);
      sourceInfo = await fetchEtherscanSource(contract.address);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? `${contract.address}: ${error.message}`
              : "ABI fetch failed",
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    const nextAbi = JSON.stringify(abiJson);
    const prevAbi = JSON.stringify(contract.abiJson);
    const nextSource = JSON.stringify(sourceInfo || {});
    const prevSource = JSON.stringify(contract.sourceJson || {});

    if (nextAbi === prevAbi && nextSource === prevSource) {
      continue;
    }

    const faucetFunction = detectFaucet(abiJson);

    pendingUpdates.push({
      contractId: contract.id,
      abiJson,
      sourceInfo,
      faucetFunction,
    });
  }

  if (!pendingUpdates.length) {
    return NextResponse.json(
      { updated: false, updatedCount: 0 },
      { headers: corsHeaders() }
    );
  }

  await prisma.$transaction(async (tx) => {
    for (const item of pendingUpdates) {
      await tx.serviceContract.update({
        where: { id: item.contractId },
        data: {
          abiJson: toInputJson(item.abiJson),
          sourceJson: toInputJson(item.sourceInfo),
          faucetFunction: item.faucetFunction,
        },
      });
    }
  });

  const allContracts = await prisma.serviceContract.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      chain: true,
      abiJson: true,
      sourceJson: true,
      faucetFunction: true,
    },
  });
  const updatedContractIdSet = new Set(
    pendingUpdates.map((item) => item.contractId)
  );
  const snapshotBody = buildSystemSnapshotBody({
    snapshotType: "UPDATE",
    serviceName: community.name,
    serviceDescription: community.description,
    githubRepositoryUrl: community.githubRepositoryUrl,
    contracts: allContracts.map((contract) => ({
      id: contract.id,
      name: contract.name,
      address: contract.address,
      chain: contract.chain,
      sourceInfo: contract.sourceJson || {},
      abiJson: contract.abiJson,
      faucetFunction: contract.faucetFunction || null,
      updated: updatedContractIdSet.has(contract.id),
    })),
  });
  const bodyHash = hashSystemBody(snapshotBody);

  const thread = await prisma.thread.create({
    data: {
      communityId: community.id,
      title: `Contract update detected: ${community.name} (${pendingUpdates.length} changed)`,
      body: snapshotBody,
      type: "SYSTEM",
    },
  });

  await prisma.community.update({
    where: { id: community.id },
    data: {
      lastSystemHash: bodyHash,
      ownerWallet: ownerWallet || walletAddress,
    },
  });

  return NextResponse.json(
    {
      updated: true,
      updatedCount: 1,
      changedContractCount: pendingUpdates.length,
      threads: [thread],
    },
    { headers: corsHeaders() }
  );
}
