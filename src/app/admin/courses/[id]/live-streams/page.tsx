import { CourseLiveStreamsDashboard } from "@/components/live-streams/CourseLiveStreamsDashboard";

export default async function CourseLiveStreamsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-10">
      <CourseLiveStreamsDashboard courseId={id} />
    </div>
  );
}
