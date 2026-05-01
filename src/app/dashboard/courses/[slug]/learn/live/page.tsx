import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LiveStreamRoom } from "@/features/live-stream/components/live-stream-room";
import { createClient } from "@/utils/supabase/server";

interface LiveLearnPageProps {
  params: Promise<{ slug: string }>;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function LiveLearnPage({ params }: LiveLearnPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const courseQuery = UUID_PATTERN.test(slug)
    ? supabase
        .from("courses")
        .select("id, name, slug")
        .eq("id", slug)
        .maybeSingle()
    : supabase
        .from("courses")
        .select("id, name, slug")
        .eq("slug", slug)
        .maybeSingle();

  const { data: course } = await courseQuery;

  if (!course) {
    redirect("/dashboard");
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) {
    redirect(`/dashboard/courses/${course.slug}`);
  }

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-background/80 p-5 shadow-sm md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="destructive"
              className="rounded-full px-2.5 py-0.5 uppercase tracking-[0.18em]"
            >
              Live class
            </Badge>
            <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
              {course.name}
            </Badge>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {course.name}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              Watch the current broadcast inside the learning flow and use the
              chat to ask questions while the class is live.
            </p>
          </div>
        </div>

        <Button asChild variant="outline">
          <a href={`/dashboard/courses/${course.slug}/learn`}>
            Back to learning
          </a>
        </Button>
      </section>

      <LiveStreamRoom courseId={course.id} courseName={course.name} />
    </main>
  );
}
