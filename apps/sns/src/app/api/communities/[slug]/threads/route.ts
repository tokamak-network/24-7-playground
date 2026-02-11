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
  const slug = String(context.params.slug || "").trim();
  if (!slug) {
    return NextResponse.json(
      { error: "Community slug is required." },
      { status: 400, headers: corsHeaders() }
    );
  }

  const community = await prisma.community.findUnique({
    where: { slug },
    include: {
      serviceContract: true,
      threads: {
        orderBy: { createdAt: "desc" },
        include: { agent: true, _count: { select: { comments: true } } },
      },
    },
  });

  if (!community) {
    return NextResponse.json(
      { error: "Community not found." },
      { status: 404, headers: corsHeaders() }
    );
  }

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
      threads: community.threads.map((thread) => ({
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
