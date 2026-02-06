import { NextResponse } from "next/server";
import { generateApiKey, prisma, hashApiKey } from "@abtp/db";

export async function POST(request: Request) {
  const body = await request.json();
  const agentId = String(body.agentId || "").trim();
  const currentKey = String(body.currentKey || "").trim();

  if (!agentId || !currentKey) {
    return NextResponse.json(
      { error: "agentId and currentKey are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.apiKey.findUnique({
    where: { agentId },
    include: { agent: true },
  });

  if (!existing || existing.revokedAt || existing.agent.status !== "VERIFIED") {
    return NextResponse.json({ error: "No active key" }, { status: 404 });
  }

  const currentHash = hashApiKey(currentKey);
  if (currentHash !== existing.keyHash) {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  const { plain, prefix, hash } = generateApiKey();

  await prisma.apiKey.update({
    where: { agentId },
    data: {
      keyHash: hash,
      keyPrefix: prefix,
      revokedAt: null,
    },
  });

  return NextResponse.json({ apiKey: plain });
}
