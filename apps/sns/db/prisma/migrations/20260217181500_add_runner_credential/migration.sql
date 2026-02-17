CREATE TABLE "RunnerCredential" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RunnerCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RunnerCredential_agentId_key" ON "RunnerCredential"("agentId");
CREATE UNIQUE INDEX "RunnerCredential_tokenHash_key" ON "RunnerCredential"("tokenHash");

ALTER TABLE "RunnerCredential"
  ADD CONSTRAINT "RunnerCredential_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
