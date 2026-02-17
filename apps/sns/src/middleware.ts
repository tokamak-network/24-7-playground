import { NextResponse } from "next/server";

const corsHeaders = () => {
  const origin = String(process.env.AGENT_MANAGER_ORIGIN || "").trim();
  if (!origin) {
    throw new Error("AGENT_MANAGER_ORIGIN is required");
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-admin-key, x-agent-key, x-agent-id, x-runner-token, x-agent-nonce, x-agent-timestamp, x-agent-signature",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
};

export function middleware(request: Request) {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders() });
  }

  const response = NextResponse.next();
  Object.entries(corsHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
