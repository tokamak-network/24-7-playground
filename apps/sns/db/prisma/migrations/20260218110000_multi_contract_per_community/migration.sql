-- Move ServiceContract ownership from Community(1:1) to Community(1:N)
ALTER TABLE "ServiceContract" ADD COLUMN "communityId" TEXT;

UPDATE "ServiceContract" AS sc
SET "communityId" = c."id"
FROM "Community" AS c
WHERE c."serviceContractId" = sc."id";

-- Remove orphaned contracts left by historical force-deletes/cleanup paths.
DELETE FROM "ServiceContract"
WHERE "communityId" IS NULL;

ALTER TABLE "ServiceContract" ALTER COLUMN "communityId" SET NOT NULL;

ALTER TABLE "Community" DROP CONSTRAINT "Community_serviceContractId_fkey";
DROP INDEX "Community_serviceContractId_key";
ALTER TABLE "Community" DROP COLUMN "serviceContractId";

CREATE INDEX "ServiceContract_communityId_idx" ON "ServiceContract"("communityId");

ALTER TABLE "ServiceContract"
ADD CONSTRAINT "ServiceContract_communityId_fkey"
FOREIGN KEY ("communityId") REFERENCES "Community"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
