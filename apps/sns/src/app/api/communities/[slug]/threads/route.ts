import { Prisma, ThreadType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { cleanupExpiredCommunities } from "src/lib/community";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(
  request: Request,
  context: { params: { slug: string } }
) {
  await cleanupExpiredCommunities();
  const url = new URL(request.url);
  const slug = String(context.params.slug || "").trim();
  const searchQuery = String(url.searchParams.get("q") || "").trim().slice(0, 160);
  const typeParam = String(url.searchParams.get("type") || "").trim().toUpperCase();
  const typeFilter =
    typeParam && typeParam !== "ALL" && Object.values(ThreadType).includes(typeParam as ThreadType)
      ? (typeParam as ThreadType)
      : null;
  if (!slug) {
    return NextResponse.json(
      { error: "Community slug is required." },
      { status: 400, headers: corsHeaders() }
    );
  }

  const community = await prisma.community.findUnique({
    where: { slug },
    include: { serviceContract: true },
  });

  if (!community) {
    return NextResponse.json(
      { error: "Community not found." },
      { status: 404, headers: corsHeaders() }
    );
  }

  const threadWhere: Prisma.ThreadWhereInput = {
    communityId: community.id,
    ...(typeFilter ? { type: typeFilter } : {}),
  };

  if (searchQuery) {
    const loweredQuery = searchQuery.toLowerCase();
    threadWhere.OR = [
      { title: { contains: searchQuery, mode: "insensitive" } },
      { body: { contains: searchQuery, mode: "insensitive" } },
      {
        agent: {
          is: {
            handle: { contains: searchQuery, mode: "insensitive" },
          },
        },
      },
      {
        comments: {
          some: {
            OR: [
              { body: { contains: searchQuery, mode: "insensitive" } },
              { ownerWallet: { contains: searchQuery, mode: "insensitive" } },
              {
                agent: {
                  is: {
                    handle: { contains: searchQuery, mode: "insensitive" },
                  },
                },
              },
            ],
          },
        },
      },
      ...(loweredQuery.includes("system") ? [{ agentId: null }] : []),
    ];
  }

  const threads = await prisma.thread.findMany({
    where: threadWhere,
    orderBy: { createdAt: "desc" },
    include: { agent: true, _count: { select: { comments: true } } },
  });

  return NextResponse.json(
    {
      community: {
        id: community.id,
        slug: community.slug,
        name: community.name,
        description: community.description,
        status: community.status,
        chain: community.serviceContract.chain,
        address: community.serviceContract.address,
      },
      filters: {
        q: searchQuery,
        type: typeFilter || "ALL",
      },
      threads: threads.map((thread) => ({
        id: thread.id,
        title: thread.title,
        body: thread.body,
        type: thread.type,
        createdAt: thread.createdAt,
        author: thread.agent?.handle || "system",
        commentCount: thread._count.comments,
      })),
    },
    { headers: corsHeaders() }
  );
}
