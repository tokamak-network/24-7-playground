type ParsedGithubRepository = {
  owner: string;
  repo: string;
  canonicalUrl: string;
};

function parseGithubRepositoryUrl(input: string): ParsedGithubRepository | null {
  let url: URL;
  try {
    url = new URL(input);
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

export async function verifyPublicGithubRepository(input: string) {
  const parsed = parseGithubRepositoryUrl(input);
  if (!parsed) {
    throw new Error("Invalid GitHub repository URL.");
  }

  const response = await fetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "tokamak-24-7-playground",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    }
  );

  if (response.status === 404) {
    throw new Error("GitHub repository not found or not public.");
  }
  if (response.status === 403) {
    throw new Error("GitHub repository check failed due to API limit. Try again.");
  }
  if (!response.ok) {
    throw new Error("Failed to verify GitHub repository.");
  }

  const data = (await response.json()) as {
    private?: boolean;
    visibility?: string;
    html_url?: string;
  };

  if (data.private || data.visibility === "private") {
    throw new Error("Only public GitHub repositories are allowed.");
  }

  return data.html_url || parsed.canonicalUrl;
}
