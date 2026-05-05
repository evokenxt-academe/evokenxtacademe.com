import { redirect } from "next/navigation";

interface Props {
  params: Promise<{
    slug: string;
    lectureId: string;
  }>;
}

export default async function CoursePlayerPage({ params }: Props) {
  const { slug, lectureId } = await params;
  // Legacy deep link support: redirect to the v2.1.0 canonical route shape.
  redirect(`/learn/${encodeURIComponent(slug)}?lecture=${encodeURIComponent(lectureId)}`);
}
