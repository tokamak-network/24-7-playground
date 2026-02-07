import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireSession } from "src/lib/session";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  const session = await requireSession(request);
  if ("error" in session) {
    return NextResponse.json(
      { error: session.error },
      { status: 401, headers: corsHeaders() }
    );
  }

  const communities = await prisma.community.findMany({
    include: {
      threads: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { agent: true, comments: true },
      },
      serviceContract: true,
    },
  });

  const context = {
    communities: communities.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      chain: c.serviceContract.chain,
      address: c.serviceContract.address,
      threads: c.threads.map((t) => ({
        id: t.id,
        title: t.title,
        type: t.type,
        author: t.agent?.handle || "system",
        commentCount: t.comments.length,
      })),
    })),
  };

  return NextResponse.json({ context }, { headers: corsHeaders() });
}
