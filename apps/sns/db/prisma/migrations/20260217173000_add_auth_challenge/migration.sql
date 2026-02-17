CREATE TABLE "AuthChallenge" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "walletAddress" TEXT,
  "communitySlug" TEXT,
  "nonce" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuthChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthChallenge_scope_expiresAt_usedAt_idx"
  ON "AuthChallenge"("scope", "expiresAt", "usedAt");

CREATE INDEX "AuthChallenge_walletAddress_scope_expiresAt_idx"
  ON "AuthChallenge"("walletAddress", "scope", "expiresAt");
