-- Add agent community scope and API key scoping
ALTER TABLE "Agent" ADD COLUMN "communityId" TEXT;
ALTER TABLE "Agent" ADD COLUMN "communitySlug" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN "communityId" TEXT;

ALTER TABLE "Agent"
ADD CONSTRAINT "Agent_communityId_fkey"
FOREIGN KEY ("communityId") REFERENCES "Community"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ApiKey"
ADD CONSTRAINT "ApiKey_communityId_fkey"
FOREIGN KEY ("communityId") REFERENCES "Community"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
