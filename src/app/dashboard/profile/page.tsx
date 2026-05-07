import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database.v2.types";

import { ProfileTabs } from "./_components/ProfileTabs";
import type { ProfileData, ProfileStats } from "./_components/types";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot persist refreshed cookies directly.
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [
    profileResult,
    watchHoursResult,
    enrollmentsResult,
    quizzesResult,
    certificatesResult,
  ] = await Promise.all([
    supabase
      .from("users")
      .select(
        `id, name, email, avatar, phone, role,
           student_profiles!left(
             college_name, university, degree, graduation_year, field_of_study,
             current_employer, job_title, years_of_experience,
             target_exam_body, target_exam_level, target_exam_date, exam_attempt_number,
             city, state, country, linkedin_url, bio, date_of_birth, gender,
             preferred_language, notification_email, notification_sms, notification_whatsapp
           )`,
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("watch_hours_daily").select("seconds").eq("user_id", user.id),
    supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active"),
    supabase
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "submitted"),
    supabase
      .from("certificates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "issued"),
  ]);

  if (profileResult.error) {
    console.error(`[profile] fetch: ${profileResult.error.message}`);
  }

  const profileRow = profileResult.data as
    | (ProfileData["user"] & {
        student_profiles?: ProfileData["studentProfile"] | null;
      })
    | null;

  const profile: ProfileData = {
    user: profileRow
      ? {
          id: profileRow.id,
          name: profileRow.name,
          email: profileRow.email,
          avatar: profileRow.avatar,
          phone: profileRow.phone,
          role: profileRow.role,
        }
      : {
          id: user.id,
          name: user.user_metadata?.full_name ?? null,
          email: user.email ?? "",
          avatar: user.user_metadata?.avatar_url ?? null,
          phone: null,
          role: "student",
        },
    studentProfile: profileRow?.student_profiles ?? null,
  };

  const totalWatchHours = Array.isArray(watchHoursResult.data)
    ? Math.round(
        (watchHoursResult.data.reduce(
          (sum, row) => sum + (row.seconds ?? 0),
          0,
        ) /
          3600) *
          10,
      ) / 10
    : 0;

  const stats: ProfileStats = {
    totalWatchHours,
    coursesEnrolled: enrollmentsResult.count ?? 0,
    quizzesAttempted: quizzesResult.count ?? 0,
    certificates: certificatesResult.count ?? 0,
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
      <ProfileTabs profile={profile} stats={stats} />
    </div>
  );
}
