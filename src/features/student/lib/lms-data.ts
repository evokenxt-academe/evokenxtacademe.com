import type { SupabaseClient } from "@supabase/supabase-js";

interface RowRecord {
  [key: string]: unknown;
}

export interface StudentProfile {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  role: string | null;
}

export interface StudentInstructor {
  id: string;
  name: string | null;
  avatar: string | null;
}

export interface StudentCourse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  level: string | null;
  thumbnailUrl: string | null;
  price: number;
  discountPrice: number | null;
  status: string | null;
  createdAt: string | null;
  instructor: StudentInstructor | null;
}

export interface StudentLecture {
  id: string;
  sectionId: string;
  sectionTitle: string;
  sectionPosition: number;
  title: string;
  videoUrl: string | null;
  description: string | null;
  durationSec: number;
  position: number;
  isPreview: boolean;
}

export interface StudentSection {
  id: string;
  courseId: string;
  title: string;
  position: number;
  lectures: StudentLecture[];
}

export interface StudentLectureProgress {
  lectureId: string;
  isCompleted: boolean;
  watchedSeconds: number;
  lastWatchedAt: string | null;
}

export interface StudentCourseProgress {
  totalLectures: number;
  completedLectures: number;
  progressPercent: number;
  watchedSeconds: number;
  totalDurationSec: number;
  isCompleted: boolean;
  lastActivityAt: string | null;
  continueLectureId: string | null;
  continueLectureTitle: string | null;
  nextLectureId: string | null;
  nextLectureTitle: string | null;
}

export interface StudentEnrolledCourse {
  enrollmentId: string;
  userId: string;
  courseId: string;
  status: string;
  enrolledAt: string | null;
  expiresAt: string | null;
  course: StudentCourse;
  sections: StudentSection[];
  lectures: StudentLecture[];
  progress: StudentCourseProgress;
}

export interface StudentLearningOverview {
  profile: StudentProfile | null;
  enrolledCourses: StudentEnrolledCourse[];
  courseIds: string[];
  sectionIds: string[];
  lectureIds: string[];
  totalLectures: number;
  completedLectures: number;
  completedCourses: number;
  totalWatchSeconds: number;
}

export interface StudentLiveStream {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  status: string;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  ytVideoId: string | null;
}

export interface StudentQuizAttemptSummary {
  quizId: string;
  quizTitle: string;
  score: number;
  totalMarks: number;
  passingMarks: number;
  status: string;
  submittedAt: string | null;
  passed: boolean;
}

export interface StudentDashboardData {
  overview: StudentLearningOverview;
  exploreCourses: StudentCourse[];
  continueCourse: StudentEnrolledCourse | null;
  certificatesEarned: number;
  upcomingStreams: StudentLiveStream[];
  quizzesPublished: number;
  quizzesAttempted: number;
  quizzesPassed: number;
  latestQuizAttempts: StudentQuizAttemptSummary[];
}

export interface StudentCoursePlayerData {
  course: StudentCourse;
  enrollment: {
    id: string;
    status: string;
    enrolledAt: string | null;
    expiresAt: string | null;
  } | null;
  sections: StudentSection[];
  orderedLectures: StudentLecture[];
  lectureProgressMap: Map<string, StudentLectureProgress>;
  currentLecture: StudentLecture | null;
  shouldRedirectToLectureId: string | null;
  resources: Array<{ id: string; title: string; fileUrl: string }>;
  courseProgress: StudentCourseProgress;
  previousLectureId: string | null;
  nextLectureId: string | null;
  relatedLiveStreams: StudentLiveStream[];
  quizAttempts: StudentQuizAttemptSummary[];
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toNumberValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toInteger(value: unknown): number {
  return Math.max(0, Math.round(toNumberValue(value)));
}

function toBooleanValue(value: unknown): boolean {
  return value === true;
}

function timestampToMs(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function logSupabaseError(scope: string, error: { message?: string } | null) {
  if (!error) {
    return;
  }

  console.error(`[student-lms] ${scope}: ${error.message ?? "Unknown error"}`);
}

function normalizeInstructor(value: unknown): StudentInstructor | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as RowRecord;

  return {
    id: toStringValue(record.id),
    name: toNullableString(record.name),
    avatar: toNullableString(record.avatar),
  };
}

function normalizeCourse(value: unknown): StudentCourse | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as RowRecord;
  const id = toStringValue(record.id);
  const name = toStringValue(record.name);
  const slug = toStringValue(record.slug);

