import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// ── Types ────────────────────────────────────────────────────────────

export type CourseListItem = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  total_students: number;
  avg_rating: number | null;
  thumbnail_url: string | null;
  language: string;
  created_at: string;
  subject: {
    id: string;
    code: string;
    name: string;
    program_level: {
      id: string;
      label: string;
      program: {
        id: string;
        body: string;
        full_name: string;
      };
    };
  } | null;
  instructor: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
};

export type CourseDetail = CourseListItem & {
  short_description: string | null;
  description: string | null;
  what_you_learn: string[];
  requirements: string[];
  preview_video_url: string | null;
  instructor_id: string;
  subject_id: string;
  updated_at: string;
};

export type Program = {
  id: string;
  body: string;
  full_name: string;
  is_active: boolean;
};

export type ProgramLevel = {
  id: string;
  program_id: string;
  label: string;
  sequence_no: number;
};

export type Subject = {
  id: string;
  program_level_id: string;
  code: string;
  name: string;
  sequence_no: number;
  is_active: boolean;
};

export type Instructor = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};

export type Chapter = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  position: number;
  is_published: boolean;
  lectures?: Lecture[];
};

export type Lecture = {
  id: string;
  chapter_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_provider: string | null;
  yt_video_id: string | null;
  duration_sec: number;
  position: number;
  is_preview: boolean;
  is_published: boolean;
  transcript_url: string | null;
  notes_url: string | null;
};

export type LectureResource = {
  id: string;
  lecture_id: string;
  title: string;
  file_url: string;
  file_type: string;
  file_size_kb: number | null;
  position: number;
};

export type CoursePricing = {
  id: string;
  course_id: string;
  label: string;
  currency: string;
  base_price: number;
  discounted_price: number | null;
  discount_pct: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
};

export type StudyMaterial = {
  id: string;
  course_id: string;
  chapter_id: string | null;
  title: string;
  description: string | null;
  type: string;
  access_level: string;
  file_url: string;
  file_size_kb: number | null;
  is_published: boolean;
  position: number;
};

// ── Course List Queries ──────────────────────────────────────────────

export type CourseFilters = {
  search?: string;
  programId?: string;
  levelId?: string;
  subjectId?: string;
  status?: string;
  instructorId?: string;
};

export async function fetchCourses(
  filters: CourseFilters = {},
  page: number = 0,
  pageSize: number = 20
) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("courses")
    .select(
      `
      id, title, slug, status, is_featured, total_students, avg_rating,
      thumbnail_url, language, created_at,
      subject:subjects(
        id, code, name,
        program_level:program_levels(
          id, label,
          program:programs(id, body, full_name)
        )
      ),
      instructor:users!instructor_id(id, name, email, avatar)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.instructorId) {
    query = query.eq("instructor_id", filters.instructorId);
  }
  if (filters.subjectId) {
    query = query.eq("subject_id", filters.subjectId);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;
  return { data: (data || []) as unknown as CourseListItem[], count: count || 0 };
}

export async function fetchCourseById(id: string) {
  const { data, error } = await supabase
    .from("courses")
    .select(
      `
      id, title, slug, status, is_featured, total_students, avg_rating,
      thumbnail_url, language, created_at, updated_at,
      short_description, description, what_you_learn, requirements,
      preview_video_url, instructor_id, subject_id,
      subject:subjects(
        id, code, name,
        program_level:program_levels(
          id, label,
          program:programs(id, body, full_name)
        )
      ),
      instructor:users!instructor_id(id, name, email, avatar)
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as unknown as CourseDetail;
}

// ── Program / Level / Subject ────────────────────────────────────────

export async function fetchPrograms() {
  const { data, error } = await supabase
    .from("programs")
    .select("id, body, full_name, is_active")
    .eq("is_active", true)
    .order("body");

  if (error) throw error;
  return data as Program[];
}

export async function fetchProgramLevels(programId: string) {
  const { data, error } = await supabase
    .from("program_levels")
    .select("id, program_id, label, sequence_no")
    .eq("program_id", programId)
    .order("sequence_no");

  if (error) throw error;
  return data as ProgramLevel[];
}

export async function fetchSubjects(programLevelId: string) {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, program_level_id, code, name, sequence_no, is_active")
    .eq("program_level_id", programLevelId)
    .order("sequence_no");

  if (error) throw error;
  return data as Subject[];
}

export async function fetchInstructors() {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, avatar")
    .in("role", ["instructor", "admin"])
    .order("name");

  if (error) throw error;
  return data as Instructor[];
}

// ── Slug Check ───────────────────────────────────────────────────────

export async function checkSlugUnique(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase.from("courses").select("id").eq("slug", slug);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.limit(1);
  return (data?.length ?? 0) === 0;
}

// ── Course Mutations ─────────────────────────────────────────────────

