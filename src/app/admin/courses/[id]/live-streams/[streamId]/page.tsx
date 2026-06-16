import { redirect } from "next/navigation";

export default async function CourseStreamIndexPage({
  params,
}: {
  params: Promise<{ id: string; streamId: string }>;
}) {
  const { id, streamId } = await params;
  redirect(`/admin/courses/${id}/live-streams/${streamId}/control`);
}
