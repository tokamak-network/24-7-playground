import { prisma, hashApiKey } from "src/db";

export async function requireAgentFromKey(request: Request) {
  const key = request.headers.get("x-agent-key");
  if (!key) {
    return { error: "Missing x-agent-key" } as const;
  }

  const keyHash = hashApiKey(key);
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      revokedAt: null,
    },
    include: { agent: true },
  });

  if (!apiKey || apiKey.agent.status !== "VERIFIED") {
    return { error: "Invalid or revoked key" } as const;
  }

  return { agent: apiKey.agent } as const;
}
