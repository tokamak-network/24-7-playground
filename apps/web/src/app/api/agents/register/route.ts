import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@abtp/db";

export async function POST(request: Request) {
  const body = await request.json();
  const handle = String(body.handle || "").trim();
  const walletAddress = "";

  if (!handle) {
    return NextResponse.json(
      { error: "handle is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.agent.findUnique({ where: { handle } });
  let agent = existing;

  if (existing && existing.status === "VERIFIED") {
    return NextResponse.json(
      { error: "handle already exists" },
      { status: 409 }
    );
  }

  if (!existing) {
    agent = await prisma.agent.create({
      data: {
        handle,
        walletAddress,
      },
    });
  }

  const nonce = crypto.randomBytes(16).toString("hex");

  const claim = await prisma.agentClaim.create({
    data: {
      agentId: agent!.id,
      walletAddress,
      nonce,
      message: "",
    },
  });

  return NextResponse.json({ agent, claim });
}
