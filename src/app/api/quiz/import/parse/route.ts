import { NextRequest, NextResponse } from "next/server";
import { parseWithGemini } from "@/lib/parsers/geminiQuizParser";
import { parseFormattedText } from "@/lib/parsers/formattedTextParser";
import { createAdminClient } from "@/utils/supabase/adminClient";

function getSupabase() {
  return createAdminClient();
}

export async function POST(request: NextRequest) {
  let jobId: string | null = null;
  try {
    const body = await request.json();
    jobId = body?.jobId ?? null;
    if (!jobId) return NextResponse.json({ error: "jobId is required" }, { status: 400 });

    const supabase = getSupabase();
    const { data: job, error } = await supabase.from("bank_import_jobs").select("*").eq("id", jobId).single();
    if (error || !job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const text = (job.extracted_text ?? "") as string;
    if (!text.trim()) {
      const message = "No extractable text found in uploaded file";
      const { error: updateError } = await supabase.from("bank_import_jobs").update({
        status: "failed",
        error_message: message,
        total_found: 0,
      }).eq("id", jobId);
      if (updateError) throw new Error(updateError.message);

      return NextResponse.json({
        success: false,
        status: "failed",
        total_found: 0,
        error: message,
      });
    }

    let result = await parseWithGemini(text);
    let status = "completed";
    let errorMessage: string | null = null;

    if (result.error || result.questions.length === 0) {
      errorMessage = result.error;
      const fallback = parseFormattedText(text);
      result = { questions: fallback.questions, error: null };
      status = result.questions.length > 0 ? "partial" : "failed";
    }

    const { error: updateError } = await supabase.from("bank_import_jobs").update({
      extracted_json: result.questions as any,
      status, error_message: errorMessage,
      total_found: result.questions.length,
    }).eq("id", jobId);
    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ success: true, total_found: result.questions.length });
  } catch (error: any) {
    console.error("[quiz/import/parse] Error:", error.message);
    if (jobId) {
      try {
        const supabase = getSupabase();
        const { error: updateError } = await supabase
          .from("bank_import_jobs")
          .update({
            status: "failed",
            error_message: error?.message || "Parse failed",
          })
          .eq("id", jobId);
        if (updateError) {
          console.error("[quiz/import/parse] Failed to update job status:", updateError.message);
        }
      } catch (updateError: any) {
        console.error("[quiz/import/parse] Failed to update job status:", updateError.message);
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