export async function createCourse(
  values: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("courses")
    .insert(values)
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function updateCourse(
  id: string,
  values: Record<string, unknown>
) {
  const { error } = await supabase
    .from("courses")
    .update(values)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteCourse(id: string) {
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateCourse(id: string) {
  const course = await fetchCourseById(id);
  const newSlug = `${course.slug}-copy-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from("courses")
    .insert({
      subject_id: course.subject_id,
      instructor_id: course.instructor_id,
      title: `${course.title} (Copy)`,
      slug: newSlug,
      description: course.description,
      short_description: course.short_description,
      what_you_learn: course.what_you_learn,
      requirements: course.requirements,
      thumbnail_url: course.thumbnail_url,
      preview_video_url: course.preview_video_url,
      language: course.language,
      status: "draft" as const,
      is_featured: false,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function toggleFeatured(id: string, isFeatured: boolean) {
  const { error } = await supabase
    .from("courses")
    .update({ is_featured: isFeatured })
    .eq("id", id);

  if (error) throw error;
}

export async function updateCourseStatus(
  id: string,
  status: "draft" | "published" | "archived"
) {
  const { error } = await supabase
    .from("courses")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

export async function bulkUpdateStatus(
  ids: string[],
  status: "draft" | "published" | "archived"
) {
  const { error } = await supabase
    .from("courses")
    .update({ status })
    .in("id", ids);

  if (error) throw error;
}

export async function bulkDeleteCourses(ids: string[]) {
  const { error } = await supabase.from("courses").delete().in("id", ids);
  if (error) throw error;
}

// ── Chapter Queries ──────────────────────────────────────────────────

export async function fetchChapters(courseId: string) {
  const { data, error } = await supabase
    .from("chapters")
    .select(
      `
      id, course_id, title, description, position, is_published,
      lectures(
        id, chapter_id, title, description, video_url, video_provider,
        yt_video_id, duration_sec, position, is_preview, is_published,
        transcript_url, notes_url
      )
    `
    )
    .eq("course_id", courseId)
    .order("position")
    .order("position", { referencedTable: "lectures" });

  if (error) throw error;
  return data as Chapter[];
}

export async function createChapter(
  courseId: string,
  title: string,
  position: number
) {
  const { data, error } = await supabase
    .from("chapters")
    .insert({ course_id: courseId, title, position })
    .select()
    .single();

  if (error) throw error;
  return data as Chapter;
}

export async function updateChapter(
  id: string,
  values: Partial<Chapter>
) {
  const { error } = await supabase
    .from("chapters")
    .update(values)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteChapter(id: string) {
  const { error } = await supabase.from("chapters").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderChapters(
  courseId: string,
  orderedIds: string[]
) {
  const updates = orderedIds.map((id, index) => ({
    id,
    course_id: courseId,
    position: index,
  }));
  const { error } = await supabase.from("chapters").upsert(updates);
  if (error) throw error;
}

// ── Lecture Queries ──────────────────────────────────────────────────

export async function fetchLecture(id: string) {
  const { data, error } = await supabase
    .from("lectures")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Lecture;
}

export async function createLecture(
  chapterId: string,
  title: string,
  position: number
) {
  const { data, error } = await supabase
    .from("lectures")
    .insert({ chapter_id: chapterId, title, position })
    .select()
    .single();

  if (error) throw error;
  return data as Lecture;
}

export async function updateLecture(
  id: string,
  values: Partial<Lecture>
) {
  const { error } = await supabase
    .from("lectures")
    .update(values)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteLecture(id: string) {
  const { error } = await supabase.from("lectures").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderLectures(
  chapterId: string,
  orderedIds: string[]
) {
  const updates = orderedIds.map((id, index) => ({
    id,
    chapter_id: chapterId,
    position: index,
  }));
  const { error } = await supabase.from("lectures").upsert(updates);
  if (error) throw error;
}

// ── Lecture Resources ────────────────────────────────────────────────

export async function fetchLectureResources(lectureId: string) {
  const { data, error } = await supabase
    .from("lecture_resources")
    .select("*")
    .eq("lecture_id", lectureId)
    .order("position");

  if (error) throw error;
  return data as LectureResource[];
}

export async function addLectureResource(
  values: Omit<LectureResource, "id">
) {
  const { data, error } = await supabase
    .from("lecture_resources")
    .insert(values)
    .select()
    .single();

  if (error) throw error;
  return data as LectureResource;
}

export async function deleteLectureResource(id: string) {
  const { error } = await supabase
    .from("lecture_resources")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ── Pricing Queries ──────────────────────────────────────────────────

export async function fetchCoursePricing(courseId: string) {
  const { data, error } = await supabase
    .from("course_pricing")
    .select("*")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  // If table doesn't exist or no data, return empty
  if (error) {
    console.warn("Pricing fetch error:", error.message);
    return [] as CoursePricing[];
  }
  return (data || []) as CoursePricing[];
}

export async function createCoursePricing(
  values: Omit<CoursePricing, "id" | "discount_pct">
) {
  const { data, error } = await supabase
    .from("course_pricing")
    .insert(values)
    .select()
    .single();

  if (error) throw error;
  return data as CoursePricing;
}

export async function updateCoursePricing(
  id: string,
  values: Partial<CoursePricing>
) {
  const { error } = await supabase
    .from("course_pricing")
    .update(values)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteCoursePricing(id: string) {
  const { error } = await supabase
    .from("course_pricing")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ── Study Materials ──────────────────────────────────────────────────

export async function fetchStudyMaterials(courseId: string) {
  const { data, error } = await supabase
    .from("study_materials")
    .select("*")
    .eq("course_id", courseId)
    .order("position");

  if (error) {
    console.warn("Study materials fetch error:", error.message);
    return [] as StudyMaterial[];
  }
  return (data || []) as StudyMaterial[];
}

export async function createStudyMaterial(
  values: Omit<StudyMaterial, "id">
) {
  const { data, error } = await supabase
    .from("study_materials")
    .insert(values)
    .select()
    .single();

  if (error) throw error;
  return data as StudyMaterial;
}

export async function updateStudyMaterial(
  id: string,
  values: Partial<StudyMaterial>
) {
  const { error } = await supabase
    .from("study_materials")
    .update(values)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteStudyMaterial(id: string) {
  const { error } = await supabase
    .from("study_materials")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
