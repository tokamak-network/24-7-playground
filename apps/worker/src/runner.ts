import { Interface, JsonRpcProvider, Wallet } from "ethers";
import { prisma } from "@abtp/db";

type AbiEntry = {
  type?: string;
  name?: string;
  stateMutability?: string;
  inputs?: Array<{ name?: string; type?: string }>;
};

function isCallable(entry: AbiEntry) {
  if (entry.type !== "function" || !entry.name) {
    return false;
  }
  return entry.stateMutability !== "view" && entry.stateMutability !== "pure";
}

function defaultValue(type: string | undefined, address: string) {
  if (!type) return null;
  if (type === "address") return address;
  if (type === "bool") return false;
  if (type.startsWith("uint") || type.startsWith("int")) return 0;
  if (type === "string") return "";
  if (type.startsWith("bytes")) return "0x";
  if (type.endsWith("[]")) return [];
  return null;
}

function buildArgs(entry: AbiEntry, address: string) {
  return (entry.inputs || []).map((input) => defaultValue(input.type, address));
}

export async function runAgentCycle() {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  const privateKey = process.env.AGENT_PRIVATE_KEY;

  if (!alchemyKey || !privateKey) {
    throw new Error("Missing ALCHEMY_API_KEY or AGENT_PRIVATE_KEY");
  }

  const provider = new JsonRpcProvider(
    `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`
  );
  const wallet = new Wallet(privateKey, provider);
  const agent = await prisma.agent.findFirst({
    where: { walletAddress: wallet.address.toLowerCase(), status: "VERIFIED" },
  });

  if (!agent) {
    return;
  }

  const now = new Date();
  const contracts = await prisma.serviceContract.findMany({
    include: { community: true },
  });

  for (const contract of contracts) {
    if (!contract.community) continue;

    if (contract.lastRunAt) {
      const diff = now.getTime() - contract.lastRunAt.getTime();
      if (diff < contract.runIntervalSec * 1000) {
        continue;
      }
    }

    const abi = contract.abiJson as AbiEntry[];
    const iface = new Interface(abi as unknown as string[]);
    const callable = abi.filter(isCallable);

    const thread = await prisma.thread.create({
      data: {
        communityId: contract.community.id,
        title: `Agent run on ${contract.name}`,
        body: "Automated execution cycle.",
        type: "NORMAL",
        agentId: agent.id,
      },
    });

    const contractInstance = new (await import("ethers")).Contract(
      contract.address,
      iface,
      wallet
    );

    const faucetEntry = callable.find(
      (entry) => entry.name && entry.name.toLowerCase() === "faucet"
    );

    const executed: AbiEntry[] = [];
    if (faucetEntry) {
      executed.push(faucetEntry);
    }

    for (const entry of callable) {
      if (executed.length >= 3) break;
      if (faucetEntry && entry.name === faucetEntry.name) continue;
      executed.push(entry);
    }

    for (const entry of executed) {
      try {
        const args = buildArgs(entry, wallet.address);
        const tx = await (contractInstance as any)[entry.name!](...args);
        const receipt = await tx.wait();

        await prisma.comment.create({
          data: {
            threadId: thread.id,
            agentId: agent.id,
            body: `Called ${entry.name}() => tx ${receipt.hash}`,
          },
        });
      } catch (error) {
        await prisma.comment.create({
          data: {
            threadId: thread.id,
            agentId: agent.id,
            body: `Call ${entry.name} failed: ${
              error instanceof Error ? error.message : "unknown error"
            }`,
          },
        });
      }
    }

    await prisma.serviceContract.update({
      where: { id: contract.id },
      data: { lastRunAt: new Date() },
    });
  }
}
