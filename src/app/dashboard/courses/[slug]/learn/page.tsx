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
  const courseId = (await getCourseIdBySlug(supabase, slug)) as string;

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

  const navbarUser = {
    id: user.id,
    name: user.user_metadata?.full_name ?? null,
    email: user.email ?? "",
    avatar: user.user_metadata?.avatar_url ?? null,
  };

  return <LearnPageClient courseId={courseId} userId={user.id} navbarUser={navbarUser} />;
}
