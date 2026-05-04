/**
 * Certificates Query Layer - Evoke EduGlobal LMS v2.0.0
 * Queries for certificates and completion tracking
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database-v2.types";
import type {
  Certificate,
  Course,
  User,
  CertStatus,
} from "@/types/database-v2.types";

// ─── Result type helpers ───────────────────────────────────────────

type QueryResult<T> = { data: T | null; error: string | null };

function handleError(scope: string, error: { message?: string } | null): string | null {
  if (!error) return null;
  const msg = error.message ?? "Unknown error";
  console.error(`[queries/certificates] ${scope}: ${msg}`);
  return msg;
}

// ─── Certificate Types ─────────────────────────────────────────────

export interface CertificateWithCourse extends Certificate {
  course: Pick<Course, "id" | "title" | "slug" | "thumbnail_url">;
}

export interface CertificateWithDetails extends Certificate {
  course: Course;
  user: Pick<User, "id" | "name" | "email" | "avatar">;
}

// ─── Certificate Queries ───────────────────────────────────────────

/**
 * Fetch certificates for a user
 */
export async function getUserCertificates(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<QueryResult<CertificateWithCourse[]>> {
  const { data, error } = await supabase
    .from("certificates")
    .select(`
      *,
      course:courses!course_id(id, title, slug, thumbnail_url)
    `)
    .eq("user_id", userId)
    .eq("status", "issued")
    .order("issued_at", { ascending: false });

  const errMsg = handleError("getUserCertificates", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as unknown as CertificateWithCourse[], error: null };
}

/**
 * Get certificate by ID
 */
export async function getCertificateById(
  supabase: SupabaseClient<Database>,
  certificateId: string
): Promise<QueryResult<CertificateWithDetails>> {
  const { data, error } = await supabase
    .from("certificates")
    .select(`
      *,
      course:courses!course_id(*),
      user:users!user_id(id, name, email, avatar)
    `)
    .eq("id", certificateId)
    .maybeSingle();

  const errMsg = handleError("getCertificateById", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as unknown as CertificateWithDetails, error: null };
}

/**
 * Get certificate by cert number (for verification)
 */
export async function getCertificateByNumber(
  supabase: SupabaseClient<Database>,
  certNumber: string
): Promise<QueryResult<CertificateWithDetails>> {
  const { data, error } = await supabase
    .from("certificates")
    .select(`
      *,
      course:courses!course_id(*),
      user:users!user_id(id, name, email, avatar)
    `)
    .eq("cert_number", certNumber)
    .maybeSingle();

  const errMsg = handleError("getCertificateByNumber", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as unknown as CertificateWithDetails, error: null };
}

/**
 * Get certificate for a user and course
 */
export async function getUserCourseCertificate(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string
): Promise<QueryResult<Certificate>> {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  const errMsg = handleError("getUserCourseCertificate", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as Certificate | null, error: null };
}

/**
 * Check if user has certificate for a course
 */
export async function hasCertificate(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string
): Promise<QueryResult<boolean>> {
  const { data, error } = await supabase
    .from("certificates")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("status", "issued")
    .maybeSingle();

  const errMsg = handleError("hasCertificate", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: !!data, error: null };
}

// ─── Certificate Stats ─────────────────────────────────────────────

/**
 * Get certificate count for a user
 */
export async function getUserCertificateCount(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<QueryResult<number>> {
  const { data, error } = await supabase
    .from("certificates")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "issued");

  const errMsg = handleError("getUserCertificateCount", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: (data ?? []).length, error: null };
}

/**
 * Get certificate count for a course (admin)
 */
export async function getCourseCertificateCount(
  supabase: SupabaseClient<Database>,
  courseId: string
): Promise<QueryResult<number>> {
  const { data, error } = await supabase
    .from("certificates")
    .select("id")
    .eq("course_id", courseId)
    .eq("status", "issued");

  const errMsg = handleError("getCourseCertificateCount", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: (data ?? []).length, error: null };
}

// ─── Certificate Generation ────────────────────────────────────────

/**
 * Generate a new certificate
 * Note: This should be called via a server action with proper auth
 */
export async function createCertificate(
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string,
  certUrl: string,
  completionPct = 100
): Promise<QueryResult<Certificate>> {
  // Check if certificate already exists
  const { data: existing } = await getUserCourseCertificate(supabase, userId, courseId);
  if (existing) {
    return { data: existing, error: null };
  }

  // Generate certificate number using the database function
  const { data: certNumber, error: certNumError } = await supabase
    .rpc("generate_cert_number", { p_course_id: courseId });

  if (certNumError) {
    const errMsg = handleError("createCertificate:certNum", certNumError);
    return { data: null, error: errMsg };
  }

  // Insert certificate
  const { data, error } = await supabase
    .from("certificates")
    .insert({
      user_id: userId,
      course_id: courseId,
      cert_number: certNumber,
      cert_url: certUrl,
      status: "issued",
      completion_pct: completionPct,
    })
    .select()
    .single();

  const errMsg = handleError("createCertificate:insert", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as Certificate, error: null };
}

/**
 * Revoke a certificate
 */
export async function revokeCertificate(
  supabase: SupabaseClient<Database>,
  certificateId: string,
  reason: string
): Promise<QueryResult<Certificate>> {
  const { data, error } = await supabase
    .from("certificates")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoke_reason: reason,
    })
    .eq("id", certificateId)
    .select()
    .single();

  const errMsg = handleError("revokeCertificate", error);
  if (errMsg) return { data: null, error: errMsg };

  return { data: data as Certificate, error: null };
}

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Verify certificate is valid
 */
export function isCertificateValid(certificate: Certificate): boolean {
  return certificate.status === "issued" && !certificate.revoked_at;
}

/**
 * Format certificate number for display
 */
export function formatCertNumber(certNumber: string): string {
  // Format: EVK-ACCA-2024-00001
  return certNumber;
}

/**
 * Get verification URL for a certificate
 */
export function getCertificateVerificationUrl(certNumber: string): string {
  return `/verify/${encodeURIComponent(certNumber)}`;
}
