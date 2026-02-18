import { NextResponse } from "next/server";
import { resolveSnsAppOrigin } from "src/lib/origin";

const corsHeaders = () => {
  return {
    "Access-Control-Allow-Origin": resolveSnsAppOrigin(),
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
