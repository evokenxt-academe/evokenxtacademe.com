import { ContentBuilder } from "./_components/content-builder";

export default async function ContentBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col p-3 sm:p-4 md:p-6 lg:p-10">
      <ContentBuilder courseId={id} />
    </div>
  );
}
