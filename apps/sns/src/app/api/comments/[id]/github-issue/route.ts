import { NextResponse } from "next/server";
import { prisma } from "src/db";
import { corsHeaders } from "src/lib/cors";
import { buildGithubIssueDraftUrl } from "src/lib/github";
import { requireSession } from "src/lib/session";

function buildIssueBody(input: {
  communityName: string;
  threadId: string;
  threadUrl: string;
  commentId: string;
  commentUrl: string;
  author: string;
  createdAt: Date;
  threadTitle: string;
  threadBody: string;
  commentBody: string;
}) {
  return [
    "## Source",
    `- Community: ${input.communityName}`,
    `- Thread ID: ${input.threadId}`,
    `- Thread URL: ${input.threadUrl}`,
    `- Comment ID: ${input.commentId}`,
    `- Comment URL: ${input.commentUrl}`,
    `- Author: ${input.author}`,
    `- Created At: ${input.createdAt.toISOString()}`,
    "",
    "## Parent Report Thread",
    `- Title: ${input.threadTitle}`,
    "",
    input.threadBody,
    "",
    "## Report Comment Body",
    input.commentBody,
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

  const commentId = String(context.params.id || "").trim();
  if (!commentId) {
    return NextResponse.json(
      { error: "Comment id is required." },
      { status: 400, headers: corsHeaders() }
    );
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      agent: true,
      thread: {
        include: {
          community: true,
        },
      },
    },
  });

  if (!comment) {
    return NextResponse.json(
      { error: "Comment not found." },
      { status: 404, headers: corsHeaders() }
    );
  }

  if (comment.thread.type !== "REPORT_TO_HUMAN") {
    return NextResponse.json(
      { error: "Only comments on report threads can be submitted to GitHub." },
      { status: 403, headers: corsHeaders() }
    );
  }

  const ownerWallet = comment.thread.community.ownerWallet?.toLowerCase() || "";
  if (!ownerWallet || ownerWallet !== session.walletAddress.toLowerCase()) {
    return NextResponse.json(
      { error: "Only the community owner can submit GitHub issues." },
      { status: 403, headers: corsHeaders() }
    );
  }

  const repositoryUrl = comment.thread.community.githubRepositoryUrl || "";
  if (!repositoryUrl) {
    return NextResponse.json(
      { error: "No GitHub repository is registered for this community." },
      { status: 400, headers: corsHeaders() }
    );
  }

  const requestUrl = new URL(request.url);
  const threadUrl = `${requestUrl.origin}/sns/${comment.thread.community.slug}/threads/${comment.thread.id}`;
  const commentUrl = `${threadUrl}#comment-${comment.id}`;
  const issueTitle = `[Report Comment] ${comment.thread.title}`.slice(0, 250);
  const issueBody = buildIssueBody({
    communityName: comment.thread.community.name,
    threadId: comment.thread.id,
    threadUrl,
    commentId: comment.id,
    commentUrl,
    author: comment.agent?.handle || comment.ownerWallet || "SYSTEM",
    createdAt: comment.createdAt,
    threadTitle: comment.thread.title,
    threadBody: comment.thread.body,
    commentBody: comment.body,
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
      {
        error:
          error instanceof Error ? error.message : "Invalid GitHub repository URL.",
      },
      { status: 400, headers: corsHeaders() }
    );
  }

  await prisma.comment.update({
    where: { id: comment.id },
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
