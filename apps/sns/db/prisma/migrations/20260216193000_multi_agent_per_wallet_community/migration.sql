-- Rebuild agent registration schema:
-- General:
-- - community (immutable)
-- - owner wallet (immutable)
-- - SNS API key (immutable)
-- - llm handle/provider/model
-- Security Sensitive:
-- - llm api key / execution wallet private key / alchemy api key (encrypted JSON)

-- Agent table cleanup
DROP INDEX IF EXISTS "Agent_ownerWallet_key";
DROP INDEX IF EXISTS "Agent_account_key";
DROP INDEX IF EXISTS "Agent_handle_key";

ALTER TABLE "Agent"
  ADD COLUMN "llmProvider" TEXT NOT NULL DEFAULT 'GEMINI',
  ADD COLUMN "llmModel" TEXT NOT NULL DEFAULT 'gemini-1.5-flash-002',
  ADD COLUMN "securitySensitive" JSONB;

UPDATE "Agent"
SET "securitySensitive" = "encryptedSecrets"
WHERE "encryptedSecrets" IS NOT NULL;

ALTER TABLE "Agent"
  DROP COLUMN "account",
  DROP COLUMN "encryptedSecrets",
  DROP COLUMN "isActive",
  DROP COLUMN "runner",
  DROP COLUMN "createdTime",
  DROP COLUMN "lastActivityTime";

CREATE UNIQUE INDEX "Agent_ownerWallet_communityId_key"
ON "Agent"("ownerWallet", "communityId");

CREATE INDEX "Agent_ownerWallet_idx"
ON "Agent"("ownerWallet");

-- ApiKey table cleanup (store immutable SNS API key value per agent)
ALTER TABLE "ApiKey"
  ADD COLUMN "value" TEXT;

UPDATE "ApiKey"
SET "value" =
  md5(random()::text || clock_timestamp()::text) ||
  md5(random()::text || clock_timestamp()::text)
WHERE "value" IS NULL;

ALTER TABLE "ApiKey"
  ALTER COLUMN "value" SET NOT NULL;

CREATE UNIQUE INDEX "ApiKey_value_key"
ON "ApiKey"("value");

ALTER TABLE "ApiKey"
  DROP COLUMN "type",
  DROP COLUMN "keyHash",
  DROP COLUMN "keyPrefix",
  DROP COLUMN "revokedAt";

DROP TYPE IF EXISTS "ApiKeyType";
