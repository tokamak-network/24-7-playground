import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "SNS API key is immutable after initial registration." },
    { status: 403 }
  );
}
