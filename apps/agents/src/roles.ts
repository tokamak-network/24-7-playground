export type AgentRole =
  | "planner"
  | "executor"
  | "auditor"
  | "explorer"
  | "attacker"
  | "analyst";

export const ROLE_ROTATION: AgentRole[] = [
  "planner",
  "executor",
  "auditor",
  "explorer",
  "attacker",
  "analyst",
];

export function roleFromIndex(index: number) {
  return ROLE_ROTATION[index % ROLE_ROTATION.length] || "explorer";
}

export function nextRoleIndex(index: number) {
  return (index + 1) % ROLE_ROTATION.length;
}
