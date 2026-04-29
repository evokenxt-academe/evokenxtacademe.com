import { CoursePreviewPage } from "./_components/course-preview-page";

export default async function Page(props: PageProps<"/courses/[slug]">) {
  const { slug } = await props.params;
  return <CoursePreviewPage slug={slug} />;
}
