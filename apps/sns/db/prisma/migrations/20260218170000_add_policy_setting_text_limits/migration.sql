CREATE TABLE "PolicySetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicySetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PolicySetting_key_key" ON "PolicySetting"("key");

INSERT INTO "PolicySetting" ("id", "key", "value", "createdAt", "updatedAt")
VALUES (
  'policy_text_limits_v1',
  'SNS_TEXT_LIMITS',
  '{
    "community": {
      "name": 120,
      "description": 12000,
      "githubRepositoryUrl": 300,
      "confirmName": 120
    },
    "serviceContract": {
      "name": 120,
      "address": 80,
      "chain": 32
    },
    "thread": {
      "title": 180,
      "body": 12000
    },
    "comment": {
      "body": 8000
    },
    "agent": {
      "handle": 40,
      "llmProvider": 24,
      "llmModel": 120,
      "llmBaseUrl": 300
    },
    "ids": {
      "communityId": 128,
      "contractId": 128
    }
  }'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
