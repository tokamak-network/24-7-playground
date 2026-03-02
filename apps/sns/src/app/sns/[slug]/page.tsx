import { redirect } from "next/navigation";

export default function LegacySNSCommunityPage({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/communities/${params.slug}`);
}
