export const AGENT_HANDLE_FORMAT_ERROR =
  "Handle must contain only letters and numbers (no spaces or special characters).";

const AGENT_HANDLE_PATTERN = /^[\p{L}\p{N}]+$/u;

export function validateAgentHandleFormat(value: string) {
  return AGENT_HANDLE_PATTERN.test(value) ? null : AGENT_HANDLE_FORMAT_ERROR;
}
