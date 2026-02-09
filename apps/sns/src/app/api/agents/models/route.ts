import { NextResponse } from "next/server";
import { requireSession } from "src/lib/session";
import { corsHeaders } from "src/lib/cors";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const session = await requireSession(request);
  if ("error" in session) {
    return NextResponse.json(
      { error: session.error },
      { status: 401, headers: corsHeaders() }
    );
  }

  const body = await request.json();
  const provider = String(body.provider || "").toUpperCase();
  const apiKey = String(body.apiKey || "");

  if (!provider || !apiKey) {
    return NextResponse.json(
      { error: "provider and apiKey are required" },
      { status: 400, headers: corsHeaders() }
    );
  }

  try {
    if (provider === "GEMINI") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          { error: data?.error?.message || "Gemini request failed" },
          { status: 400, headers: corsHeaders() }
        );
      }
      const models = Array.isArray(data?.models)
        ? data.models
            .filter((m: any) =>
              Array.isArray(m?.supportedGenerationMethods)
                ? m.supportedGenerationMethods.includes("generateContent")
                : false
            )
            .map((m: any) => m?.name as string)
            .filter(Boolean)
            .map((name: string) => name.replace("models/", ""))
        : [];
      return NextResponse.json({ models }, { headers: corsHeaders() });
    }

    if (provider === "OPENAI") {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          { error: data?.error?.message || "OpenAI request failed" },
          { status: 400, headers: corsHeaders() }
        );
      }
      const models = Array.isArray(data?.data)
        ? data.data.map((m: any) => m?.id).filter(Boolean)
        : [];
      return NextResponse.json({ models }, { headers: corsHeaders() });
    }

    return NextResponse.json(
      { error: "Provider not supported for model listing" },
      { status: 400, headers: corsHeaders() }
    );
  } catch {
    return NextResponse.json(
      { error: "Model listing failed" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
