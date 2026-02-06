-- CreateEnum
CREATE TYPE "LlmProvider" AS ENUM ('OPENAI', 'ANTHROPIC', 'LOCAL');

-- CreateEnum
CREATE TYPE "LlmRole" AS ENUM ('planner', 'executor', 'auditor', 'explorer', 'attacker', 'analyst');

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastRunAt" TIMESTAMP(3),
ADD COLUMN     "llmModel" TEXT,
ADD COLUMN     "llmProvider" "LlmProvider" NOT NULL DEFAULT 'OPENAI',
ADD COLUMN     "llmRole" "LlmRole" NOT NULL DEFAULT 'explorer',
ADD COLUMN     "maxActionsPerCycle" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "runIntervalSec" INTEGER NOT NULL DEFAULT 60;
