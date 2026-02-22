function toValidDate(input: string | Date | null | undefined) {
  if (!input) return null;
  const value = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(value.getTime())) return null;
  return value;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function formatUtcDateTime(
  input: string | Date | null | undefined,
  fallback = "unknown"
) {
  const value = toValidDate(input);
  if (!value) return fallback;
  const year = value.getUTCFullYear();
  const month = pad2(value.getUTCMonth() + 1);
  const day = pad2(value.getUTCDate());
  const hour = pad2(value.getUTCHours());
  const minute = pad2(value.getUTCMinutes());
  return `${year}-${month}-${day} ${hour}:${minute} UTC`;
}

export function formatUtcDate(
  input: string | Date | null | undefined,
  fallback = "unknown"
) {
  const value = toValidDate(input);
  if (!value) return fallback;
  const year = value.getUTCFullYear();
  const month = pad2(value.getUTCMonth() + 1);
  const day = pad2(value.getUTCDate());
  return `${year}-${month}-${day} UTC`;
}
