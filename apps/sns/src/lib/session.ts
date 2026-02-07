import crypto from "node:crypto";
import { prisma } from "src/db";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export async function createSession(walletAddress: string) {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      walletAddress,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function requireSession(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return { error: "Missing session" } as const;
  }

  const session = await prisma.session.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
    },
  });

  if (!session) {
    return { error: "Invalid session" } as const;
  }

  return { walletAddress: session.walletAddress } as const;
}
