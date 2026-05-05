import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { parseWithGeminiForBank } from "@/lib/parsers/geminiBankParser";
import { parseFormattedText } from "@/lib/parsers/formattedTextParser";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();
    if (!jobId) return NextResponse.json({ error: "jobId is required" }, { status: 400 });

    const supabase = await getSupabase();
    const { data: job, error } = await supabase.from("bank_import_jobs").select("*").eq("id", jobId).single();
    if (error || !job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const extractedText = job.extracted_text as string;
    if (!extractedText) return NextResponse.json({ error: "No extracted text" }, { status: 400 });

    // Get subject info and topics for the prompt
    const { data: subject } = await supabase.from("subjects").select("id, name, code, program_level:program_levels(id, label, program:programs(id, body))").eq("id", job.subject_id).single();
    const { data: topics } = await supabase.from("topics").select("id, name").eq("subject_id", job.subject_id).eq("is_active", true);

    const subjectName = (subject as any)?.name || "Unknown";
    const programBody = (subject as any)?.program_level?.program?.body || "Unknown";
    const levelLabel = (subject as any)?.program_level?.label || "Unknown";

    // Try Gemini first
    let result = await parseWithGeminiForBank(extractedText, subjectName, programBody, levelLabel, topics ?? []);

    let status = "completed";
    let errorMessage: string | null = null;

    // Fallback to regex if Gemini fails
    if (result.error || result.questions.length === 0) {
      errorMessage = result.error;
      const fallback = parseFormattedText(extractedText);
      result = { questions: fallback.questions, error: null };
      status = result.questions.length > 0 ? "partial" : "failed";
    }

    // Detect topics from parsed questions
    const detectedTopics = [...new Set(result.questions.map((q) => q.topic_name).filter(Boolean))];

    await supabase.from("bank_import_jobs").update({
      extracted_json: result.questions as any,
      status,
      error_message: errorMessage,
      total_found: result.questions.length,
      detected_topics: detectedTopics as string[],
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    return NextResponse.json({ success: true, total_found: result.questions.length });
  } catch (error: any) {
    console.error("[bank/import/parse] Error:", error.message);

    // Update job as failed
    try {
      const supabase = getSupabase();
      const { jobId } = await request.clone().json();
      if (jobId) {
        await supabase.from("bank_import_jobs").update({ status: "failed", error_message: error.message, updated_at: new Date().toISOString() }).eq("id", jobId);
      }
    } catch {}

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
