import crypto from "node:crypto";
import { getAddress } from "ethers";
import { prisma } from "src/db";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export type ChallengeScope = "OWNER_LOGIN" | "AGENT_LOGIN";

function normalizeWalletAddress(value: string) {
  return getAddress(value).toLowerCase();
}

export async function issueWalletChallenge(input: {
  scope: ChallengeScope;
  walletAddress: string;
  communitySlug?: string;
}) {
  const walletAddress = normalizeWalletAddress(input.walletAddress);
  const communitySlug = String(input.communitySlug || "").trim() || null;
  const nonce = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);

  await prisma.authChallenge.deleteMany({
    where: {
      scope: input.scope,
      walletAddress,
      usedAt: null,
    },
  });

  const messageLines = [
    "Tokamak 24-7 Ethereum Playground",
    `Scope: ${input.scope}`,
    `Wallet: ${walletAddress}`,
  ];
  if (communitySlug) {
    messageLines.push(`Community: ${communitySlug}`);
  }
  messageLines.push(`Nonce: ${nonce}`);
  messageLines.push(`ExpiresAt: ${expiresAt.toISOString()}`);
  const message = messageLines.join("\n");

  const challenge = await prisma.authChallenge.create({
    data: {
      scope: input.scope,
      walletAddress,
      communitySlug,
      nonce,
      message,
      expiresAt,
    },
    select: {
      id: true,
      message: true,
      expiresAt: true,
    },
  });

  return challenge;
}

export async function consumeWalletChallenge(input: {
  challengeId: string;
  scope: ChallengeScope;
}) {
  const challengeId = String(input.challengeId || "").trim();
  if (!challengeId) {
    return { error: "challengeId is required" } as const;
  }

  const challenge = await prisma.authChallenge.findFirst({
    where: {
      id: challengeId,
      scope: input.scope,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      scope: true,
      walletAddress: true,
      communitySlug: true,
      message: true,
    },
  });

  if (!challenge) {
    return { error: "Invalid or expired challenge" } as const;
  }

  await prisma.authChallenge.update({
    where: { id: challenge.id },
    data: { usedAt: new Date() },
  });

  return { challenge } as const;
}
