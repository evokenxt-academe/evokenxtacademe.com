import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { parseWithGemini } from "@/lib/parsers/geminiQuizParser";
import { parseFormattedText } from "@/lib/parsers/formattedTextParser";

async function getSupabase() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing");
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();
    const supabase = await getSupabase();
    const { data: job } = await supabase.from("bank_import_jobs").select("*").eq("id", jobId).single();
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const text = (job.extracted_text ?? "") as string;
    if (!text.trim()) {
      const message = "No extractable text found in uploaded file";
      await supabase.from("bank_import_jobs").update({
        status: "failed",
        error_message: message,
        total_found: 0,
        updated_at: new Date().toISOString(),
      }).eq("id", jobId);

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

    await supabase.from("bank_import_jobs").update({
      extracted_json: result.questions as any,
      status, error_message: errorMessage,
      total_found: result.questions.length,
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    return NextResponse.json({ success: true, total_found: result.questions.length });
  } catch (error: any) {
    console.error("[quiz/import/parse] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
