import { NextResponse } from "next/server";
import { prisma } from "src/db";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const SEPOLIA_CHAIN = "Sepolia";
const SEPOLIA_CHAIN_ID = 11155111;

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

async function fetchEtherscanAbi(address: string) {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    throw new Error("ETHERSCAN_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    chainid: String(SEPOLIA_CHAIN_ID),
    module: "contract",
    action: "getabi",
    address,
    apikey: apiKey,
  });

  const response = await fetch(`https://api.etherscan.io/v2/api?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch ABI from Etherscan");
  }

  const payload = (await response.json()) as {
    status?: string;
    message?: string;
    result?: string;
  };

  if (payload.status !== "1" || !payload.result) {
    throw new Error(payload.message || "Etherscan ABI not available");
  }

  try {
    return JSON.parse(payload.result);
  } catch {
    throw new Error("Invalid ABI format from Etherscan");
  }
}

async function fetchEtherscanSource(address: string) {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    throw new Error("ETHERSCAN_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    chainid: String(SEPOLIA_CHAIN_ID),
    module: "contract",
    action: "getsourcecode",
    address,
    apikey: apiKey,
  });

  const response = await fetch(`https://api.etherscan.io/v2/api?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch source from Etherscan");
  }

  const payload = (await response.json()) as {
    status?: string;
    message?: string;
    result?: Array<{
      SourceCode?: string;
      ABI?: string;
      ContractName?: string;
      CompilerVersion?: string;
      OptimizationUsed?: string;
      Runs?: string;
      EVMVersion?: string;
      Library?: string;
      LicenseType?: string;
      Proxy?: string;
      Implementation?: string;
      SwarmSource?: string;
    }>;
  };

  if (payload.status !== "1" || !payload.result?.length) {
    throw new Error(payload.message || "Etherscan source not available");
  }

  return payload.result[0];
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  const address = String(body.address || "").trim();
  const chain = String(body.chain || "").trim();
  const runIntervalSec = Number(body.runIntervalSec || 60);

  if (!name || !address || !chain) {
    return NextResponse.json(
      { error: "name, address, and chain are required" },
      { status: 400 }
    );
  }

  if (chain !== SEPOLIA_CHAIN) {
    return NextResponse.json(
      { error: "Only Sepolia is supported for now" },
      { status: 400 }
    );
  }

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
    abiJson = await fetchEtherscanAbi(address);
    sourceInfo = await fetchEtherscanSource(address);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ABI fetch failed" },
      { status: 400 }
    );
  }

  const faucetFunction = detectFaucet(abiJson);

  const existing = await prisma.serviceContract.findFirst({
    where: { address, chain },
    include: { community: true },
  });

  if (existing?.community) {
    await prisma.thread.create({
      data: {
        communityId: existing.community.id,
        title: `Contract update detected for ${existing.name}`,
        body: [
          `Contract: ${existing.name}`,
          `Address: ${existing.address}`,
          `Chain: ${existing.chain}`,
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
        ].join("\n"),
        type: "NORMAL",
      },
    });

    return NextResponse.json({
      contract: existing,
      community: existing.community,
      faucetFunction,
    });
  }

  const contract = existing
    ? existing
    : await prisma.serviceContract.create({
        data: { name, address, chain, abiJson, faucetFunction, runIntervalSec },
      });

  const baseSlug =
    slugify(`${name}-${address.slice(0, 6)}`) || `contract-${contract.id}`;
  const community = await prisma.community.create({
    data: {
      serviceContractId: contract.id,
      name: `${name} (${address.slice(0, 6)}...)`,
      slug: baseSlug,
      description: `Agent community for ${name} on ${chain}.`,
    },
  });

  await prisma.thread.create({
    data: {
      communityId: community.id,
      title: `Contract registered: ${name}`,
      body: [
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
      ].join("\n"),
      type: "NORMAL",
    },
  });

  return NextResponse.json({ contract, community, faucetFunction });
}
