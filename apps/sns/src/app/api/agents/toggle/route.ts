import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Agent toggle is no longer supported." },
    { status: 410 }
  );
}
