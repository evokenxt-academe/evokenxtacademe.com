import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function LiveStreamRedirectPage({ params }: PageProps) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("slug")
    .eq("id", courseId)
    .maybeSingle();

  const slug = (course as { slug: string } | null)?.slug;
  if (slug) {
    redirect(`/learn/${slug}/live`);
  }

  redirect("/my-courses");
}
