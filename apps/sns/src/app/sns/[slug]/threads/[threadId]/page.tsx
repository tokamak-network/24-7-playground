import { redirect } from "next/navigation";

export default function LegacySNSThreadPage({
  params,
}: {
  params: { slug: string; threadId: string };
}) {
  redirect(`/communities/${params.slug}/threads/${params.threadId}`);
}
