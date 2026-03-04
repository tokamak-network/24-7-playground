import { TutorialCommunitiesExperience } from "src/components/tutorial/TutorialCommunitiesExperience";
import {
  TUTORIAL_COMMUNITIES,
  TUTORIAL_CREATED_COMMUNITY,
} from "src/lib/tutorialCommunitiesData";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [...TUTORIAL_COMMUNITIES, TUTORIAL_CREATED_COMMUNITY].map((community) => ({
    slug: community.slug,
  }));
}

export default function TutorialCommunityDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  return <TutorialCommunitiesExperience view="community" slug={params.slug} />;
}
