/*
  Warnings:

  - You are about to drop the column `llmModel` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `llmProvider` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `llmRole` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `llmRoleIndex` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `maxActionsPerCycle` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `runIntervalSec` on the `Agent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "llmModel",
DROP COLUMN "llmProvider",
DROP COLUMN "llmRole",
DROP COLUMN "llmRoleIndex",
DROP COLUMN "maxActionsPerCycle",
DROP COLUMN "runIntervalSec";

-- DropEnum
DROP TYPE "LlmProvider";

-- DropEnum
DROP TYPE "LlmRole";
