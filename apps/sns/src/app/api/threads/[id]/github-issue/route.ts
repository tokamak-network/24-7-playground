import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { buildGithubIssueDraftUrl } from "src/lib/github";
import { requireSession } from "src/lib/session";

function buildIssueBody(input: {
  communityName: string;
  threadId: string;
  threadUrl: string;
  author: string;
  createdAt: Date;
  threadBody: string;
}) {
  return [
    "## Source",
    `- Community: ${input.communityName}`,
    `- Thread ID: ${input.threadId}`,
    `- Thread URL: ${input.threadUrl}`,
    `- Author: ${input.author}`,
    `- Created At: ${input.createdAt.toISOString()}`,
    "",
    "## Report Body",
    input.threadBody,
  ].join("\n");
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  const session = await requireSession(request);
  if ("error" in session) {
    return NextResponse.json(
      { error: session.error },
      { status: 401, headers: corsHeaders() }
    );
  }

  const threadId = String(context.params.id || "").trim();
  if (!threadId) {
    return NextResponse.json(
      { error: "Thread id is required." },
      { status: 400, headers: corsHeaders() }
    );
  }

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      agent: true,
      community: true,
    },
  });

  if (!thread) {
    return NextResponse.json(
      { error: "Thread not found." },
      { status: 404, headers: corsHeaders() }
    );
  }

  if (thread.type !== "REPORT_TO_HUMAN") {
    return NextResponse.json(
      { error: "Only report threads can be submitted to GitHub." },
      { status: 403, headers: corsHeaders() }
    );
  }
  if (thread.isIssued) {
    return NextResponse.json(
      { error: "This report is already issued on GitHub." },
      { status: 409, headers: corsHeaders() }
    );
  }

  const ownerWallet = thread.community.ownerWallet?.toLowerCase() || "";
  if (!ownerWallet || ownerWallet !== session.walletAddress.toLowerCase()) {
    return NextResponse.json(
      { error: "Only the community owner can submit GitHub issues." },
      { status: 403, headers: corsHeaders() }
    );
  }

  const repositoryUrl = thread.community.githubRepositoryUrl || "";
  if (!repositoryUrl) {
    return NextResponse.json(
      { error: "No GitHub repository is registered for this community." },
      { status: 400, headers: corsHeaders() }
    );
  }

  const requestUrl = new URL(request.url);
  const threadUrl = `${requestUrl.origin}/sns/${thread.community.slug}/threads/${thread.id}`;
  const issueTitle = `[Report] ${thread.title}`.slice(0, 250);
  const issueBody = buildIssueBody({
    communityName: thread.community.name,
    threadId: thread.id,
    threadUrl,
    author: thread.agent?.handle || "SYSTEM",
    createdAt: thread.createdAt,
    threadBody: thread.body,
  });

  let issueDraftUrl = "";
  try {
    issueDraftUrl = buildGithubIssueDraftUrl({
      repositoryUrl,
      title: issueTitle,
      body: issueBody,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid GitHub repository URL." },
      { status: 400, headers: corsHeaders() }
    );
  }

  await prisma.thread.update({
    where: { id: thread.id },
    data: { isIssued: true },
  });

  return NextResponse.json(
    {
      issueDraftUrl,
      repositoryUrl,
    },
    { headers: corsHeaders() }
  );
}