  if (!id || !name || !slug) {
    return null;
  }

  return {
    id,
    name,
    slug,
    description: toNullableString(record.description),
    level: toNullableString(record.level),
    thumbnailUrl: toNullableString(record.thumbnail_url),
    price: toNumberValue(record.price),
    discountPrice: record.discount_price == null ? null : toNumberValue(record.discount_price),
    status: toNullableString(record.status),
    createdAt: toNullableString(record.created_at),
    instructor: normalizeInstructor(record.instructor),
  };
}

function normalizeLecture(value: unknown, section: StudentSection): StudentLecture | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as RowRecord;
  const id = toStringValue(record.id);
  const title = toStringValue(record.title);

  if (!id || !title) {
    return null;
  }

  return {
    id,
    sectionId: section.id,
    sectionTitle: section.title,
    sectionPosition: section.position,
    title,
    videoUrl: toNullableString(record.video_url),
    description: toNullableString(record.description),
    durationSec: toInteger(record.duration_sec),
    position: toInteger(record.position),
    isPreview: toBooleanValue(record.is_preview),
  };
}

function orderLectures(lectures: StudentLecture[]): StudentLecture[] {
  return [...lectures].sort((left, right) => {
    if (left.sectionPosition !== right.sectionPosition) {
      return left.sectionPosition - right.sectionPosition;
    }

    return left.position - right.position;
  });
}

function computeCourseProgress(
  lectures: StudentLecture[],
  progressMap: Map<string, StudentLectureProgress>,
): StudentCourseProgress {
  const orderedLectures = orderLectures(lectures);
  let completedLectures = 0;
  let watchedSeconds = 0;
  let totalDurationSec = 0;

  let lastActivityAt: string | null = null;
  let lastActivityMs = 0;
  let lastWatchedLectureId: string | null = null;

  let nextLectureId: string | null = null;
  let nextLectureTitle: string | null = null;

  for (const lecture of orderedLectures) {
    const progress = progressMap.get(lecture.id);
    totalDurationSec += lecture.durationSec;

    if (progress) {
      watchedSeconds += progress.watchedSeconds;
      if (progress.isCompleted) {
        completedLectures += 1;
      }

      const activityMs = timestampToMs(progress.lastWatchedAt);
      if (activityMs > lastActivityMs) {
        lastActivityMs = activityMs;
        lastActivityAt = progress.lastWatchedAt;
        lastWatchedLectureId = lecture.id;
      }
    }

    const isCompleted = progress?.isCompleted ?? false;
    if (!isCompleted && !nextLectureId) {
      nextLectureId = lecture.id;
      nextLectureTitle = lecture.title;
    }
  }

  const totalLectures = orderedLectures.length;
  const progressPercent =
    totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

  const continueLectureId =
    lastWatchedLectureId ?? nextLectureId ?? orderedLectures[0]?.id ?? null;

  const continueLectureTitle = continueLectureId
    ? orderedLectures.find((lecture) => lecture.id === continueLectureId)?.title ?? null
    : null;

  return {
    totalLectures,
    completedLectures,
    progressPercent,
    watchedSeconds,
    totalDurationSec,
    isCompleted: totalLectures > 0 && completedLectures === totalLectures,
    lastActivityAt,
    continueLectureId,
    continueLectureTitle,
    nextLectureId,
    nextLectureTitle,
  };
}

async function fetchLectureProgressMap(
  supabase: SupabaseClient,
  userId: string,
  lectureIds: string[],
): Promise<Map<string, StudentLectureProgress>> {
  if (lectureIds.length === 0) {
    return new Map<string, StudentLectureProgress>();
  }

  const { data, error } = await supabase
    .from("lecture_progress")
    .select("lecture_id, is_completed, watched_seconds, last_watched_at")
    .eq("user_id", userId)
    .in("lecture_id", lectureIds);

  logSupabaseError("fetch lecture progress", error);

  const progressMap = new Map<string, StudentLectureProgress>();
  const rows = Array.isArray(data) ? (data as RowRecord[]) : [];

  for (const row of rows) {
    const lectureId = toStringValue(row.lecture_id);
    if (!lectureId) {
      continue;
    }

    progressMap.set(lectureId, {
      lectureId,
      isCompleted: toBooleanValue(row.is_completed),
      watchedSeconds: toInteger(row.watched_seconds),
      lastWatchedAt: toNullableString(row.last_watched_at),
    });
  }

  return progressMap;
}

