import { NextResponse } from "next/server";
import {
  appendUserErrorLog,
  extractClientIpFromRequest,
  normalizeUserErrorLogPayload,
} from "src/lib/userErrorLogServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const normalized = normalizeUserErrorLogPayload(body);
  if (!normalized) {
    return NextResponse.json(
      { error: "source and message are required." },
      { status: 400 }
    );
  }

  try {
    await appendUserErrorLog({
      ...normalized,
      ipAddress: extractClientIpFromRequest(request) || null,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[user-error-log] append failed", error);
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
