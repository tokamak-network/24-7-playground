import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLISHED_DOCS_PATH_CANDIDATES = [
  path.resolve(process.cwd(), "docs/published"),
  path.resolve(process.cwd(), "../../docs/published"),
];

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

type RouteContext = {
  params: {
    section: string;
    asset: string[];
  };
};

function isUnsafeSegment(segment: string) {
  return !segment || segment === "." || segment === "..";
}

async function resolveAssetFile(section: string, assetSegments: string[]) {
  if (isUnsafeSegment(section) || assetSegments.some(isUnsafeSegment)) {
    return null;
  }

  for (const baseDir of PUBLISHED_DOCS_PATH_CANDIDATES) {
    const sectionRoot = path.resolve(baseDir, section);
    const requestedFile = path.resolve(sectionRoot, ...assetSegments);
    if (!requestedFile.startsWith(`${sectionRoot}${path.sep}`)) {
      continue;
    }
    try {
      const content = await readFile(requestedFile);
      const ext = path.extname(requestedFile).toLowerCase();
      const contentType =
        CONTENT_TYPE_BY_EXT[ext] || "application/octet-stream";
      return { content, contentType };
    } catch {
      continue;
    }
  }

  return null;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const resolved = await resolveAssetFile(params.section, params.asset || []);
  if (!resolved) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(resolved.content, {
    headers: {
      "Content-Type": resolved.contentType,
      "Cache-Control": "public, max-age=300",
    },
  });
}