async function fetchSectionsForCourses(
  supabase: SupabaseClient,
  courseIds: string[],
): Promise<{
  sectionsByCourse: Map<string, StudentSection[]>;
  lecturesByCourse: Map<string, StudentLecture[]>;
  sectionIds: string[];
  lectureIds: string[];
}> {
  const sectionsByCourse = new Map<string, StudentSection[]>();
  const lecturesByCourse = new Map<string, StudentLecture[]>();
  const sectionIds: string[] = [];
  const lectureIds: string[] = [];

  if (courseIds.length === 0) {
    return { sectionsByCourse, lecturesByCourse, sectionIds, lectureIds };
  }

  const { data, error } = await supabase
    .from("sections")
    .select(
      "id, course_id, title, position, lectures(id, section_id, title, video_url, description, duration_sec, position, is_preview)",
    )
    .in("course_id", courseIds)
    .order("position", { ascending: true });

  logSupabaseError("fetch sections", error);

  const sectionRows = Array.isArray(data) ? (data as RowRecord[]) : [];

  for (const sectionRow of sectionRows) {
    const sectionId = toStringValue(sectionRow.id);
    const courseId = toStringValue(sectionRow.course_id);
    const title = toStringValue(sectionRow.title);

    if (!sectionId || !courseId || !title) {
      continue;
    }

    const section: StudentSection = {
      id: sectionId,
      courseId,
      title,
      position: toInteger(sectionRow.position),
      lectures: [],
    };

    sectionIds.push(sectionId);

    const lectureRows = Array.isArray(sectionRow.lectures)
      ? (sectionRow.lectures as RowRecord[])
      : [];

    const normalizedLectures = lectureRows
      .map((lectureRow) => normalizeLecture(lectureRow, section))
      .filter((lecture): lecture is StudentLecture => Boolean(lecture))
      .sort((left, right) => left.position - right.position);

    section.lectures = normalizedLectures;

    for (const lecture of normalizedLectures) {
      lectureIds.push(lecture.id);
    }

    const currentSections = sectionsByCourse.get(courseId) ?? [];
    currentSections.push(section);
    sectionsByCourse.set(courseId, currentSections);

    const currentLectures = lecturesByCourse.get(courseId) ?? [];
    currentLectures.push(...normalizedLectures);
    lecturesByCourse.set(courseId, currentLectures);
  }

  for (const [courseId, sections] of sectionsByCourse.entries()) {
    sectionsByCourse.set(
      courseId,
      [...sections].sort((left, right) => left.position - right.position),
    );
  }

  for (const [courseId, lectures] of lecturesByCourse.entries()) {
    lecturesByCourse.set(courseId, orderLectures(lectures));
  }

  return {
    sectionsByCourse,
    lecturesByCourse,
    sectionIds,
    lectureIds,
  };
}

