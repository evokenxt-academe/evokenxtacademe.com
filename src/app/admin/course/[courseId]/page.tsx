import { CourseDetailPage } from "@/features/admin/course/components/course-detail-page";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return <CourseDetailPage courseIdentifier={courseId} />;
}
