import { NextResponse } from "next/server";
import { generateApiKey, prisma } from "src/db";
import { getAddress, verifyMessage } from "ethers";
import { firstTextLimitError, getDosTextLimits } from "src/lib/textLimits";

function normalizeProvider(value: unknown) {
  const raw = String(value || "").trim().toUpperCase();
  if (!raw) return "GEMINI";
  return raw;
}

function normalizeModel(value: unknown, provider: string) {
  const raw = String(value || "").trim();
  if (raw) return raw;
  if (provider === "ANTHROPIC") return "claude-3-5-sonnet-20240620";
  if (provider === "OPENAI" || provider === "LITELLM") return "gpt-4o-mini";
  return "gemini-1.5-flash-002";
}

export async function POST(request: Request) {
  const body = await request.json();
  const handle = String(body.handle || "").trim();
  const signature = String(body.signature || "").trim();
  const communityId = String(body.communityId || "").trim();
  const llmProvider = normalizeProvider(body.llmProvider);
  const llmModel = normalizeModel(body.llmModel, llmProvider);
  let textLimits: Awaited<ReturnType<typeof getDosTextLimits>>;
  try {
    textLimits = await getDosTextLimits();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Text limit policy is unavailable.",
      },
      { status: 503 }
    );
  }

  if (!handle || !signature || !communityId) {
    return NextResponse.json(
      { error: "handle, signature, and communityId are required" },
      { status: 400 }
    );
  }
  const textLimitError = firstTextLimitError([
    {
      field: "handle",
      value: handle,
      max: textLimits.agent.handle,
    },
    {
      field: "llmProvider",
      value: llmProvider,
      max: textLimits.agent.llmProvider,
    },
    {
      field: "llmModel",
      value: llmModel,
      max: textLimits.agent.llmModel,
    },
  ]);
  if (textLimitError) {
    return NextResponse.json({ error: textLimitError }, { status: 400 });
  }

  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true, slug: true, status: true },
  });
  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }
  if (community.status === "CLOSED") {
    return NextResponse.json({ error: "Community is closed" }, { status: 403 });
  }

  const authMessage = `24-7-playground${community.slug}`;
  let ownerWallet: string;
  try {
    ownerWallet = getAddress(verifyMessage(authMessage, signature)).toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const existingPair = await prisma.agent.findFirst({
    where: { ownerWallet, communityId: community.id },
    select: { id: true, handle: true, ownerWallet: true, communityId: true },
  });

  const banned = await prisma.communityBannedAgent.findFirst({
    where: {
      communityId: community.id,
      ownerWallet: {
        equals: ownerWallet,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });
  if (banned) {
    return NextResponse.json(
      { error: "This wallet is banned in the selected community" },
      { status: 403 }
    );
  }

  const agent = existingPair
    ? await prisma.agent.update({
        where: { id: existingPair.id },
        data: {
          handle,
          llmProvider,
          llmModel,
        },
        select: {
          id: true,
          handle: true,
          ownerWallet: true,
          communityId: true,
          llmProvider: true,
          llmModel: true,
        },
      })
    : await prisma.agent.create({
        data: {
          handle,
          ownerWallet,
          communityId: community.id,
          llmProvider,
          llmModel,
        },
        select: {
          id: true,
          handle: true,
          ownerWallet: true,
          communityId: true,
          llmProvider: true,
          llmModel: true,
        },
      });

  const existingKey = await prisma.apiKey.findUnique({
    where: { agentId: agent.id },
    select: { id: true, communityId: true },
  });

  if (existingKey) {
    return NextResponse.json({
      agent,
      community,
      isExistingKey: true,
    });
  }

  const generatedKey = generateApiKey();
  await prisma.apiKey.create({
    data: {
      agentId: agent.id,
      communityId: community.id,
      value: generatedKey,
    },
  });

  return NextResponse.json({ agent, community, isExistingKey: false });
}
