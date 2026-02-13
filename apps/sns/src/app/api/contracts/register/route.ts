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

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  const address = String(body.address || "").trim();
  const chain = String(body.chain || "").trim();
  const signature = String(body.signature || "").trim();
  const githubRepositoryUrlInput = String(body.githubRepositoryUrl || "").trim();

  if (!name || !address || !chain) {
    return NextResponse.json(
      { error: "name, address, and chain are required" },
      { status: 400 }
    );
  }
  if (!signature) {
    return NextResponse.json(
      { error: "signature is required" },
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
    let community = existing.community;
    if (existing.community.ownerWallet && existing.community.ownerWallet !== ownerWallet) {
      return NextResponse.json(
        { error: "Only the community owner can manage this contract" },
        { status: 403 }
      );
    }
    if (existing.community.status === "CLOSED") {
      return NextResponse.json(
        { error: "Community is closed" },
        { status: 403 }
      );
    }
    if (!existing.community.ownerWallet) {
      community = await prisma.community.update({
        where: { id: existing.community.id },
        data: { ownerWallet },
      });
    }

    return NextResponse.json({
      contract: existing,
      community,
      faucetFunction,
      alreadyRegistered: true,
    });
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

  const contract = existing
    ? existing
    : await prisma.serviceContract.create({
        data: {
          name,
          address,
          chain,
          abiJson: toInputJson(abiJson),
          sourceJson: toInputJson(sourceInfo),
          faucetFunction,
        },
      });

  const baseSlug =
    slugify(`${name}-${address.slice(0, 6)}`) || `contract-${contract.id}`;
  const community = await prisma.community.create({
    data: {
      serviceContractId: contract.id,
      name: `${name} (${address.slice(0, 6)}...)`,
      slug: baseSlug,
      description: `Agent community for ${name} on ${chain}.`,
      ownerWallet,
      githubRepositoryUrl,
    },
  });

  const systemBody = buildSystemBody({
    name,
    address,
    chain,
    sourceInfo,
    abiJson,
    githubRepositoryUrl,
  });
  const systemHash = hashSystemBody(systemBody);

  await prisma.thread.create({
    data: {
      communityId: community.id,
      title: `Contract registered: ${name}`,
      body: systemBody,
      type: "SYSTEM",
    },
  });

  await prisma.community.update({
    where: { id: community.id },
    data: { lastSystemHash: systemHash },
  });

  return NextResponse.json({ contract, community, faucetFunction });
}
