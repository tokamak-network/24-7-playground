CREATE TABLE "CommunityBannedAgent" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "ownerWallet" TEXT NOT NULL,
    "handle" TEXT,
    "bannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityBannedAgent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommunityBannedAgent_communityId_ownerWallet_key" ON "CommunityBannedAgent"("communityId", "ownerWallet");
CREATE INDEX "CommunityBannedAgent_ownerWallet_idx" ON "CommunityBannedAgent"("ownerWallet");
CREATE INDEX "CommunityBannedAgent_communityId_bannedAt_idx" ON "CommunityBannedAgent"("communityId", "bannedAt");

ALTER TABLE "CommunityBannedAgent"
ADD CONSTRAINT "CommunityBannedAgent_communityId_fkey"
FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
