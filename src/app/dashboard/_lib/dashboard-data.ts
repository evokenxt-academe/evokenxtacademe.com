import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProgramBody } from "@/types/supabase";

export type DashboardUserProfile = {
  name: string;
  avatar: string | null;
  email: string;
  target_exam_body: ProgramBody | null;
  target_exam_level: string | null;
  target_exam_date: string | null;
  exam_attempt_number: number | null;
  city: string | null;
  country: string | null;
};

export type DashboardEnrollmentSummary = {
  enrollment_id: string;
  enrollment_status: "active";
  enrolled_at: string;
  expires_at: string | null;
  course_id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  avg_rating: number | null;
  total_students: number | null;
  subject_name: string;
  subject_code: string;
  level_label: string;
  program_body: ProgramBody;
  completed_lectures: number;
  total_lectures: number;
  total_watched_seconds: number;
  last_activity: string | null;
};

export type ResumeLecture = {
  resume_at_seconds: number;
  watched_seconds: number;
  last_watched_at: string;
  lecture_id: string;
  lecture_title: string;
  duration_sec: number;
  yt_video_id: string | null;
  chapter_title: string;
  course_id: string;
  course_title: string;
  course_slug: string;
  thumbnail_url: string | null;
};

export type WatchHoursPoint = {
  watch_date: string; // YYYY-MM-DD
  course_id: string;
  course_title: string;
  total_seconds: number;
};

export type RecentQuizAttempt = {
  attempt_id: string;
  quiz_id: string;
  score: number;
  total_marks: number;
  percentage: number;
  passed: boolean;
  status: "submitted";
  started_at: string;
  submitted_at: string;
  attempt_number: number;
  quiz_title: string;
  quiz_type: string;
  passing_marks: number;
  course_title: string;
  course_id: string;
};

export type UpcomingLiveStream = {
  id: string;
  title: string;
  description: string | null;
  status: "scheduled" | "live";
  scheduled_at: string | null;
  started_at: string | null;
  yt_video_id: string | null;
  concurrent_viewers: number | null;
  course_title: string;
  course_id: string;
  instructor_name: string;
  instructor_avatar: string | null;
};

export type CertificateRow = {
  id: string;
  cert_number: string;
  cert_url: string;
  status: "issued";
  issued_at: string;
  completion_pct: number | null;
  course_title: string;
  subject_name: string;
  program_body: ProgramBody;
};

export type StreakDay = { watch_date: string; total_seconds: number };

export type DashboardData = {
  profile: DashboardUserProfile;
  activeEnrollments: DashboardEnrollmentSummary[];
  resume: ResumeLecture[];
  watchHours7d: WatchHoursPoint[];
  recentAttempts: RecentQuizAttempt[];
  liveStreams: UpcomingLiveStream[];
  certificates: CertificateRow[];
  streakDays: StreakDay[]; // 52 weeks
};

