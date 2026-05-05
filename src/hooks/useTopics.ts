"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getPrograms, getProgramLevels, getSubjects, getTopics, getSubTopics, getCoursesBySubject, getChapters } from "@/lib/supabase/queries/topics";

export function usePrograms() {
  const supabase = createClient();
  return useQuery({ queryKey: ["programs"], queryFn: () => getPrograms(supabase) });
}

export function useProgramLevels(programId?: string) {
  const supabase = createClient();
  return useQuery({ queryKey: ["program-levels", programId], queryFn: () => getProgramLevels(supabase, programId!), enabled: !!programId });
}

export function useSubjects(programLevelId?: string) {
  const supabase = createClient();
  return useQuery({ queryKey: ["subjects", programLevelId], queryFn: () => getSubjects(supabase, programLevelId!), enabled: !!programLevelId });
}

export function useTopics(subjectId?: string) {
  const supabase = createClient();
  return useQuery({ queryKey: ["topics", subjectId], queryFn: () => getTopics(supabase, subjectId!), enabled: !!subjectId });
}

export function useSubTopics(topicId?: string) {
  const supabase = createClient();
  return useQuery({ queryKey: ["sub-topics", topicId], queryFn: () => getSubTopics(supabase, topicId!), enabled: !!topicId });
}

export function useCoursesBySubject(subjectId?: string) {
  const supabase = createClient();
  return useQuery({ queryKey: ["courses-by-subject", subjectId], queryFn: () => getCoursesBySubject(supabase, subjectId!), enabled: !!subjectId });
}

export function useChapters(courseId?: string) {
  const supabase = createClient();
  return useQuery({ queryKey: ["chapters", courseId], queryFn: () => getChapters(supabase, courseId!), enabled: !!courseId });
}
