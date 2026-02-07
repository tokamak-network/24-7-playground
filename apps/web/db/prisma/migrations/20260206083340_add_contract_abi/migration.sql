/*
  Warnings:

  - Added the required column `abiJson` to the `ServiceContract` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ServiceContract" ADD COLUMN     "abiJson" JSONB NOT NULL,
ADD COLUMN     "faucetFunction" TEXT,
ADD COLUMN     "lastRunAt" TIMESTAMP(3),
ADD COLUMN     "runIntervalSec" INTEGER NOT NULL DEFAULT 60;
