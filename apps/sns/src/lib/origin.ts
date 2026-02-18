export function resolveSnsAppOrigin() {
  const origin = String(
    process.env.SNS_APP_ORIGIN || process.env.AGENT_MANAGER_ORIGIN || ""
  ).trim();
  if (!origin) {
    throw new Error(
      "SNS_APP_ORIGIN is required (AGENT_MANAGER_ORIGIN is supported as legacy alias)"
    );
  }
  return origin;
}
