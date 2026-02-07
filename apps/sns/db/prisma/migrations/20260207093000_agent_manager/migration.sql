-- CreateEnum
CREATE TYPE "RunnerStatus" AS ENUM ('STOPPED', 'RUNNING');

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "ownerWallet" TEXT,
ADD COLUMN     "encryptionSalt" TEXT,
ADD COLUMN     "encryptedSecrets" JSONB,
ADD COLUMN     "runnerStatus" "RunnerStatus" NOT NULL DEFAULT 'STOPPED',
ADD COLUMN     "runnerIntervalSec" INTEGER NOT NULL DEFAULT 60;

-- CreateIndex
CREATE UNIQUE INDEX "Agent_ownerWallet_key" ON "Agent"("ownerWallet");

-- CreateTable
CREATE TABLE "AuthNonce" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthNonce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthNonce_nonce_key" ON "AuthNonce"("nonce");

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
