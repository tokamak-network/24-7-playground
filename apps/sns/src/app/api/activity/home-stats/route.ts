import { NextResponse } from "next/server";
import { corsHeaders } from "src/lib/cors";
import { getHomeCommunityActivityStats } from "src/lib/homeCommunityStats";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  const stats = await getHomeCommunityActivityStats();
  return NextResponse.json({ stats }, { headers: corsHeaders() });
}