function requireData<T>(data: T | null, error: unknown, label: string): T {
  if (error) {
    throw new Error(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (data == null) throw new Error(`${label}: missing data`);
  return data;
}

function ymd(date: Date): string {
  // local date → YYYY-MM-DD
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysBetween(a: Date, b: Date): number {
  const ms = 24 * 60 * 60 * 1000;
  const a0 = new Date(a);
  const b0 = new Date(b);
  a0.setHours(0, 0, 0, 0);
  b0.setHours(0, 0, 0, 0);
  return Math.round((b0.getTime() - a0.getTime()) / ms);
}

export function computeStreak(streakDays: StreakDay[], now = new Date()): number {
  const map = new Map(streakDays.map((d) => [d.watch_date, d.total_seconds]));
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const k = ymd(d);
    const seconds = map.get(k) ?? 0;
    if (seconds <= 0) break;
    streak++;
  }
  return streak;
}

export function computeDaysToExam(targetExamDate: string | null, now = new Date()): number | null {
  if (!targetExamDate) return null;
  const exam = new Date(targetExamDate);
  if (Number.isNaN(exam.getTime())) return null;
  return daysBetween(now, exam);
}

export async function fetchStudentDashboardV21(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<DashboardData> {
  const today = new Date();
  const start7d = new Date(today);
  start7d.setDate(today.getDate() - 6);

  const start364d = new Date(today);
  start364d.setDate(today.getDate() - 364);

  const [
    profileRes,
    enrollmentsRes,
    lectureProgressRes,
    watch7Res,
    attemptsRes,
    liveRes,
    certsRes,
    streakRes,
  ] = await Promise.all([
    supabase
      .from("users")
      .select(
        `name, avatar, email,
         student_profiles!left(target_exam_body, target_exam_level, target_exam_date, exam_attempt_number, city, country)`,
      )
      .eq("id", userId)
      .maybeSingle(),

    supabase
      .from("enrollments")
      .select(
        `id, status, enrolled_at, expires_at,
         course:courses!inner(
           id, title, slug, thumbnail_url, avg_rating, total_students,
           subject:subjects!inner(
             name, code,
             program_level:program_levels!inner(
               label,
               program:programs!inner(body)
             )
           )
         )`,
      )
      .eq("user_id", userId)
      .eq("status", "active"),

    // Resume: fetch more than needed, filter by active enrollments in-memory.
    supabase
      .from("lecture_progress")
      .select(
        `resume_at_seconds, watched_seconds, last_watched_at, is_completed,
         lecture:lectures!inner(
           id, title, duration_sec, yt_video_id,
           chapter:chapters!inner(
             title, course_id,
             course:courses!inner(title, slug, thumbnail_url)
           )
         )`,
      )
      .eq("user_id", userId)
      .eq("is_completed", false)
      .not("last_watched_at", "is", null)
      .order("last_watched_at", { ascending: false })
      .limit(25),

    supabase
      .from("watch_hours_daily")
      .select(`watch_date, course_id, seconds, course:courses!inner(title)`)
      .eq("user_id", userId)
      .gte("watch_date", ymd(start7d))
      .order("watch_date", { ascending: true }),

    supabase
      .from("quiz_attempts")
      .select(
        `id, score, total_marks, percentage, passed, status, started_at, submitted_at, attempt_number,
         quiz:quizzes!inner(id, title, type, passing_marks, course:courses!inner(title, id))`,
      )
      .eq("user_id", userId)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false })
      .limit(10),

    supabase
      .from("live_streams")
      .select(
        `id, title, description, status, scheduled_at, started_at, yt_video_id, concurrent_viewers,
         course:courses!inner(title, id),
         instructor:users!inner(name, avatar)`,
      )
      .in("status", ["scheduled", "live"])
      .order("scheduled_at", { ascending: true })
      .limit(10),

    supabase
      .from("certificates")
      .select(
        `id, cert_number, cert_url, status, issued_at, completion_pct,
         course:courses!inner(
           title,
           subject:subjects!inner(
             name,
             program_level:program_levels!inner(
               program:programs!inner(body)
             )
           )
         )`,
      )
      .eq("user_id", userId)
      .eq("status", "issued")
      .order("issued_at", { ascending: false }),

    supabase
      .from("watch_hours_daily")
      .select("watch_date, seconds")
      .eq("user_id", userId)
      .gte("watch_date", ymd(start364d))
      .order("watch_date", { ascending: true }),
  ]);

  const profileRow = requireData(profileRes.data, profileRes.error, "dashboard.profile") as any;
  const sp = (profileRow?.student_profiles ?? null) as
    | {
        target_exam_body: ProgramBody | null;
        target_exam_level: string | null;
        target_exam_date: string | null;
        exam_attempt_number: number | null;
        city: string | null;
        country: string | null;
      }
    | null;

  const profile: DashboardUserProfile = {
    name: profileRow.name ?? "Student",
    avatar: profileRow.avatar ?? null,
    email: profileRow.email,
    target_exam_body: sp?.target_exam_body ?? null,
    target_exam_level: sp?.target_exam_level ?? null,
    target_exam_date: sp?.target_exam_date ?? null,
    exam_attempt_number: sp?.exam_attempt_number ?? null,
    city: sp?.city ?? null,
    country: sp?.country ?? null,
  };

  const enrollmentsRaw = requireData(
    enrollmentsRes.data,
    enrollmentsRes.error,
    "dashboard.enrollments",
  ) as Array<{
    id: string;
    status: "active";
    enrolled_at: string;
    expires_at: string | null;
    course: {
      id: string;
      title: string;
      slug: string;
      thumbnail_url: string | null;
      avg_rating: number | null;
      total_students: number | null;
      subject: {
        name: string;
        code: string;
        program_level: { label: string; program: { body: ProgramBody } };
      };
    };
  }>;

  const activeCourseIds = enrollmentsRaw.map((e) => e.course.id);

  // Fetch totals and progress in parallel to avoid filter-aggregates in PostgREST.
  const [totalsRes] = await Promise.all([
    supabase
      .from("chapters")
      .select(`course_id, lectures!inner(id, is_published)`)
      .in("course_id", activeCourseIds)
      .eq("is_published", true),
  ]);

  // The `.in([], [])` above is not usable; instead fetch per course via chapters+lectures ids.
  // Build lectureIds from totalsRes.
  const chaptersRows = requireData(totalsRes.data, totalsRes.error, "dashboard.courseTotals") as Array<{
    course_id: string;
    lectures: Array<{ id: string; is_published: boolean }> | null;
  }>;

  const lectureIds = chaptersRows
    .flatMap((ch) => (ch.lectures ?? []).filter((l) => l.is_published).map((l) => l.id));

  const progressRows = lectureIds.length
    ? await supabase
        .from("lecture_progress")
        .select(
          `lecture_id, watched_seconds, last_watched_at, is_completed,
           lecture:lectures!inner(id, chapter:chapters!inner(course_id))`,
        )
        .eq("user_id", userId)
        .in("lecture_id", lectureIds)
    : { data: [], error: null };

  if (progressRows.error) {
    throw new Error(`dashboard.courseProgress: ${progressRows.error.message}`);
  }

  const progressData = (progressRows.data ?? []) as Array<{
    lecture_id: string;
    watched_seconds: number | null;
    last_watched_at: string | null;
    is_completed: boolean;
    lecture: { id: string; chapter: { course_id: string } };
  }>;

  const totalLecturesByCourse = new Map<string, number>();
  for (const ch of chaptersRows) {
    const count = (ch.lectures ?? []).filter((l) => l.is_published).length;
    totalLecturesByCourse.set(ch.course_id, (totalLecturesByCourse.get(ch.course_id) ?? 0) + count);
  }

  const completedByCourse = new Map<string, number>();
  const watchedByCourse = new Map<string, number>();
  const lastActivityByCourse = new Map<string, string>();

  for (const row of progressData) {
    const courseId = row.lecture.chapter.course_id;
    watchedByCourse.set(courseId, (watchedByCourse.get(courseId) ?? 0) + (row.watched_seconds ?? 0));
    if (row.is_completed) {
      completedByCourse.set(courseId, (completedByCourse.get(courseId) ?? 0) + 1);
    }
    if (row.last_watched_at) {
      const prev = lastActivityByCourse.get(courseId);
      if (!prev || Date.parse(row.last_watched_at) > Date.parse(prev)) {
        lastActivityByCourse.set(courseId, row.last_watched_at);
      }
    }
  }

  const activeEnrollments: DashboardEnrollmentSummary[] = enrollmentsRaw
    .map((e) => {
      const courseId = e.course.id;
      return {
        enrollment_id: e.id,
        enrollment_status: "active" as const,
        enrolled_at: e.enrolled_at,
        expires_at: e.expires_at,
        course_id: courseId,
        title: e.course.title,
        slug: e.course.slug,
        thumbnail_url: e.course.thumbnail_url,
        avg_rating: e.course.avg_rating,
        total_students: e.course.total_students,
        subject_name: e.course.subject.name,
        subject_code: e.course.subject.code,
        level_label: e.course.subject.program_level.label,
        program_body: e.course.subject.program_level.program.body,
        completed_lectures: completedByCourse.get(courseId) ?? 0,
        total_lectures: totalLecturesByCourse.get(courseId) ?? 0,
        total_watched_seconds: watchedByCourse.get(courseId) ?? 0,
        last_activity: lastActivityByCourse.get(courseId) ?? null,
      };
    })
    .sort((a, b) => {
      const am = a.last_activity ? Date.parse(a.last_activity) : 0;
      const bm = b.last_activity ? Date.parse(b.last_activity) : 0;
      return bm - am;
    });

  const resumeRaw = requireData(
    lectureProgressRes.data,
    lectureProgressRes.error,
    "dashboard.resume",
  ) as Array<{
    resume_at_seconds: number | null;
    watched_seconds: number | null;
    last_watched_at: string;
    is_completed: boolean;
    lecture: {
      id: string;
      title: string;
      duration_sec: number;
      yt_video_id: string | null;
      chapter: {
        title: string;
        course_id: string;
        course: { title: string; slug: string; thumbnail_url: string | null };
      };
    };
  }>;

  const resume: ResumeLecture[] = resumeRaw
    .filter((r) => activeCourseIds.includes(r.lecture.chapter.course_id))
    .slice(0, 3)
    .map((r) => ({
      resume_at_seconds: r.resume_at_seconds ?? 0,
      watched_seconds: r.watched_seconds ?? 0,
      last_watched_at: r.last_watched_at,
      lecture_id: r.lecture.id,
      lecture_title: r.lecture.title,
      duration_sec: r.lecture.duration_sec,
      yt_video_id: r.lecture.yt_video_id,
      chapter_title: r.lecture.chapter.title,
      course_id: r.lecture.chapter.course_id,
      course_title: r.lecture.chapter.course.title,
      course_slug: r.lecture.chapter.course.slug,
      thumbnail_url: r.lecture.chapter.course.thumbnail_url,
    }));

  const watchHours7d = requireData(watch7Res.data, watch7Res.error, "dashboard.watch7") as Array<{
    watch_date: string;
    course_id: string;
    seconds: number;
    course: { title: string };
  }>;

  const watchHours7dAgg: WatchHoursPoint[] = watchHours7d.map((r) => ({
    watch_date: r.watch_date,
    course_id: r.course_id,
    course_title: r.course.title,
    total_seconds: r.seconds ?? 0,
  }));

  const attempts = requireData(
    attemptsRes.data,
    attemptsRes.error,
    "dashboard.attempts",
  ) as Array<{
    id: string;
    score: number;
    total_marks: number;
    percentage: number;
    passed: boolean;
    status: "submitted";
    started_at: string;
    submitted_at: string;
    attempt_number: number;
    quiz: {
      id: string;
      title: string;
      type: string;
      passing_marks: number;
      course: { title: string; id: string };
    };
  }>;

  const recentAttempts: RecentQuizAttempt[] = attempts.map((a) => ({
    attempt_id: a.id,
    quiz_id: a.quiz.id,
    score: a.score ?? 0,
    total_marks: a.total_marks ?? 0,
    percentage: a.percentage ?? 0,
    passed: a.passed ?? false,
    status: "submitted",
    started_at: a.started_at,
    submitted_at: a.submitted_at,
    attempt_number: a.attempt_number,
    quiz_title: a.quiz.title,
    quiz_type: a.quiz.type,
    passing_marks: a.quiz.passing_marks,
    course_title: a.quiz.course.title,
    course_id: a.quiz.course.id,
  }));

  const liveRaw = requireData(liveRes.data, liveRes.error, "dashboard.live") as Array<{
    id: string;
    title: string;
    description: string | null;
    status: "scheduled" | "live" | "ended" | "cancelled";
    scheduled_at: string | null;
    started_at: string | null;
    yt_video_id: string | null;
    concurrent_viewers: number | null;
    course: { title: string; id: string };
    instructor: { name: string | null; avatar: string | null };
  }>;

  const liveStreams: UpcomingLiveStream[] = liveRaw
    .filter((s) => (s.status === "live" || s.status === "scheduled") && activeCourseIds.includes(s.course.id))
    .sort((a, b) => (a.status === "live" ? -1 : 1) - (b.status === "live" ? -1 : 1))
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      status: s.status === "live" ? "live" : "scheduled",
      scheduled_at: s.scheduled_at,
      started_at: s.started_at,
      yt_video_id: s.yt_video_id,
      concurrent_viewers: s.concurrent_viewers,
      course_title: s.course.title,
      course_id: s.course.id,
      instructor_name: s.instructor.name ?? "Instructor",
      instructor_avatar: s.instructor.avatar ?? null,
    }));

  const certsRaw = requireData(certsRes.data, certsRes.error, "dashboard.certs") as Array<{
    id: string;
    cert_number: string;
    cert_url: string;
    status: "issued" | "revoked";
    issued_at: string;
    completion_pct: number | null;
    course: { title: string; subject: { name: string; program_level: { program: { body: ProgramBody } } } };
  }>;

  const certificates: CertificateRow[] = certsRaw
    .filter((c) => c.status === "issued")
    .map((c) => ({
      id: c.id,
      cert_number: c.cert_number,
      cert_url: c.cert_url,
      status: "issued",
      issued_at: c.issued_at,
      completion_pct: c.completion_pct,
      course_title: c.course.title,
      subject_name: c.course.subject.name,
      program_body: c.course.subject.program_level.program.body,
    }));

  const streakRaw = requireData(streakRes.data, streakRes.error, "dashboard.streak") as Array<{
    watch_date: string;
    seconds: number;
  }>;

  const streakMap = new Map<string, number>();
  for (const r of streakRaw) {
    streakMap.set(r.watch_date, (streakMap.get(r.watch_date) ?? 0) + (r.seconds ?? 0));
  }

  // Ensure continuous coverage for the last 365 days.
  const streakDays: StreakDay[] = [];
  for (let i = 0; i <= 364; i++) {
    const d = new Date(start364d);
    d.setDate(start364d.getDate() + i);
    const k = ymd(d);
    streakDays.push({ watch_date: k, total_seconds: streakMap.get(k) ?? 0 });
  }

  return {
    profile,
    activeEnrollments,
    resume,
    watchHours7d: watchHours7dAgg,
    recentAttempts,
    liveStreams,
    certificates,
    streakDays,
  };
}

