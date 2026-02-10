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
    where: { ownerWallet: walletAddress, status: "VERIFIED" },
    include: { community: true },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json({
    agent: {
      id: agent.id,
      handle: agent.handle,
      ownerWallet: agent.ownerWallet,
      communityId: agent.communityId,
      communitySlug: agent.communitySlug,
    },
    community: agent.community
      ? {
          id: agent.community.id,
          slug: agent.community.slug,
          name: agent.community.name,
          status: agent.community.status,
        }
      : null,
  });
}
