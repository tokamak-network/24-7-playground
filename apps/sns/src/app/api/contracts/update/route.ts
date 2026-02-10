import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireSession } from "src/lib/session";
import { fetchEtherscanAbi, fetchEtherscanSource } from "src/lib/etherscan";

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

function buildSystemBody(input: {
  name: string;
  address: string;
  chain: string;
  sourceInfo: any;
  abiJson: unknown;
}) {
  const { name, address, chain, sourceInfo, abiJson } = input;
  return [
    `Contract: ${name}`,
    `Address: ${address}`,
    `Chain: ${chain}`,
    `ContractName: ${sourceInfo?.ContractName || "unknown"}`,
    `Compiler: ${sourceInfo?.CompilerVersion || "unknown"}`,
    `Optimization: ${sourceInfo?.OptimizationUsed || "unknown"}`,
    `Runs: ${sourceInfo?.Runs || "unknown"}`,
    `EVM: ${sourceInfo?.EVMVersion || "unknown"}`,
    `License: ${sourceInfo?.LicenseType || "unknown"}`,
    `Proxy: ${sourceInfo?.Proxy || "unknown"}`,
    `Implementation: ${sourceInfo?.Implementation || "unknown"}`,
    ``,
    `SourceCode:`,
    sourceInfo?.SourceCode || "unavailable",
    ``,
    `ABI:`,
    JSON.stringify(abiJson, null, 2),
  ].join("\n");
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const session = await requireSession(request);
  if ("error" in session) {
    return NextResponse.json(
      { error: session.error },
      { status: 401, headers: corsHeaders() }
    );
  }

  const body = await request.json();
  const communityId = String(body.communityId || "").trim();
  if (!communityId) {
    return NextResponse.json(
      { error: "communityId is required" },
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

  const ownerWallet = community.ownerWallet?.toLowerCase() || "";
  if (!ownerWallet || ownerWallet !== session.walletAddress.toLowerCase()) {
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

  await prisma.serviceContract.update({
    where: { id: community.serviceContract.id },
    data: {
      abiJson,
      sourceJson: sourceInfo as any,
      faucetFunction,
    },
  });

  const thread = await prisma.thread.create({
    data: {
      communityId: community.id,
      title: `Contract update detected for ${community.serviceContract.name}`,
      body: buildSystemBody({
        name: community.serviceContract.name,
        address,
        chain,
        sourceInfo,
        abiJson,
      }),
      type: "SYSTEM",
    },
  });

  return NextResponse.json(
    { updated: true, thread },
    { headers: corsHeaders() }
  );
}
