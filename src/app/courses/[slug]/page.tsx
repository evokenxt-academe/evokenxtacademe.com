import { createServerClient_ } from "@/lib/supabase/server";
import { fetchCourseBySlugDetail } from "@/lib/supabase/queries/course-detail";
import { CourseDetailClient } from "./_components/course-preview-page";
import type { Metadata } from "next";

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerClient_();
  const course = await fetchCourseBySlugDetail(supabase as any, slug);

  if (!course) {
    return { title: "Course Not Found — Evoke EduGlobal" };
  }

  return {
    title: `${course.title} — ${course.program_body} | Evoke EduGlobal`,
    description:
      course.short_description ||
      course.description ||
      `Learn ${course.title} with expert-led instruction at Evoke EduGlobal.`,
  };
}

export const revalidate = 3600;

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;

  return <CourseDetailClient slug={slug} />;
}
