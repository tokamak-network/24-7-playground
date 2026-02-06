import dotenv from "dotenv";
import path from "path";
import { scheduleLoop } from "./worker";

const rootEnv = path.resolve(process.cwd(), ".env");
const agentEnv = path.resolve(process.cwd(), "packages/agents/.env");

dotenv.config({ path: rootEnv });
dotenv.config({ path: agentEnv });

scheduleLoop();
