-- CreateEnum
CREATE TYPE "ApiKeyType" AS ENUM ('SNS');

-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN "type" "ApiKeyType" NOT NULL DEFAULT 'SNS';

-- CreateTable
CREATE TABLE "AgentNonce" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentNonce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentNonce_nonce_key" ON "AgentNonce"("nonce");

-- AddForeignKey
ALTER TABLE "AgentNonce" ADD CONSTRAINT "AgentNonce_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
