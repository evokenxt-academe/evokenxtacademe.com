import { redirect } from "next/navigation";

import { LiveStreamRoom } from "@/features/live-stream/components/live-stream-room";
import { DashboardNavbar } from "@/components/dashboard-navbar";
import { createClient } from "@/utils/supabase/server";

interface LivePageProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseLivePage({ params }: LivePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: courseData } = await supabase
    .from("courses")
    .select("id, title, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!courseData) redirect("/dashboard");
  const course = courseData as unknown as { id: string; title: string; slug: string };

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) redirect("/courses");

  const navbarUser = {
    id: user.id,
    name: user.user_metadata?.full_name ?? null,
    email: user.email ?? "",
    avatar: user.user_metadata?.avatar_url ?? null,
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <DashboardNavbar user={navbarUser} minimal={true} backUrl={`/learn/${slug}`} />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-8">
        <LiveStreamRoom courseId={course.id} courseName={course.title} />
      </main>
    </div>
  );
}
