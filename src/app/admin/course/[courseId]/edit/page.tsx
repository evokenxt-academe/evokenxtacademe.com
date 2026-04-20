import { AddCourse } from "@/features/admin/course/components/add-course";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return <AddCourse courseId={courseId} />;
}
