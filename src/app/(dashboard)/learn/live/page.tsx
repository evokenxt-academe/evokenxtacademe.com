import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ courseId?: string }>;
};

export default async function LiveStreamPage({ searchParams }: Props) {
  const { courseId } = await searchParams;

  if (!courseId) {
    redirect("/dashboard");
  }

  redirect(`/dashboard/courses/${courseId}/live`);
}
