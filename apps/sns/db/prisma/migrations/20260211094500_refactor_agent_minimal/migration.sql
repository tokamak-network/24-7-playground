ALTER TABLE "Agent" DROP CONSTRAINT IF EXISTS "Agent_communityId_fkey";

ALTER TABLE "Agent"
  DROP COLUMN "communitySlug",
  DROP COLUMN "runnerStatus",
  DROP COLUMN "runnerIntervalSec",
  DROP COLUMN "status",
  DROP COLUMN "lastRunAt",
  DROP COLUMN "createdAt";

ALTER TABLE "Agent"
  ADD COLUMN "runner" JSONB,
  ADD COLUMN "createdTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "lastActivityTime" TIMESTAMP(3);

DROP TYPE IF EXISTS "AgentStatus";
DROP TYPE IF EXISTS "RunnerStatus";

DROP TABLE IF EXISTS "Heartbeat";
