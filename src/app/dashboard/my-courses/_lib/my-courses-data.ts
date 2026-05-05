import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProgramBody } from "@/types/supabase";

export type MyCourseRow = {
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
  has_payment_risk: boolean;
  overdue_instalments: number;
  next_due_date: string | null;
};

function ymd(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function fetchMyCoursesV21(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<MyCourseRow[]> {
  const { data: enrollments, error: enrollmentsError } = await supabase
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
    .eq("status", "active")
    .order("enrolled_at", { ascending: false });

  if (enrollmentsError) throw new Error(enrollmentsError.message);

  const enrollmentRows = (enrollments ?? []) as Array<{
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

  if (enrollmentRows.length === 0) return [];

  const courseIds = enrollmentRows.map((e) => e.course.id);

  const [chaptersRes, instalmentsRes] = await Promise.all([
    supabase
      .from("chapters")
      .select(`course_id, lectures!inner(id, is_published)`)
      .in("course_id", courseIds)
      .eq("is_published", true),

    supabase
      .from("instalment_schedule")
      .select(`enrollment_id, instalment_no, due_date, amount, status`)
      .in(
        "enrollment_id",
        enrollmentRows.map((e) => e.id),
      )
      .in("status", ["pending", "overdue"])
      .order("due_date", { ascending: true }),
  ]);

  if (chaptersRes.error) throw new Error(chaptersRes.error.message);
  if (instalmentsRes.error) throw new Error(instalmentsRes.error.message);

  const chapters = (chaptersRes.data ?? []) as Array<{
    course_id: string;
    lectures: Array<{ id: string; is_published: boolean }> | null;
  }>;

  const lectureIds = chapters.flatMap((ch) =>
    (ch.lectures ?? []).filter((l) => l.is_published).map((l) => l.id),
  );

  const progressRes = lectureIds.length
    ? await supabase
        .from("lecture_progress")
        .select(
          `lecture_id, watched_seconds, last_watched_at, is_completed,
           lecture:lectures!inner(id, chapter:chapters!inner(course_id))`,
        )
        .eq("user_id", userId)
        .in("lecture_id", lectureIds)
    : { data: [], error: null };

  if (progressRes.error) throw new Error(progressRes.error.message);

  const progressRows = (progressRes.data ?? []) as Array<{
    lecture_id: string;
    watched_seconds: number | null;
    last_watched_at: string | null;
    is_completed: boolean;
    lecture: { chapter: { course_id: string } };
  }>;

  const totalLecturesByCourse = new Map<string, number>();
  for (const ch of chapters) {
    const count = (ch.lectures ?? []).filter((l) => l.is_published).length;
    totalLecturesByCourse.set(ch.course_id, (totalLecturesByCourse.get(ch.course_id) ?? 0) + count);
  }

  const completedByCourse = new Map<string, number>();
  const watchedByCourse = new Map<string, number>();
  const lastActivityByCourse = new Map<string, string>();

  for (const row of progressRows) {
    const courseId = row.lecture.chapter.course_id;
    watchedByCourse.set(courseId, (watchedByCourse.get(courseId) ?? 0) + (row.watched_seconds ?? 0));
    if (row.is_completed) completedByCourse.set(courseId, (completedByCourse.get(courseId) ?? 0) + 1);
    if (row.last_watched_at) {
      const prev = lastActivityByCourse.get(courseId);
      if (!prev || Date.parse(row.last_watched_at) > Date.parse(prev)) lastActivityByCourse.set(courseId, row.last_watched_at);
    }
  }

  const instalments = (instalmentsRes.data ?? []) as Array<{
    enrollment_id: string;
    due_date: string;
    status: "pending" | "overdue";
  }>;

  const instalmentsByEnrollment = new Map<string, { overdue: number; nextDue: string | null; hasRisk: boolean }>();
  for (const inst of instalments) {
    const prev = instalmentsByEnrollment.get(inst.enrollment_id) ?? { overdue: 0, nextDue: null, hasRisk: false };
    const overdue = prev.overdue + (inst.status === "overdue" ? 1 : 0);
    const nextDue = prev.nextDue ?? inst.due_date ?? null;
    instalmentsByEnrollment.set(inst.enrollment_id, {
      overdue,
      nextDue,
      hasRisk: true,
    });
  }

  const today = new Date();
  const todayKey = ymd(today);
  void todayKey; // kept for future use (due-date labeling)

  return enrollmentRows.map((e) => {
    const courseId = e.course.id;
    const inst = instalmentsByEnrollment.get(e.id) ?? { overdue: 0, nextDue: null, hasRisk: false };
    return {
      enrollment_id: e.id,
      enrollment_status: "active",
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
      has_payment_risk: inst.hasRisk,
      overdue_instalments: inst.overdue,
      next_due_date: inst.nextDue,
    } satisfies MyCourseRow;
  });
}

