import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchStudentDashboardData,
  formatWatchTimeCompact,
} from "@/features/student/lib/lms-data";
import type {
  DashboardPageData,
  DashboardStats,
  CourseProgressItem,
  WeeklyActivityPoint,
  QuizScorePoint,
  QuizOverviewStats,
  ActivityFeedItem,
  LiveStreamEntry,
} from "@/features/student/types/dashboard";

// ─── Helpers ───────────────────────────────────────────────────────

function dayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ─── Weekly activity from lecture_progress ──────────────────────────

async function computeWeeklyActivity(
  supabase: SupabaseClient,
  userId: string,
): Promise<WeeklyActivityPoint[]> {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("lecture_progress")
    .select("watched_seconds, last_watched_at")
    .eq("user_id", userId)
    .not("last_watched_at", "is", null)
    .gte("last_watched_at", sevenDaysAgo.toISOString());

  if (error) {
    console.error("[dashboard-queries] weekly activity:", error.message);
  }

  // Build a map of date → total seconds
  const dailyMap = new Map<string, number>();

  // Initialize all 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(sevenDaysAgo.getDate() + i);
    dailyMap.set(isoDate(d), 0);
  }

  const rows = data ?? [];
  for (const row of rows) {
    const watchedAt = row.last_watched_at;
    if (!watchedAt) continue;
    const dateKey = watchedAt.slice(0, 10);
    if (dailyMap.has(dateKey)) {
      dailyMap.set(
        dateKey,
        (dailyMap.get(dateKey) ?? 0) + (row.watched_seconds ?? 0),
      );
    }
  }

  const result: WeeklyActivityPoint[] = [];
  for (const [dateStr, seconds] of dailyMap.entries()) {
    const d = new Date(dateStr + "T00:00:00");
    result.push({
      day: dayLabel(d),
      date: dateStr,
      minutes: Math.round(seconds / 60),
    });
  }

  return result;
}

// ─── Quiz score timeline ────────────────────────────────────────────

async function computeQuizScoreTimeline(
  supabase: SupabaseClient,
  userId: string,
  sectionIds: string[],
): Promise<{ scores: QuizScorePoint[]; overview: QuizOverviewStats }> {
  const emptyResult = {
    scores: [] as QuizScorePoint[],
    overview: { published: 0, attempted: 0, passed: 0 },
  };

  if (sectionIds.length === 0) return emptyResult;

  const { data: quizData, error: quizError } = await supabase
    .from("quizzes")
    .select("id, title, total_marks, passing_marks, is_published")
    .in("section_id", sectionIds)
    .eq("is_published", true);

  if (quizError) {
    console.error("[dashboard-queries] quizzes:", quizError.message);
    return emptyResult;
  }

  const quizzes = quizData ?? [];
  if (quizzes.length === 0) {
    return { ...emptyResult, overview: { ...emptyResult.overview, published: 0 } };
  }

  const quizById = new Map(
    quizzes.map((q) => [
      q.id,
      { title: q.title, totalMarks: q.total_marks, passingMarks: q.passing_marks },
    ]),
  );

  const quizIds = quizzes.map((q) => q.id);

  const { data: attemptData, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("quiz_id, score, total_marks, status, submitted_at")
    .eq("user_id", userId)
    .in("quiz_id", quizIds)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true });

  if (attemptError) {
    console.error("[dashboard-queries] quiz attempts:", attemptError.message);
  }

  const attempts = attemptData ?? [];
  const attemptedQuizIds = new Set(attempts.map((a) => a.quiz_id));
  let passedCount = 0;

  // Track best score per quiz for passed count
  const bestScoreByQuiz = new Map<string, number>();
  for (const attempt of attempts) {
    const current = bestScoreByQuiz.get(attempt.quiz_id) ?? 0;
    bestScoreByQuiz.set(attempt.quiz_id, Math.max(current, attempt.score));
  }

  for (const [quizId, bestScore] of bestScoreByQuiz) {
    const quiz = quizById.get(quizId);
    if (quiz && bestScore >= quiz.passingMarks) {
      passedCount++;
    }
  }

  const scores: QuizScorePoint[] = attempts.map((attempt) => {
    const quiz = quizById.get(attempt.quiz_id);
    const totalMarks = attempt.total_marks || quiz?.totalMarks || 1;
    const scorePercent = Math.round((attempt.score / totalMarks) * 100);

    return {
      quizTitle: quiz?.title ?? "Quiz",
      scorePercent,
      passed: quiz ? attempt.score >= quiz.passingMarks : false,
      submittedAt: attempt.submitted_at ?? "",
    };
  });

  return {
    scores,
    overview: {
      published: quizzes.length,
      attempted: attemptedQuizIds.size,
      passed: passedCount,
    },
  };
}

// ─── Build activity feed ────────────────────────────────────────────

