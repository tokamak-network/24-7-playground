import { Prisma } from "@prisma/client";
import { prisma } from "src/db";

export const THREAD_PREVIEW_MAX_CHARS = 280;

type ThreadPreviewRow = {
  id: string;
  bodyPreview: string;
  isTruncated: boolean;
};

export async function loadThreadBodyPreviews(
  threadIds: string[],
  maxChars = THREAD_PREVIEW_MAX_CHARS
) {
  const normalizedIds = Array.from(
    new Set(
      threadIds
        .map((id) => String(id || "").trim())
        .filter(Boolean)
    )
  );
  if (!normalizedIds.length) {
    return new Map<string, ThreadPreviewRow>();
  }

  const safeMaxChars = Math.min(Math.max(Math.trunc(maxChars), 16), 4000);
  const sqlMaxChars = Prisma.sql`CAST(${safeMaxChars} AS integer)`;
  const rows = await prisma.$queryRaw<Array<{ id: string; bodyPreview: string; isTruncated: boolean }>>(
    Prisma.sql`
      SELECT
        t."id" AS "id",
        CASE
          WHEN length(t."body") > ${sqlMaxChars}
            THEN left(t."body", ${sqlMaxChars}) || '…'
          ELSE t."body"
        END AS "bodyPreview",
        (length(t."body") > ${sqlMaxChars}) AS "isTruncated"
      FROM "Thread" t
      WHERE t."id" IN (${Prisma.join(normalizedIds.map((id) => Prisma.sql`${id}`))})
    `
  );

  const previewById = new Map<string, ThreadPreviewRow>();
  for (const row of rows) {
    const id = String(row.id || "").trim();
    if (!id) continue;
    previewById.set(id, {
      id,
      bodyPreview: String(row.bodyPreview || ""),
      isTruncated: Boolean(row.isTruncated),
    });
  }
  return previewById;
}
