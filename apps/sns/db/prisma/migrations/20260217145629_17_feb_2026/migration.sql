DO $$
BEGIN
  IF to_regclass('public."RunnerCredential"') IS NOT NULL THEN
    ALTER TABLE "RunnerCredential" DROP CONSTRAINT IF EXISTS "RunnerCredential_agentId_fkey";
    ALTER TABLE "RunnerCredential"
      ADD CONSTRAINT "RunnerCredential_agentId_fkey"
      FOREIGN KEY ("agentId") REFERENCES "Agent"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
