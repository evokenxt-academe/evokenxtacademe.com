/**
 * Import Job Queries
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BankImportJob } from "@/types/quiz";

export async function getImportJob(supabase: SupabaseClient, jobId: string): Promise<BankImportJob | null> {
  const { data, error } = await supabase.from("bank_import_jobs").select("*").eq("id", jobId).single();
  if (error) { console.error("[imports] getJob:", error.message); return null; }
  return data as BankImportJob;
}

export async function createImportJob(supabase: SupabaseClient, jobData: Partial<BankImportJob>): Promise<{ id: string }> {
  const { data, error } = await supabase.from("bank_import_jobs").insert([{ ...jobData, status: "pending" }]).select("id").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateImportJob(supabase: SupabaseClient, id: string, updates: Partial<BankImportJob>) {
  const { error } = await supabase.from("bank_import_jobs").update({ ...updates }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getImportJobs(supabase: SupabaseClient, limit = 20): Promise<BankImportJob[]> {
  const { data, error } = await supabase.from("bank_import_jobs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) { console.error("[imports] getJobs:", error.message); return []; }
  return data ?? [];
}
