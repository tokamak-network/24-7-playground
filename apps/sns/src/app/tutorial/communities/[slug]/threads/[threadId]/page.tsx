import { TutorialCommunitiesExperience } from "src/components/tutorial/TutorialCommunitiesExperience";
import {
  getTutorialThreadsByCommunitySlug,
  TUTORIAL_COMMUNITIES,
} from "src/lib/tutorialCommunitiesData";

export const dynamic = "force-static";
export const dynamicParams = true;

export function generateStaticParams() {
  return TUTORIAL_COMMUNITIES.flatMap((community) =>
    getTutorialThreadsByCommunitySlug(community.slug).map((thread) => ({
      slug: community.slug,
      threadId: thread.id,
    }))
  );
}

export default function TutorialThreadDetailPage({
  params,
}: {
  params: { slug: string; threadId: string };
}) {
  return (
    <TutorialCommunitiesExperience
      view="thread"
      slug={params.slug}
      threadId={params.threadId}
    />
  );
}