export async function fetchStudentLearningOverview(
  supabase: SupabaseClient,
  userId: string,
): Promise<StudentLearningOverview> {
  const [profileResult, enrollmentResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, email, avatar, role")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("enrollments")
      .select(
        "id, user_id, course_id, status, enrolled_at, expires_at, course:courses(id, name, slug, description, level, thumbnail_url, instructor_id, price, discount_price, status, created_at, instructor:users!instructor_id(id, name, avatar))",
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .order("enrolled_at", { ascending: false }),
  ]);

  logSupabaseError("fetch profile", profileResult.error);
  logSupabaseError("fetch enrollments", enrollmentResult.error);

  const profileRecord = profileResult.data as RowRecord | null;
  const profile: StudentProfile | null = profileRecord
    ? {
      id: toStringValue(profileRecord.id),
      name: toNullableString(profileRecord.name),
      email: toStringValue(profileRecord.email),
      avatar: toNullableString(profileRecord.avatar),
      role: toNullableString(profileRecord.role),
    }
    : null;

  const enrollmentRows = Array.isArray(enrollmentResult.data)
    ? (enrollmentResult.data as RowRecord[])
    : [];

  const enrollmentSeed = enrollmentRows
    .map((row) => {
      const course = normalizeCourse(row.course);
      if (!course) {
        return null;
      }

      const enrollmentId = toStringValue(row.id);
      const courseId = toStringValue(row.course_id);
      const userIdValue = toStringValue(row.user_id);

      if (!enrollmentId || !courseId || !userIdValue) {
        return null;
      }

      return {
        enrollmentId,
        userId: userIdValue,
        courseId,
        status: toStringValue(row.status),
        enrolledAt: toNullableString(row.enrolled_at),
        expiresAt: toNullableString(row.expires_at),
        course,
      };
    })
    .filter(
      (
        enrollment,
      ): enrollment is {
        enrollmentId: string;
        userId: string;
        courseId: string;
        status: string;
        enrolledAt: string | null;
        expiresAt: string | null;
        course: StudentCourse;
      } => Boolean(enrollment),
    );

  const courseIds = enrollmentSeed.map((enrollment) => enrollment.courseId);

  const { sectionsByCourse, lecturesByCourse, sectionIds, lectureIds } =
    await fetchSectionsForCourses(supabase, courseIds);

  const progressMap = await fetchLectureProgressMap(supabase, userId, lectureIds);

  const enrolledCourses: StudentEnrolledCourse[] = enrollmentSeed.map((seed) => {
    const sections = sectionsByCourse.get(seed.courseId) ?? [];
    const lectures = lecturesByCourse.get(seed.courseId) ?? [];
    const progress = computeCourseProgress(lectures, progressMap);

    return {
      enrollmentId: seed.enrollmentId,
      userId: seed.userId,
      courseId: seed.courseId,
      status: seed.status,
      enrolledAt: seed.enrolledAt,
      expiresAt: seed.expiresAt,
      course: seed.course,
      sections,
      lectures,
      progress,
    };
  });

  enrolledCourses.sort((left, right) => {
    const leftKey =
      timestampToMs(left.progress.lastActivityAt) || timestampToMs(left.enrolledAt);
    const rightKey =
      timestampToMs(right.progress.lastActivityAt) || timestampToMs(right.enrolledAt);

    return rightKey - leftKey;
  });

  const totals = enrolledCourses.reduce(
    (accumulator, enrollment) => {
      accumulator.totalLectures += enrollment.progress.totalLectures;
      accumulator.completedLectures += enrollment.progress.completedLectures;
      accumulator.totalWatchSeconds += enrollment.progress.watchedSeconds;
      if (enrollment.progress.isCompleted) {
        accumulator.completedCourses += 1;
      }
      return accumulator;
    },
    {
      totalLectures: 0,
      completedLectures: 0,
      completedCourses: 0,
      totalWatchSeconds: 0,
    },
  );

  return {
    profile,
    enrolledCourses,
    courseIds,
    sectionIds,
    lectureIds,
    totalLectures: totals.totalLectures,
    completedLectures: totals.completedLectures,
    completedCourses: totals.completedCourses,
    totalWatchSeconds: totals.totalWatchSeconds,
  };
}

