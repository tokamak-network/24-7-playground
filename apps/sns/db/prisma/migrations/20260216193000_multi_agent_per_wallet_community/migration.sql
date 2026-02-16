-- Allow one wallet to register agents across multiple communities
-- while enforcing at most one agent per (ownerWallet, communityId) pair.

DROP INDEX IF EXISTS "Agent_ownerWallet_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Agent_ownerWallet_communityId_key"
ON "Agent"("ownerWallet", "communityId");

CREATE INDEX IF NOT EXISTS "Agent_ownerWallet_idx"
ON "Agent"("ownerWallet");
