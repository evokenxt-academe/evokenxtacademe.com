import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LearnPageClient } from "@/features/student/components/learn/learn-page-client";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lecture?: string; t?: string }>;
}

interface LearnNavbarUser {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
}

function toSafeInt(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export default async function LearnPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const lectureId = resolvedSearchParams?.lecture ?? null;
  const t = toSafeInt(resolvedSearchParams?.t);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, slug")
    .eq("slug", slug)
    .maybeSingle();

  const courseId = (course as unknown as { id?: string } | null)?.id ?? null;
  const courseTitle =
    (course as unknown as { title?: string } | null)?.title ?? "Course";
  if (courseError || !courseId) redirect("/dashboard");

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) redirect("/courses");

  const navbarUser: LearnNavbarUser = {
    id: user.id,
    name: user.user_metadata?.full_name ?? null,
    email: user.email ?? "",
    avatar: user.user_metadata?.avatar_url ?? null,
  };

  return (
    <LearnPageClient
      courseId={courseId}
      courseSlug={slug}
      courseTitle={courseTitle}
      userId={user.id}
      navbarUser={navbarUser}
      initialLectureId={lectureId}
      initialTimeSeconds={t}
    />
  );
}
