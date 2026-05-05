/**
 * Certificates Query Layer
 * ========================
 * Queries for certificates and certificate management
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.v2.types";

export interface CertificateRow {
    id: string;
    cert_number: string;
    student_name: string;
    student_email: string;
    course_title: string;
    program_body: string;
    issued_at: string;
    status: string;
    uuid?: string;
}

/**
 * Get all certificates
 */
export async function getAllCertificates(
    supabase: SupabaseClient<Database>,
    filters?: {
        course_id?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
    }
): Promise<CertificateRow[]> {
    let query = supabase
        .from("certificates")
        .select(
            `id, cert_number, issued_at, status, uuid,
       user:users(name, email),
       course:courses(
         title,
         subject:subjects(
           program_level:program_levels(
             program:programs(body)
           )
         )
       )`
        )
        .order("issued_at", { ascending: false });

    if (filters?.status) {
        query = query.eq("status", filters.status);
    }

    if (filters?.date_from) {
        query = query.gte("issued_at", filters.date_from);
    }

    if (filters?.date_to) {
        query = query.lte("issued_at", filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
        console.error("[certificates] getAllCertificates error:", error.message);
        return [];
    }

    return (data ?? []).map((cert: any) => ({
        id: cert.id,
        cert_number: cert.cert_number,
        student_name: cert.user?.name || "Unknown",
        student_email: cert.user?.email || "Unknown",
        course_title: cert.course?.title || "Unknown",
        program_body:
            cert.course?.subject?.program_level?.program?.body || "Unknown",
        issued_at: new Date(cert.issued_at).toLocaleDateString("en-IN"),
        status: cert.status,
        uuid: cert.uuid,
    }));
}

/**
 * Get certificate by ID
 */
export async function getCertificateById(
    supabase: SupabaseClient<Database>,
    certificateId: string
): Promise<CertificateRow | null> {
    const { data, error } = await supabase
        .from("certificates")
        .select(
            `id, cert_number, issued_at, status, uuid,
       user:users(name, email),
       course:courses(title)`
        )
        .eq("id", certificateId)
        .single();

    if (error) {
        console.error("[certificates] getCertificateById error:", error.message);
        return null;
    }

    if (!data) return null;

    return {
        id: data.id,
        cert_number: data.cert_number,
        student_name: data.user?.name || "Unknown",
        student_email: data.user?.email || "Unknown",
        course_title: data.course?.title || "Unknown",
        program_body: "Unknown",
        issued_at: new Date(data.issued_at).toLocaleDateString("en-IN"),
        status: data.status,
        uuid: data.uuid,
    };
}

/**
 * Issue certificate (RPC call)
 */
export async function issueCertificate(
    supabase: SupabaseClient<Database>,
    userId: string,
    courseId: string
): Promise<{ cert_number: string; id: string } | null> {
    const { data, error } = await supabase.rpc("issue_certificate", {
        p_user_id: userId,
        p_course_id: courseId,
    });

    if (error) {
        console.error("[certificates] issueCertificate error:", error.message);
        return null;
    }

    return data;
}

/**
 * Revoke certificate
 */
export async function revokeCertificate(
    supabase: SupabaseClient<Database>,
    certificateId: string
): Promise<boolean> {
    const { error } = await supabase
        .from("certificates")
        .update({ status: "revoked" })
        .eq("id", certificateId);

    if (error) {
        console.error("[certificates] revokeCertificate error:", error.message);
        return false;
    }

    return true;
}

/**
 * Get certificate download URL
 */
export async function getCertificateUrl(
    supabase: SupabaseClient<Database>,
    certificateUuid: string
): Promise<string | null> {
    // Generate a downloadable URL for certificate (could be PDF, image, etc.)
    // This is a placeholder implementation
    return `/api/certificates/${certificateUuid}`;
}

/**
 * Get certificates statistics
 */
export async function getCertificateStats(
    supabase: SupabaseClient<Database>
): Promise<{
    total_issued: number;
    total_revoked: number;
    issued_this_month: number;
}> {
    const { count: total_issued } = await supabase
        .from("certificates")
        .select("id", { count: "exact", head: true })
        .eq("status", "issued");

    const { count: total_revoked } = await supabase
        .from("certificates")
        .select("id", { count: "exact", head: true })
        .eq("status", "revoked");

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { count: issued_this_month } = await supabase
        .from("certificates")
        .select("id", { count: "exact", head: true })
        .eq("status", "issued")
        .gte("issued_at", monthStart.toISOString());

    return {
        total_issued: total_issued || 0,
        total_revoked: total_revoked || 0,
        issued_this_month: issued_this_month || 0,
    };
}
