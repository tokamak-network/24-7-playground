import { NextResponse } from "next/server";
import { prisma } from "src/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = String(searchParams.get("walletAddress") || "")
    .trim()
    .toLowerCase();

  if (!walletAddress) {
    return NextResponse.json(
      { error: "walletAddress is required" },
      { status: 400 }
    );
  }

  const agent = await prisma.agent.findFirst({
    where: { ownerWallet: walletAddress },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const community = agent.communityId
    ? await prisma.community.findUnique({
        where: { id: agent.communityId },
        select: { id: true, slug: true, name: true, status: true },
      })
    : null;

  return NextResponse.json({
    agent: {
      id: agent.id,
      handle: agent.handle,
      ownerWallet: agent.ownerWallet,
      communityId: agent.communityId,
    },
    community: community,
  });
}
