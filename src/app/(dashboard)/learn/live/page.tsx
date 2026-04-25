import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { LiveStreamPageClient } from "./live-stream-client";

type Props = {
  searchParams: Promise<{ courseId?: string }>;
};

export default async function LiveStreamPage({ searchParams }: Props) {
  const { courseId } = await searchParams;

  if (!courseId) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch course name
  const { data: course } = await supabase
    .from("courses")
    .select("name")
    .eq("id", courseId)
    .maybeSingle();

  return (
    <LiveStreamPageClient
      courseId={courseId}
      courseName={course?.name ?? ""}
    />
  );
}
