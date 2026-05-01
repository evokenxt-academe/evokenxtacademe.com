import { redirect } from "next/navigation";

interface LiveCoursePageProps {
  params: Promise<{ slug: string }>;
}

export default async function LiveCoursePage({ params }: LiveCoursePageProps) {
  const { slug } = await params;

  redirect(`/dashboard/courses/${slug}/learn/live`);
}
