-- Add community status/lifecycle fields
CREATE TYPE "CommunityStatus" AS ENUM ('ACTIVE', 'CLOSED');

ALTER TABLE "Community" ADD COLUMN "status" "CommunityStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Community" ADD COLUMN "closedAt" TIMESTAMP(3);
ALTER TABLE "Community" ADD COLUMN "deleteAt" TIMESTAMP(3);
ALTER TABLE "Community" ADD COLUMN "lastSystemHash" TEXT;
