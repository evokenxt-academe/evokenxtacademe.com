/**
 * Taxonomy Queries — Programs, Levels, Subjects, Topics, SubTopics
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Program, ProgramLevel, Subject, Topic, SubTopic, Course, Chapter } from "@/types/quiz";

export async function getPrograms(supabase: SupabaseClient): Promise<Program[]> {
  const { data, error } = await supabase.from("programs").select("*").eq("is_active", true).order("body");
  if (error) { console.error("[topics] getPrograms:", error.message); return []; }
  return data ?? [];
}

export async function getProgramLevels(supabase: SupabaseClient, programId: string): Promise<ProgramLevel[]> {
  const { data, error } = await supabase.from("program_levels").select("*").eq("program_id", programId).order("sequence_no");
  if (error) { console.error("[topics] getProgramLevels:", error.message); return []; }
  return data ?? [];
}

export async function getSubjects(supabase: SupabaseClient, programLevelId: string): Promise<Subject[]> {
  const { data, error } = await supabase.from("subjects").select("*").eq("program_level_id", programLevelId).eq("is_active", true).order("sequence_no");
  if (error) { console.error("[topics] getSubjects:", error.message); return []; }
  return data ?? [];
}

export async function getTopics(supabase: SupabaseClient, subjectId: string): Promise<Topic[]> {
  const { data, error } = await supabase.from("topics").select("*").eq("subject_id", subjectId).eq("is_active", true).order("position");
  if (error) { console.error("[topics] getTopics:", error.message); return []; }
  return data ?? [];
}

export async function getSubTopics(supabase: SupabaseClient, topicId: string): Promise<SubTopic[]> {
  const { data, error } = await supabase.from("sub_topics").select("*").eq("topic_id", topicId).eq("is_active", true).order("position");
  if (error) { console.error("[topics] getSubTopics:", error.message); return []; }
  return data ?? [];
}

export async function getCoursesBySubject(supabase: SupabaseClient, subjectId: string): Promise<Course[]> {
  const { data, error } = await supabase.from("courses").select("*").eq("subject_id", subjectId).order("title");
  if (error) { console.error("[topics] getCourses:", error.message); return []; }
  return data ?? [];
}

export async function getCoursesForProgram(supabase: SupabaseClient, programId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("*, subject:subjects!inner(id, program_level:program_levels!inner(id, program_id))")
    .eq("subject.program_level.program_id", programId)
    .order("title");
  if (error) { console.error("[topics] getCoursesForProgram:", error.message); return []; }
  return data ?? [];
}

export async function getChapters(supabase: SupabaseClient, courseId: string): Promise<Chapter[]> {
  const { data, error } = await supabase.from("chapters").select("*").eq("course_id", courseId).order("position");
  if (error) { console.error("[topics] getChapters:", error.message); return []; }
  return data ?? [];
}

export async function getTopicsWithCounts(supabase: SupabaseClient, subjectId: string) {
  const { data, error } = await supabase
    .from("topics")
    .select("*, sub_topics(*), bank_questions(id)")
    .eq("subject_id", subjectId)
    .eq("is_active", true)
    .order("position");

  if (error) { console.error("[topics] getTopicsWithCounts:", error.message); return []; }
  return (data ?? []).map((t: any) => ({
    ...t,
    questionCount: (t.bank_questions ?? []).length,
    sub_topics: (t.sub_topics ?? []).map((st: any) => ({ ...st })),
  }));
}
