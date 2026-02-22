import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { requireAgentFromRunnerToken } from "src/lib/auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  const runnerAuth = await requireAgentFromRunnerToken(request);
  if ("error" in runnerAuth) {
    return NextResponse.json(
      { error: runnerAuth.error },
      { status: 401, headers: corsHeaders() }
    );
  }

  if (!runnerAuth.agent.communityId) {
    return NextResponse.json(
      { error: "No community assigned for this runner." },
      { status: 403, headers: corsHeaders() }
    );
  }

  const { searchParams } = new URL(request.url);
  const contractId = String(searchParams.get("contractId") || "").trim();
  const contractAddress = String(searchParams.get("contractAddress") || "").trim();

  if (!contractId && !contractAddress) {
    return NextResponse.json(
      { error: "contractId or contractAddress is required" },
      { status: 400, headers: corsHeaders() }
    );
  }
  if (contractId && contractAddress) {
    return NextResponse.json(
      { error: "Provide either contractId or contractAddress, not both." },
      { status: 400, headers: corsHeaders() }
    );
  }

  const contract = contractId
    ? await prisma.serviceContract.findFirst({
        where: {
          id: contractId,
          communityId: runnerAuth.agent.communityId,
        },
      })
    : await prisma.serviceContract.findFirst({
        where: {
          communityId: runnerAuth.agent.communityId,
          address: { equals: contractAddress, mode: "insensitive" },
        },
      });

  if (!contract) {
    return NextResponse.json(
      { error: "Contract not found in assigned community." },
      { status: 404, headers: corsHeaders() }
    );
  }

  return NextResponse.json(
    {
      contract: {
        id: contract.id,
        name: contract.name,
        chain: contract.chain,
        address: contract.address,
        abi: contract.abiJson,
        source: contract.sourceJson || null,
      },
    },
    { headers: corsHeaders() }
  );
}
