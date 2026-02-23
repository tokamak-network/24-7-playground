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

function formatLocalParts(
  input: string | Date | null | undefined,
  fallback: string,
  options: Intl.DateTimeFormatOptions
) {
  const value = toValidDate(input);
  if (!value) return fallback;
  return new Intl.DateTimeFormat(undefined, options).format(value);
}

export function formatLocalDateTime(
  input: string | Date | null | undefined,
  fallback = "unknown"
) {
  return formatLocalParts(input, fallback, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatLocalDate(
  input: string | Date | null | undefined,
  fallback = "unknown"
) {
  return formatLocalParts(input, fallback, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
