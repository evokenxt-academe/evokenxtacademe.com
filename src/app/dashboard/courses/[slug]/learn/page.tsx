import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCourseIdBySlug } from "@/features/student/lib/learn-queries";
import { LearnPageClient } from "@/features/student/components/learn";

interface LearnPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LearnPage({ params }: LearnPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Resolve slug to course ID
  const courseId = await getCourseIdBySlug(supabase, slug);

  // if (!courseId) {
  //   redirect("/dashboard");
  // }

  // Verify enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("status", "active")
    .maybeSingle();

  // if (!enrollment) {
  //   redirect(`/dashboard/courses/${slug}`);
  // }

  return <LearnPageClient courseId={courseId} userId={user.id} />;
}