async function buildActivityFeed(
  supabase: SupabaseClient,
  userId: string,
): Promise<ActivityFeedItem[]> {
  const items: ActivityFeedItem[] = [];

  // Recent lectures
  const { data: lectureData } = await supabase
    .from("lecture_progress")
    .select(
      `lecture_id, is_completed, watched_seconds, last_watched_at,
       lecture:lectures(id, title,
         section:sections(course_id,
           course:courses(name, slug)
         )
       )`,
    )
    .eq("user_id", userId)
    .not("last_watched_at", "is", null)
    .order("last_watched_at", { ascending: false })
    .limit(5);

  for (const row of lectureData ?? []) {
    const lecture = row.lecture as unknown as Record<string, unknown> | null;
    if (!lecture) continue;
    const section = lecture.section as Record<string, unknown> | null;
    if (!section) continue;
    const course = section.course as Record<string, unknown> | null;
    if (!course) continue;

    items.push({
      id: `lecture-${row.lecture_id}`,
      type: "lecture",
      title: String(lecture.title ?? ""),
      subtitle: String(course.name ?? ""),
      href: `/learn/${course.slug}/${lecture.id}`,
      timestamp: String(row.last_watched_at ?? ""),
      status: row.is_completed ? "completed" : "in_progress",
      meta: row.is_completed ? "Completed" : formatWatchTimeCompact(row.watched_seconds ?? 0),
    });
  }

  // Recent quiz attempts
  const { data: quizAttemptData } = await supabase
    .from("quiz_attempts")
    .select(
      `id, quiz_id, score, total_marks, status, submitted_at,
       quiz:quizzes(title, passing_marks)`,
    )
    .eq("user_id", userId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false })
    .limit(3);

  for (const attempt of quizAttemptData ?? []) {
    const quiz = attempt.quiz as unknown as Record<string, unknown> | null;
    const totalMarks = (attempt.total_marks as number) || 1;
    const scorePercent = Math.round(((attempt.score as number) / totalMarks) * 100);
    const passingMarks = (quiz?.passing_marks as number) ?? 0;
    const passed = (attempt.score as number) >= passingMarks;

    items.push({
      id: `quiz-${attempt.id}`,
      type: "quiz",
      title: String(quiz?.title ?? "Quiz"),
      subtitle: `${attempt.score}/${attempt.total_marks}`,
      href: `/dashboard/tests`,
      timestamp: String(attempt.submitted_at ?? ""),
      status: passed ? "passed" : "failed",
      meta: `${scorePercent}%`,
    });
  }

  // Sort all items by timestamp descending
  items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return items.slice(0, 8);
}

// ─── Main data fetcher ──────────────────────────────────────────────

export async function fetchDashboardPageData(
  supabase: SupabaseClient,
  userId: string,
): Promise<DashboardPageData> {
  // Run the existing heavy fetch + new queries in parallel
  const [dashboard, weeklyActivity] = await Promise.all([
    fetchStudentDashboardData(supabase, userId),
    computeWeeklyActivity(supabase, userId),
  ]);

  // Compute quiz data (needs sectionIds from dashboard)
  const [quizTimeline, activityFeed] = await Promise.all([
    computeQuizScoreTimeline(supabase, userId, dashboard.overview.sectionIds),
    buildActivityFeed(supabase, userId),
  ]);

  // Derive profile name
  const profileName =
    dashboard.overview.profile?.name?.split(" ")[0] ||
    "Student";

  // Derive stats
  const totalMinutes = Math.round(dashboard.overview.totalWatchSeconds / 60);

  // Average score from quiz attempts
  let averageScore = 0;
  if (dashboard.latestQuizAttempts.length > 0) {
    const totalPercent = dashboard.latestQuizAttempts.reduce((sum, attempt) => {
      const pct =
        attempt.totalMarks > 0
          ? (attempt.score / attempt.totalMarks) * 100
          : 0;
      return sum + pct;
    }, 0);
    averageScore = Math.round(totalPercent / dashboard.latestQuizAttempts.length);
  }

  const stats: DashboardStats = {
    enrolledCourses: dashboard.overview.enrolledCourses.length,
    completedCourses: dashboard.overview.completedCourses,
    averageScore,
    totalLearningMinutes: totalMinutes,
  };

  // Transform enrolled courses
  const courses: CourseProgressItem[] = dashboard.overview.enrolledCourses
    .slice(0, 6)
    .map((enrollment) => ({
      courseId: enrollment.course.id,
      courseName: enrollment.course.name,
      courseSlug: enrollment.course.slug,
      thumbnailUrl: enrollment.course.thumbnailUrl,
      progressPercent: enrollment.progress.progressPercent,
      completedLectures: enrollment.progress.completedLectures,
      totalLectures: enrollment.progress.totalLectures,
      totalDurationSec: enrollment.progress.totalDurationSec,
      continueLectureId: enrollment.progress.continueLectureId,
      continueLectureTitle: enrollment.progress.continueLectureTitle,
      lastActivityAt: enrollment.progress.lastActivityAt,
    }));

  // Transform live streams
  const liveStreams: LiveStreamEntry[] = dashboard.upcomingStreams.map((s) => ({
    id: s.id,
    title: s.title,
    courseId: s.courseId,
    courseName: s.courseName,
    status: s.status as LiveStreamEntry["status"],
    scheduledAt: s.scheduledAt,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    ytVideoId: s.ytVideoId,
  }));

  // Continue href
  const continueCourse = dashboard.continueCourse;
  const continueHref = continueCourse?.progress.continueLectureId
    ? `/learn/${continueCourse.course.slug}/${continueCourse.progress.continueLectureId}`
    : "/courses";

  return {
    profileName,
    stats,
    courses,
    weeklyActivity,
    quizScores: quizTimeline.scores,
    quizOverview: quizTimeline.overview,
    activityFeed,
    liveStreams,
    continueHref,
    enrolledCourseIds: dashboard.overview.courseIds,
  };
}
