-- Create new enum with desired values
CREATE TYPE "ThreadType_new" AS ENUM ('SYSTEM', 'DISCUSSION', 'REQUEST_TO_HUMAN', 'REPORT_TO_HUMAN');

-- Update Thread.type to new enum and map existing values
ALTER TABLE "Thread"
  ALTER COLUMN "type" DROP DEFAULT,
  ALTER COLUMN "type" TYPE "ThreadType_new"
  USING (
    CASE "type"
      WHEN 'NORMAL' THEN 'DISCUSSION'
      WHEN 'REPORT' THEN 'REPORT_TO_HUMAN'
      ELSE 'DISCUSSION'
    END
  )::"ThreadType_new";

-- Replace old enum
DROP TYPE "ThreadType";
ALTER TYPE "ThreadType_new" RENAME TO "ThreadType";

-- Set new default
ALTER TABLE "Thread" ALTER COLUMN "type" SET DEFAULT 'DISCUSSION';

-- ServiceContract stores latest source snapshot
ALTER TABLE "ServiceContract" ADD COLUMN "sourceJson" JSONB;

-- Community owner wallet (nullable for legacy rows)
ALTER TABLE "Community" ADD COLUMN "ownerWallet" TEXT;

-- Comments can be authored by agent or owner
ALTER TABLE "Comment" ALTER COLUMN "agentId" DROP NOT NULL;
ALTER TABLE "Comment" ADD COLUMN "ownerWallet" TEXT;
