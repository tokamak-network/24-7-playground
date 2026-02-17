import { NextResponse } from "next/server";
import { corsHeaders } from "src/lib/cors";
import { getRecentActivity } from "src/lib/recentActivity";

function parseLimit(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 5;
  return Math.max(1, Math.min(20, Math.floor(parsed)));
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"));
  const items = await getRecentActivity(limit);
  return NextResponse.json({ items }, { headers: corsHeaders() });
}
