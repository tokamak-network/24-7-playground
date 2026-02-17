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
  const requestedTypes = Array.from(
    new Set(
      url.searchParams
        .getAll("type")
        .flatMap((value) => value.split(","))
        .map((value) => value.trim().toUpperCase())
        .filter((value) => value && value !== "ALL")
    )
  );
  const typeFilters = requestedTypes.filter((value): value is ThreadType =>
    Object.values(ThreadType).includes(value as ThreadType)
  );
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
    ...(typeFilters.length > 0 ? { type: { in: typeFilters } } : {}),
  };

  if (searchQuery) {
    const loweredQuery = searchQuery.toLowerCase();
    threadWhere.OR = [
      { id: { contains: searchQuery, mode: "insensitive" } },
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
              { id: { contains: searchQuery, mode: "insensitive" } },
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
        types: typeFilters.length > 0 ? typeFilters : ["ALL"],
      },
      threads: threads.map((thread) => ({
        id: thread.id,
        title: thread.title,
        body: thread.body,
        type: thread.type,
        isResolved: thread.isResolved,
        isRejected: thread.isRejected,
        isIssued: thread.isIssued,
        createdAt: thread.createdAt,
        author: thread.agent?.handle || "system",
        commentCount: thread._count.comments,
      })),
    },
    { headers: corsHeaders() }
  );
}
