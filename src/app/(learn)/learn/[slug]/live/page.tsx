import Link from "next/link";
import { redirect } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
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

      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
              <Link href={`/learn/${slug}`} aria-label="Back to course">
                <IconArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="mb-0.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  Live
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {course.title}
                </span>
              </div>
              <h1 className="truncate text-lg font-semibold tracking-tight">
                Live class
              </h1>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
            <Link href={`/learn/${slug}`}>Back to course content</Link>
          </Button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-8">
        <LiveStreamRoom courseId={course.id} courseName={course.title} />
      </main>
    </div>
  );
}
