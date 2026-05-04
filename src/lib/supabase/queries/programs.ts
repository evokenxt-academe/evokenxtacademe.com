/**
 * Programs Query Layer - Evoke EduGlobal LMS v2.0.0
 * Queries for programs, levels, and subjects hierarchy
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database-v2.types";
import type {
  Program,
  ProgramLevel,
  Subject,
  ProgramWithStructure,
  ProgramBody,
} from "@/types/database-v2.types";

// ─── Result type helpers ───────────────────────────────────────────

type QueryResult<T> = { data: T | null; error: string | null };

function handleError(scope: string, error: { message?: string } | null): string | null {
  if (!error) return null;
  const msg = error.message ?? "Unknown error";
  console.error(`[queries/programs] ${scope}: ${msg}`);
  return msg;
}

// ─── Program Queries ───────────────────────────────────────────────

/**
 * Fetch all active programs (ACCA, CFA, CMA)
 */
export async function getActivePrograms(
  supabase: SupabaseClient<Database>
): Promise<QueryResult<Program[]>> {
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("is_active", true)
    .order("body", { ascending: true });

  const errMsg = handleError("getActivePrograms", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

/**
 * Fetch a single program by body (ACCA, CFA, CMA)
 */
export async function getProgramByBody(
  supabase: SupabaseClient<Database>,
  body: ProgramBody
): Promise<QueryResult<Program>> {
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("body", body)
    .eq("is_active", true)
    .maybeSingle();

  const errMsg = handleError("getProgramByBody", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data, error: null };
}

/**
 * Fetch a program by ID
 */
export async function getProgramById(
  supabase: SupabaseClient<Database>,
  programId: string
): Promise<QueryResult<Program>> {
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("id", programId)
    .maybeSingle();

  const errMsg = handleError("getProgramById", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data, error: null };
}

// ─── Program Level Queries ─────────────────────────────────────────

/**
 * Fetch all levels for a program
 */
export async function getProgramLevels(
  supabase: SupabaseClient<Database>,
  programId: string
): Promise<QueryResult<ProgramLevel[]>> {
  const { data, error } = await supabase
    .from("program_levels")
    .select("*")
    .eq("program_id", programId)
    .order("sequence_no", { ascending: true });

  const errMsg = handleError("getProgramLevels", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

/**
 * Fetch a single program level by ID
 */
export async function getProgramLevelById(
  supabase: SupabaseClient<Database>,
  levelId: string
): Promise<QueryResult<ProgramLevel>> {
  const { data, error } = await supabase
    .from("program_levels")
    .select("*")
    .eq("id", levelId)
    .maybeSingle();

  const errMsg = handleError("getProgramLevelById", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data, error: null };
}

// ─── Subject Queries ───────────────────────────────────────────────

/**
 * Fetch all active subjects for a program level
 */
export async function getSubjectsByLevel(
  supabase: SupabaseClient<Database>,
  levelId: string
): Promise<QueryResult<Subject[]>> {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("program_level_id", levelId)
    .eq("is_active", true)
    .order("sequence_no", { ascending: true });

  const errMsg = handleError("getSubjectsByLevel", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data ?? [], error: null };
}

/**
 * Fetch a single subject by ID with its level and program
 */
export async function getSubjectById(
  supabase: SupabaseClient<Database>,
  subjectId: string
): Promise<QueryResult<Subject & { program_level: ProgramLevel & { program: Program } }>> {
  const { data, error } = await supabase
    .from("subjects")
    .select(`
      *,
      program_level:program_levels!program_level_id(
        *,
        program:programs!program_id(*)
      )
    `)
    .eq("id", subjectId)
    .maybeSingle();

  const errMsg = handleError("getSubjectById", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as unknown as Subject & { program_level: ProgramLevel & { program: Program } }, error: null };
}

/**
 * Fetch a subject by code within a specific level
 */
export async function getSubjectByCode(
  supabase: SupabaseClient<Database>,
  levelId: string,
  code: string
): Promise<QueryResult<Subject>> {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("program_level_id", levelId)
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  const errMsg = handleError("getSubjectByCode", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data, error: null };
}

// ─── Full Hierarchy Queries ────────────────────────────────────────

/**
 * Fetch a program with all levels and subjects (full hierarchy)
 */
export async function getProgramWithStructure(
  supabase: SupabaseClient<Database>,
  programId: string
): Promise<QueryResult<ProgramWithStructure>> {
  const { data, error } = await supabase
    .from("programs")
    .select(`
      *,
      levels:program_levels!program_id(
        *,
        subjects!program_level_id(*)
      )
    `)
    .eq("id", programId)
    .eq("is_active", true)
    .maybeSingle();

  const errMsg = handleError("getProgramWithStructure", error);
  if (errMsg) return { data: null, error: errMsg };

  // Sort levels by sequence_no and subjects within each level
  if (data) {
    const sorted = {
      ...data,
      levels: (data.levels ?? [])
        .sort((a: ProgramLevel, b: ProgramLevel) => a.sequence_no - b.sequence_no)
        .map((level: ProgramLevel & { subjects: Subject[] }) => ({
          ...level,
          subjects: (level.subjects ?? [])
            .filter((s: Subject) => s.is_active)
            .sort((a: Subject, b: Subject) => a.sequence_no - b.sequence_no),
        })),
    };
    return { data: sorted as unknown as ProgramWithStructure, error: null };
  }

  return { data: null, error: null };
}

/**
 * Fetch all programs with their full structure (for admin/overview)
 */
export async function getAllProgramsWithStructure(
  supabase: SupabaseClient<Database>
): Promise<QueryResult<ProgramWithStructure[]>> {
  const { data, error } = await supabase
    .from("programs")
    .select(`
      *,
      levels:program_levels!program_id(
        *,
        subjects!program_level_id(*)
      )
    `)
    .eq("is_active", true)
    .order("body", { ascending: true });

  const errMsg = handleError("getAllProgramsWithStructure", error);
  if (errMsg) return { data: null, error: errMsg };

  // Sort levels and subjects within each program
  const sorted = (data ?? []).map((program) => ({
    ...program,
    levels: (program.levels ?? [])
      .sort((a: ProgramLevel, b: ProgramLevel) => a.sequence_no - b.sequence_no)
      .map((level: ProgramLevel & { subjects: Subject[] }) => ({
        ...level,
        subjects: (level.subjects ?? [])
          .filter((s: Subject) => s.is_active)
          .sort((a: Subject, b: Subject) => a.sequence_no - b.sequence_no),
      })),
  }));

  return { data: sorted as unknown as ProgramWithStructure[], error: null };
}

/**
 * Fetch program + level info for a subject (breadcrumb data)
 */
export async function getSubjectHierarchy(
  supabase: SupabaseClient<Database>,
  subjectId: string
): Promise<QueryResult<{
  subject: Subject;
  level: ProgramLevel;
  program: Program;
}>> {
  const { data, error } = await supabase
    .from("subjects")
    .select(`
      *,
      program_level:program_levels!program_level_id(
        *,
        program:programs!program_id(*)
      )
    `)
    .eq("id", subjectId)
    .maybeSingle();

  const errMsg = handleError("getSubjectHierarchy", error);
  if (errMsg) return { data: null, error: errMsg };

  if (!data || !data.program_level) {
    return { data: null, error: null };
  }

  const { program_level, ...subject } = data;
  const { program, ...level } = program_level as ProgramLevel & { program: Program };

  return {
    data: {
      subject: subject as Subject,
      level: level as ProgramLevel,
      program: program as Program,
    },
    error: null,
  };
}
