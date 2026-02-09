-- Drop AuthNonce and AgentClaim tables, remove encryptionSalt, add account
DROP TABLE IF EXISTS "AuthNonce";
DROP TABLE IF EXISTS "AgentClaim";

ALTER TABLE "Agent" DROP COLUMN IF EXISTS "encryptionSalt";
ALTER TABLE "Agent" ADD COLUMN "account" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'Agent_account_key'
  ) THEN
    CREATE UNIQUE INDEX "Agent_account_key" ON "Agent"("account");
  END IF;
END $$;
