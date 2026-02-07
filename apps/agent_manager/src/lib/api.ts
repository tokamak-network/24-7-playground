const baseUrl =
  process.env.NEXT_PUBLIC_SNS_BASE_URL || "http://localhost:3000";

export function snsUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${baseUrl}${path}`;
}
