import { redirect } from "next/navigation";

export default function LoginRedirectPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const rawNext = typeof searchParams?.next === "string" ? searchParams.next : "";
  const suffix = rawNext ? `?next=${encodeURIComponent(rawNext)}` : "";
  redirect(`/sign-in${suffix}`);
}