export async function fetchStudentDashboardData(
  supabase: SupabaseClient,
  userId: string,
): Promise<StudentDashboardData> {
  const overview = await fetchStudentLearningOverview(supabase, userId);
  const enrolledCourseSet = new Set(overview.courseIds);

  const [exploreResult, certificatesResult] = await Promise.all([
    supabase
      .from("courses")
      .select(
        "id, name, slug, description, level, thumbnail_url, instructor_id, price, discount_price, status, created_at, instructor:users!instructor_id(id, name, avatar)",
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("certificates").select("id").eq("user_id", userId),
  ]);

  logSupabaseError("fetch explore courses", exploreResult.error);
  logSupabaseError("fetch certificates", certificatesResult.error);

  const exploreCourses = (Array.isArray(exploreResult.data)
    ? (exploreResult.data as RowRecord[])
    : [])
    .map((row) => normalizeCourse(row))
    .filter((course): course is StudentCourse => Boolean(course))
    .filter((course) => !enrolledCourseSet.has(course.id))
    .slice(0, 6);

  const certificatesEarned = Array.isArray(certificatesResult.data)
    ? certificatesResult.data.length
    : 0;

  const courseNameById = new Map(
    overview.enrolledCourses.map((enrollment) => [
      enrollment.course.id,
      enrollment.course.name,
    ]),
  );

  let upcomingStreams: StudentLiveStream[] = [];
  if (overview.courseIds.length > 0) {
    const { data: streamData, error: streamError } = await supabase
      .from("live_streams")
      .select("id, title, course_id, status, started_at, ended_at, yt_video_id")
      .in("course_id", overview.courseIds)
      .in("status", ["live", "ended"])
      .order("started_at", { ascending: false })
      .limit(8);

    logSupabaseError("fetch live streams", streamError);

    upcomingStreams = (Array.isArray(streamData) ? (streamData as RowRecord[]) : [])
      .map((row) => {
        const id = toStringValue(row.id);
        const title = toStringValue(row.title);
        const courseId = toStringValue(row.course_id);

        if (!id || !title || !courseId) {
          return null;
        }

        return {
          id,
          title,
          courseId,
          courseName: courseNameById.get(courseId) ?? "Course",
          status: toStringValue(row.status),
          scheduledAt: toNullableString(row.started_at) ?? toNullableString(row.ended_at),
          startedAt: toNullableString(row.started_at),
          endedAt: toNullableString(row.ended_at),
          ytVideoId: toNullableString(row.yt_video_id),
        };
      })
      .filter((stream): stream is StudentLiveStream => Boolean(stream));
  }

  let quizzesPublished = 0;
  let quizzesAttempted = 0;
  let quizzesPassed = 0;
  let latestQuizAttempts: StudentQuizAttemptSummary[] = [];

  if (overview.sectionIds.length > 0) {
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .select("id, title, section_id, total_marks, passing_marks, is_published")
      .in("section_id", overview.sectionIds)
      .eq("is_published", true);

    logSupabaseError("fetch quizzes", quizError);

    const quizzes = (Array.isArray(quizData) ? (quizData as RowRecord[]) : [])
      .map((row) => {
        const id = toStringValue(row.id);
        const title = toStringValue(row.title);

        if (!id || !title) {
          return null;
        }

        return {
          id,
          title,
          passingMarks: toInteger(row.passing_marks),
          totalMarks: toInteger(row.total_marks),
        };
      })
      .filter(
        (
          quiz,
        ): quiz is { id: string; title: string; passingMarks: number; totalMarks: number } =>
          Boolean(quiz),
      );

    quizzesPublished = quizzes.length;

    if (quizzes.length > 0) {
      const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
      const quizIds = quizzes.map((quiz) => quiz.id);

      const { data: attemptData, error: attemptError } = await supabase
        .from("quiz_attempts")
        .select("id, quiz_id, score, total_marks, status, submitted_at")
        .eq("user_id", userId)
        .in("quiz_id", quizIds)
        .order("submitted_at", { ascending: false });

      logSupabaseError("fetch quiz attempts", attemptError);

      const attemptRows = Array.isArray(attemptData)
        ? (attemptData as RowRecord[])
        : [];

      const submittedAttempts = attemptRows
        .map((row) => {
          const quizId = toStringValue(row.quiz_id);
          const quiz = quizById.get(quizId);

          if (!quiz) {
            return null;
          }

          const score = toInteger(row.score);
          const totalMarks = toInteger(row.total_marks) || quiz.totalMarks;
          const status = toStringValue(row.status);
          const submittedAt = toNullableString(row.submitted_at);

          return {
            quizId,
            quizTitle: quiz.title,
            score,
            totalMarks,
            passingMarks: quiz.passingMarks,
            status,
            submittedAt,
            passed: score >= quiz.passingMarks,
          };
        })
        .filter((attempt): attempt is StudentQuizAttemptSummary => Boolean(attempt))
        .filter((attempt) => attempt.status === "submitted");

      const attemptedQuizIds = new Set(submittedAttempts.map((attempt) => attempt.quizId));
      quizzesAttempted = attemptedQuizIds.size;

      for (const quizId of attemptedQuizIds) {
        const attemptsForQuiz = submittedAttempts.filter(
          (attempt) => attempt.quizId === quizId,
        );

        const bestScore = attemptsForQuiz.reduce(
          (best, attempt) => Math.max(best, attempt.score),
          0,
        );

        const passingMarks = attemptsForQuiz[0]?.passingMarks ?? Number.MAX_SAFE_INTEGER;
        if (bestScore >= passingMarks) {
          quizzesPassed += 1;
        }
      }

      latestQuizAttempts = submittedAttempts.slice(0, 3);
    }
  }

  const continueCourse =
    overview.enrolledCourses.find(
      (enrollment) => Boolean(enrollment.progress.continueLectureId),
    ) ?? overview.enrolledCourses[0] ?? null;

  return {
    overview,
    exploreCourses,
    continueCourse,
    certificatesEarned,
    upcomingStreams,
    quizzesPublished,
    quizzesAttempted,
    quizzesPassed,
    latestQuizAttempts,
  };
}

export async function fetchStudentCoursePlayerData(
  supabase: SupabaseClient,
  userId: string,
  slug: string,
  lectureId: string,
): Promise<StudentCoursePlayerData | null> {
  const { data: courseData, error: courseError } = await supabase
    .from("courses")
    .select(
      "id, name, slug, description, level, thumbnail_url, instructor_id, price, discount_price, status, created_at, instructor:users!instructor_id(id, name, avatar)",
    )
    .eq("slug", slug)
    .maybeSingle();

  logSupabaseError("fetch player course", courseError);

  const course = normalizeCourse(courseData as RowRecord | null);
  if (!course) {
    return null;
  }

  const [{ data: enrollmentData, error: enrollmentError }, sectionsBundle] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id, status, enrolled_at, expires_at")
      .eq("user_id", userId)
      .eq("course_id", course.id)
      .eq("status", "active")
      .maybeSingle(),
    fetchSectionsForCourses(supabase, [course.id]),
  ]);

  logSupabaseError("fetch player enrollment", enrollmentError);

  const sections = sectionsBundle.sectionsByCourse.get(course.id) ?? [];
  const orderedLectures = sectionsBundle.lecturesByCourse.get(course.id) ?? [];
  const progressMap = await fetchLectureProgressMap(
    supabase,
    userId,
    sectionsBundle.lectureIds,
  );

  const requestedLecture = orderedLectures.find((lecture) => lecture.id === lectureId) ?? null;
  const currentLecture = requestedLecture ?? orderedLectures[0] ?? null;

  const shouldRedirectToLectureId =
    currentLecture && currentLecture.id !== lectureId ? currentLecture.id : null;

  const [resourcesResult, streamsResult] = await Promise.all([
    currentLecture
      ? supabase
        .from("resources")
        .select("id, title, file_url")
        .eq("lecture_id", currentLecture.id)
        .order("title", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("live_streams")
      .select("id, title, course_id, status, started_at, ended_at, yt_video_id")
      .eq("course_id", course.id)
      .in("status", ["live", "ended"])
      .order("started_at", { ascending: false })
      .limit(3),
  ]);

  logSupabaseError("fetch lecture resources", resourcesResult.error);
  logSupabaseError("fetch player live streams", streamsResult.error);

  const resources = (Array.isArray(resourcesResult.data)
    ? (resourcesResult.data as RowRecord[])
    : [])
    .map((row) => {
      const id = toStringValue(row.id);
      const title = toStringValue(row.title);
      const fileUrl = toStringValue(row.file_url);

      if (!id || !title || !fileUrl) {
        return null;
      }

      return {
        id,
        title,
        fileUrl,
      };
    })
    .filter(
      (
        resource,
      ): resource is { id: string; title: string; fileUrl: string } => Boolean(resource),
    );

  const relatedLiveStreams = (Array.isArray(streamsResult.data)
    ? (streamsResult.data as RowRecord[])
    : [])
    .map((row) => {
      const id = toStringValue(row.id);
      const title = toStringValue(row.title);
      const courseId = toStringValue(row.course_id);

      if (!id || !title || !courseId) {
        return null;
      }

      return {
        id,
        title,
        courseId,
        courseName: course.name,
        status: toStringValue(row.status),
        scheduledAt: toNullableString(row.started_at) ?? toNullableString(row.ended_at),
        startedAt: toNullableString(row.started_at),
        endedAt: toNullableString(row.ended_at),
        ytVideoId: toNullableString(row.yt_video_id),
      };
    })
    .filter((stream): stream is StudentLiveStream => Boolean(stream));

  const courseProgress = computeCourseProgress(orderedLectures, progressMap);

  const currentLectureIndex = currentLecture
    ? orderedLectures.findIndex((lecture) => lecture.id === currentLecture.id)
    : -1;

  const previousLectureId =
    currentLectureIndex > 0 ? orderedLectures[currentLectureIndex - 1].id : null;

  const nextLectureId =
    currentLectureIndex >= 0 && currentLectureIndex < orderedLectures.length - 1
      ? orderedLectures[currentLectureIndex + 1].id
      : null;

  let quizAttempts: StudentQuizAttemptSummary[] = [];
  if (sectionsBundle.sectionIds.length > 0) {
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .select("id, title, section_id, total_marks, passing_marks, is_published")
      .in("section_id", sectionsBundle.sectionIds)
      .eq("is_published", true);

    logSupabaseError("fetch player quizzes", quizError);

    const quizzes = (Array.isArray(quizData) ? (quizData as RowRecord[]) : [])
      .map((row) => {
        const id = toStringValue(row.id);
        const title = toStringValue(row.title);

        if (!id || !title) {
          return null;
        }

        return {
          id,
          title,
          totalMarks: toInteger(row.total_marks),
          passingMarks: toInteger(row.passing_marks),
        };
      })
      .filter(
        (
          quiz,
        ): quiz is { id: string; title: string; totalMarks: number; passingMarks: number } =>
          Boolean(quiz),
      );

    if (quizzes.length > 0) {
      const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
      const quizIds = quizzes.map((quiz) => quiz.id);

      const { data: attemptsData, error: attemptsError } = await supabase
        .from("quiz_attempts")
        .select("quiz_id, score, total_marks, status, submitted_at")
        .eq("user_id", userId)
        .in("quiz_id", quizIds)
        .order("submitted_at", { ascending: false });

      logSupabaseError("fetch player quiz attempts", attemptsError);

      quizAttempts = (Array.isArray(attemptsData) ? (attemptsData as RowRecord[]) : [])
        .map((row) => {
          const quizId = toStringValue(row.quiz_id);
          const quiz = quizById.get(quizId);

          if (!quiz) {
            return null;
          }

          const score = toInteger(row.score);
          const totalMarks = toInteger(row.total_marks) || quiz.totalMarks;
          const status = toStringValue(row.status);
          const submittedAt = toNullableString(row.submitted_at);

          return {
            quizId,
            quizTitle: quiz.title,
            score,
            totalMarks,
            passingMarks: quiz.passingMarks,
            status,
            submittedAt,
            passed: score >= quiz.passingMarks,
          };
        })
        .filter((attempt): attempt is StudentQuizAttemptSummary => Boolean(attempt))
        .slice(0, 5);
    }
  }

  const enrollmentRecord = enrollmentData as RowRecord | null;

  return {
    course,
    enrollment: enrollmentRecord
      ? {
        id: toStringValue(enrollmentRecord.id),
        status: toStringValue(enrollmentRecord.status),
        enrolledAt: toNullableString(enrollmentRecord.enrolled_at),
        expiresAt: toNullableString(enrollmentRecord.expires_at),
      }
      : null,
    sections,
    orderedLectures,
    lectureProgressMap: progressMap,
    currentLecture,
    shouldRedirectToLectureId,
    resources,
    courseProgress,
    previousLectureId,
    nextLectureId,
    relatedLiveStreams,
    quizAttempts,
  };
}

export function formatDurationCompact(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function formatWatchTimeCompact(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function extractYoutubeVideoId(input: string | null | undefined): string | null {
  if (!input) {
    return null;
  }

  const value = input.trim();
  if (!value) {
    return null;
  }

  const directIdPattern = /^[a-zA-Z0-9_-]{11}$/;
  if (directIdPattern.test(value)) {
    return value;
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

export function buildYoutubeEmbedUrl(input: string | null | undefined): string | null {
  const videoId = extractYoutubeVideoId(input);
  if (!videoId) {
    return null;
  }

  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    autoplay: "0",
    playsinline: "1",
    iv_load_policy: "3",
    fs: "1",
    loop: "1",
    playlist: videoId,
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
