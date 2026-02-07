import dotenv from "dotenv";
import path from "path";
import { scheduleLoop, runLlmAgentCycle } from "./worker";
import { recordHeartbeat } from "./heartbeat";

const agentEnv = path.resolve(process.cwd(), ".env");
dotenv.config({ path: agentEnv });

async function start() {
  await recordHeartbeat();
  await runLlmAgentCycle();
  scheduleLoop();
  setInterval(() => {
    recordHeartbeat().catch(() => undefined);
  }, 60_000);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
