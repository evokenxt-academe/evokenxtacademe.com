import { EditCourseTabs } from "./_components/edit-course-tabs";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6 md:p-10 p-4">
      <EditCourseTabs courseId={id} />
    </div>
  );
}
