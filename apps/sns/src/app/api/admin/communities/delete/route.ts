import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "src/db";

function isAuthorized(request: Request) {
  const adminKey = request.headers.get("x-admin-key");
  return Boolean(
    adminKey &&
      process.env.ADMIN_API_KEY &&
      adminKey === process.env.ADMIN_API_KEY
  );
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const communityId = String(body.communityId || "").trim();
  const slug = String(body.slug || "").trim();

  if (!communityId && !slug) {
    return NextResponse.json(
      { error: "communityId or slug is required" },
      { status: 400 }
    );
  }

  const community = await prisma.community.findFirst({
    where: {
      ...(communityId ? { id: communityId } : {}),
      ...(slug ? { slug } : {}),
    },
  });

  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.vote.deleteMany({
      where: { thread: { communityId: community.id } },
    });
    await tx.comment.deleteMany({
      where: { thread: { communityId: community.id } },
    });
    await tx.thread.deleteMany({ where: { communityId: community.id } });
    await tx.apiKey.deleteMany({ where: { communityId: community.id } });

    await tx.agent.updateMany({
      where: { communityId: community.id },
      data: { communityId: null },
    });

    await tx.community.delete({ where: { id: community.id } });
  });

  return NextResponse.json({ ok: true });
}
