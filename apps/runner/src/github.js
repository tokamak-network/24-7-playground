function parseGithubRepositoryUrl(input) {
  let url;
  try {
    url = new URL(String(input || "").trim());
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") {
    return null;
  }

  const parts = url.pathname
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");
  if (!owner || !repo) {
    return null;
  }

  return {
    owner,
    repo,
    canonicalUrl: `https://github.com/${owner}/${repo}`,
  };
}

function buildReportIssueTitle(threadTitle) {
  const title = String(threadTitle || "").trim() || "Agent report";
  return `[Report] ${title}`.slice(0, 250);
}

function buildReportIssueBody(input) {
  return [
    "## Source",
    `- Community: ${String(input.communityName || "").trim() || "unknown"}`,
    `- Thread ID: ${String(input.threadId || "").trim() || "unknown"}`,
    `- Thread URL: ${String(input.threadUrl || "").trim() || "unknown"}`,
    `- Author: ${String(input.author || "").trim() || "SYSTEM"}`,
    `- Created At: ${String(input.createdAtIso || "").trim() || new Date().toISOString()}`,
    "",
    "## Report Body",
    String(input.threadBody || "").trim() || "(empty)",
  ].join("\n");
}

function buildReportCommentIssueTitle(threadTitle) {
  const title = String(threadTitle || "").trim() || "Agent report comment";
  return `[Report Comment] ${title}`.slice(0, 250);
}

function buildReportCommentIssueBody(input) {
  return [
    "## Source",
    `- Community: ${String(input.communityName || "").trim() || "unknown"}`,
    `- Thread ID: ${String(input.threadId || "").trim() || "unknown"}`,
    `- Thread URL: ${String(input.threadUrl || "").trim() || "unknown"}`,
    `- Comment ID: ${String(input.commentId || "").trim() || "unknown"}`,
    `- Comment URL: ${String(input.commentUrl || "").trim() || "unknown"}`,
    `- Author: ${String(input.author || "").trim() || "SYSTEM"}`,
    `- Created At: ${String(input.createdAtIso || "").trim() || new Date().toISOString()}`,
    "",
    "## Parent Report Thread",
    `- Title: ${String(input.threadTitle || "").trim() || "unknown"}`,
    "",
    String(input.threadBody || "").trim() || "(empty)",
    "",
    "## Report Comment Body",
    String(input.commentBody || "").trim() || "(empty)",
  ].join("\n");
}

async function createGithubIssue(input) {
  const parsed = parseGithubRepositoryUrl(input.repositoryUrl);
  if (!parsed) {
    throw new Error("Invalid GitHub repository URL.");
  }

  const issueToken = String(input.issueToken || "").trim();
  if (!issueToken) {
    throw new Error("GitHub issue token is required.");
  }

  const response = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/issues`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${issueToken}`,
        "Content-Type": "application/json",
        "User-Agent": "tokamak-24-7-playground-runner",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        title: String(input.title || "").trim(),
        body: String(input.body || "").trim(),
      }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = String(data && data.message ? data.message : "").trim();
    throw new Error(message || `GitHub issue creation failed (${response.status})`);
  }

  return {
    issueNumber:
      typeof data.number === "number" && Number.isFinite(data.number)
        ? data.number
        : null,
    issueUrl: String(data.html_url || "").trim() || "",
    repositoryUrl: parsed.canonicalUrl,
  };
}

module.exports = {
  parseGithubRepositoryUrl,
  buildReportIssueTitle,
  buildReportIssueBody,
  buildReportCommentIssueTitle,
  buildReportCommentIssueBody,
  createGithubIssue,
};
