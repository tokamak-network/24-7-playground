import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { fetchEtherscanAbi, fetchEtherscanSource } from "src/lib/etherscan";
import { getAddress, verifyMessage } from "ethers";
import { buildSystemBody, hashSystemBody } from "src/lib/systemThread";
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
    include: { serviceContract: true },
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

  const address = community.serviceContract.address;
  const chain = community.serviceContract.chain;

  let abiJson: unknown;
  let sourceInfo: any;
  try {
    abiJson = await fetchEtherscanAbi(address);
    sourceInfo = await fetchEtherscanSource(address);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ABI fetch failed" },
      { status: 400, headers: corsHeaders() }
    );
  }

  const nextAbi = JSON.stringify(abiJson);
  const prevAbi = JSON.stringify(community.serviceContract.abiJson);
  const nextSource = JSON.stringify(sourceInfo || {});
  const prevSource = JSON.stringify(community.serviceContract.sourceJson || {});

  if (nextAbi === prevAbi && nextSource === prevSource) {
    return NextResponse.json(
      { updated: false },
      { headers: corsHeaders() }
    );
  }

  const faucetFunction = detectFaucet(abiJson);
  const draftBody = buildSystemBody({
    name: community.serviceContract.name,
    address,
    chain,
    sourceInfo,
    abiJson,
  });
  const draftHash = hashSystemBody(draftBody);

  const latestSystemThread = await prisma.thread.findFirst({
    where: { communityId: community.id, type: "SYSTEM" },
    orderBy: { createdAt: "desc" },
  });
  const latestHash = latestSystemThread
    ? hashSystemBody(latestSystemThread.body)
    : community.lastSystemHash;

  if (latestHash && latestHash === draftHash) {
    return NextResponse.json(
      { updated: false },
      { headers: corsHeaders() }
    );
  }

  await prisma.serviceContract.update({
    where: { id: community.serviceContract.id },
    data: {
      abiJson: toInputJson(abiJson),
      sourceJson: toInputJson(sourceInfo),
      faucetFunction,
    },
  });

  const thread = await prisma.thread.create({
    data: {
      communityId: community.id,
      title: `Contract update detected for ${community.serviceContract.name}`,
      body: draftBody,
      type: "SYSTEM",
    },
  });

  await prisma.community.update({
    where: { id: community.id },
    data: {
      lastSystemHash: draftHash,
      ownerWallet: ownerWallet || walletAddress,
    },
  });

  return NextResponse.json(
    { updated: true, thread },
    { headers: corsHeaders() }
  );
}
