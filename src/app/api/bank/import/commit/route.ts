import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { jobId, selectedIndices } = await request.json();
    if (!jobId) return NextResponse.json({ error: "jobId is required" }, { status: 400 });

    const supabase = await getSupabase();
    const { data: job, error } = await supabase.from("bank_import_jobs").select("*").eq("id", jobId).single();
    if (error || !job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const questions = (job.extracted_json as any[]) ?? [];
    const selected = selectedIndices ? questions.filter((_: any, i: number) => selectedIndices.includes(i)) : questions;

    // Get topics for name → id resolution
    const { data: topics } = await supabase.from("topics").select("id, name").eq("subject_id", job.subject_id).eq("is_active", true);
    const topicMap = new Map((topics ?? []).map((t: any) => [t.name.toLowerCase(), t.id]));

    let imported = 0;
    let duplicates = 0;
    let failed = 0;

    for (const q of selected) {
      try {
        // Resolve topic
        const topicId = q.topic_name ? topicMap.get(q.topic_name.toLowerCase()) ?? job.topic_id : job.topic_id;

        // Insert bank question
        const { data: newBQ, error: qErr } = await supabase.from("bank_questions").insert([{
          subject_id: job.subject_id,
          topic_id: topicId ?? null,
          sub_topic_id: job.sub_topic_id ?? null,
          type: q.type || "mcq",
          question_text: q.question_text,
          difficulty: q.difficulty || "medium",
          marks: q.marks || 1,
          negative_marks: q.negative_marks || 0,
          source_ref: q.source_ref ?? null,
          year: q.year ?? null,
          tags: q.tags ?? [],
          assertion_text: q.assertion_text ?? null,
          reason_text: q.reason_text ?? null,
          numerical_answer: q.numerical_answer ?? null,
          numerical_tolerance: q.numerical_tolerance ?? 0,
          blank_answer: q.blank_answer ?? null,
          model_answer: q.model_answer ?? null,
          explanation: q.explanation ?? null,
          is_verified: false,
          is_active: true,
          usage_count: 0,
        }]).select("id").single();

        if (qErr) { failed++; continue; }

        // Insert options
        if (q.options && q.options.length > 0) {
          await supabase.from("bank_question_options").insert(
            q.options.map((opt: any, i: number) => ({
              question_id: newBQ.id,
              option_text: opt.text || opt.option_text,
              is_correct: opt.is_correct ?? false,
              position: i,
              explanation: opt.explanation ?? null,
            }))
          );
        }

        // Map to import job
        await supabase.from("bank_import_question_map").insert([{
          import_job_id: jobId,
          bank_question_id: newBQ.id,
          source_position: q.position ?? 0,
          is_duplicate: q._isDuplicate ?? false,
          duplicate_of: q._duplicateOf ?? null,
        }]);

        if (q._isDuplicate) duplicates++;
        imported++;

        // Update progress
        await supabase.from("bank_import_jobs").update({
          total_imported: imported,
        }).eq("id", jobId);
      } catch (e) {
        failed++;
      }
    }

    // Final update
    await supabase.from("bank_import_jobs").update({
      status: "completed",
      total_imported: imported,
      total_failed: failed,
      total_duplicates: duplicates,
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);

    return NextResponse.json({ imported, duplicates, failed });
  } catch (error: any) {
    console.error("[bank/import/commit] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
