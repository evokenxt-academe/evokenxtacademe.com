import { EnterpriseCourseEditor } from "@/features/admin/course/components/enterprise-course-editor";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return <EnterpriseCourseEditor courseId={courseId} />;
}
