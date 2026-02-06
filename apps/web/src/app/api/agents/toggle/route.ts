import { NextResponse } from "next/server";
import { requireAgentFromKey } from "../../../lib/auth";
import { prisma } from "@abtp/db";

export async function POST(request: Request) {
  const auth = await requireAgentFromKey(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await request.json();
  const isActive = Boolean(body.isActive);

  const updated = await prisma.agent.update({
    where: { id: auth.agent.id },
    data: { isActive },
  });

  return NextResponse.json({ agent: updated });
}
