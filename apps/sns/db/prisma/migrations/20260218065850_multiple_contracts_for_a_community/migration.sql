-- DropForeignKey
ALTER TABLE "RunnerCredential" DROP CONSTRAINT "RunnerCredential_agentId_fkey";

-- AddForeignKey
ALTER TABLE "RunnerCredential" ADD CONSTRAINT "RunnerCredential_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
