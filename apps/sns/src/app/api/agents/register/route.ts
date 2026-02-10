import { NextResponse } from "next/server";
import { generateApiKey, prisma } from "src/db";
import { getAddress, verifyMessage } from "ethers";

export async function POST(request: Request) {
  const body = await request.json();
  const handle = String(body.handle || "").trim();
  const signature = String(body.signature || "").trim();
  const communityId = String(body.communityId || "").trim();

  if (!handle || !signature || !communityId) {
    return NextResponse.json(
      { error: "handle, signature, and communityId are required" },
      { status: 400 }
    );
  }

  const authMessage = "24-7-playground";
  let walletAddress: string;
  try {
    walletAddress = getAddress(verifyMessage(authMessage, signature)).toLowerCase();
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const community = await prisma.community.findUnique({
    where: { id: communityId },
  });
  if (!community) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 }
    );
  }
  if (community.status === "CLOSED") {
    return NextResponse.json(
      { error: "Community is closed" },
      { status: 403 }
    );
  }

  const existingOwner = await prisma.agent.findFirst({
    where: {
      ownerWallet: walletAddress,
      NOT: { handle },
    },
  });

  if (existingOwner) {
    return NextResponse.json(
      { error: "wallet already has an agent handle" },
      { status: 409 }
    );
  }

  const existingAccount = await prisma.agent.findFirst({
    where: {
      account: signature,
      NOT: { handle },
    },
  });

  if (existingAccount) {
    return NextResponse.json(
      { error: "account already registered to another handle" },
      { status: 409 }
    );
  }

  const existing = await prisma.agent.findUnique({ where: { handle } });
  let agent = existing;
  const canUpdateExisting =
    existing &&
    existing.status === "VERIFIED" &&
    existing.ownerWallet === walletAddress;

  if (existing && existing.status === "VERIFIED" && !canUpdateExisting) {
    return NextResponse.json(
      { error: "handle already exists" },
      { status: 409 }
    );
  }

  if (!existing) {
    agent = await prisma.agent.create({
      data: {
        handle,
        walletAddress,
        ownerWallet: walletAddress,
        account: signature,
        communityId: community.id,
        communitySlug: community.slug,
        status: "VERIFIED",
      },
    });
  } else {
    agent = await prisma.agent.update({
      where: { id: existing.id },
      data: {
        walletAddress,
        ownerWallet: walletAddress,
        account: signature,
        communityId: community.id,
        communitySlug: community.slug,
        status: "VERIFIED",
      },
    });
  }

  const existingKey = await prisma.apiKey.findUnique({
    where: { agentId: agent!.id },
  });

  if (
    existingKey &&
    !existingKey.revokedAt &&
    existingKey.communityId === community.id
  ) {
    return NextResponse.json({ agent, community });
  }

  const { plain, prefix, hash } = generateApiKey();

  if (!plain) {
    return NextResponse.json(
      { error: "Failed to issue API key" },
      { status: 500 }
    );
  }

  await prisma.apiKey.upsert({
    where: { agentId: agent!.id },
    update: {
      revokedAt: null,
      keyHash: hash,
      keyPrefix: prefix,
      communityId: community.id,
    },
    create: {
      agentId: agent!.id,
      keyHash: hash,
      keyPrefix: prefix,
      communityId: community.id,
      type: "SNS",
    },
  });

  return NextResponse.json({ agent, community, apiKey: plain });
}
