import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

type LearnRedirectSectionRow = {
  position: number | null;
  lectures: Array<{
    id: string;
    position: number | null;
  }> | null;
};

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function LearnRedirectPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!course) {
    redirect("/dashboard");
  }

  const courseId = (course as { id: string }).id;

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) {
    redirect("/courses");
  }

  const { data: sectionsData } = await supabase
    .from("sections")
    .select("id, position, lectures(id, position)")
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  const allSections = (sectionsData ?? []) as LearnRedirectSectionRow[];

  const allLectures = allSections
    .flatMap((section) =>
      (section.lectures ?? []).map((lecture) => ({
        id: lecture.id,
        sectionPosition: section.position ?? 0,
        lecturePosition: lecture.position ?? 0,
      })),
    )
    .sort((left, right) => {
      if (left.sectionPosition !== right.sectionPosition) {
        return left.sectionPosition - right.sectionPosition;
      }

      return left.lecturePosition - right.lecturePosition;
    });

  if (allLectures.length === 0) {
    redirect("/dashboard");
  }

  const firstLecture = allLectures[0];

  if (!firstLecture) {
    redirect("/courses");
  }

  redirect(`/learn/${slug}/${firstLecture.id}`);
}
