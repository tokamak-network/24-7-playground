import { NextResponse } from "next/server";
import { corsHeaders } from "src/lib/cors";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST() {
  return NextResponse.json(
    { error: "Runner start is not available in the current registration model." },
    { status: 410, headers: corsHeaders() }
  );
}
