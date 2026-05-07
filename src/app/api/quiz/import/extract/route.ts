import { NextRequest, NextResponse } from "next/server";
import { getR2Object } from "@/lib/r2/upload";
import mammoth from "mammoth";
import { extractTextFromPdf } from "@/lib/pdf/extract";
import { createAdminClient } from "@/utils/supabase/adminClient";

function decodeR2Key(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  return extractTextFromPdf(buffer);
}

function getSupabase() {
  // Service role client (bypasses RLS) so the job state updates reliably.
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

    const r2Url = job.r2_file_url as string;
    let key = "";
    try {
      const url = new URL(r2Url);
      const pathKey = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
      key = decodeR2Key(pathKey);
    } catch (e) {
      // Fallback for non-URL keys
      key = decodeR2Key(r2Url);
    }
    
    console.log("[quiz/import/extract] Fetching from R2:", key);
    const buffer = await getR2Object(key);

    let extractedText = "";
    const fileType = (job.file_type as string).toLowerCase();

    if (fileType === "pdf") {
      extractedText = await extractPdfText(buffer);
    } else if (fileType === "docx" || fileType === "doc") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      extractedText = buffer.toString("utf-8");
    }

    if (!extractedText.trim()) {
      const { error: emptyUpdateError } = await supabase.from("bank_import_jobs").update({
        extracted_text: extractedText,
        status: "failed",
        error_message: "No extractable text found in uploaded file",
        total_found: 0,
      }).eq("id", jobId);
      if (emptyUpdateError) throw new Error(emptyUpdateError.message);
      return NextResponse.json({ error: "No extractable text found in uploaded file" }, { status: 400 });
    }

    const { error: updateError } = await supabase.from("bank_import_jobs").update({
      extracted_text: extractedText,
      status: "processing",
    }).eq("id", jobId);
    if (updateError) throw new Error(updateError.message);

    // Trigger parse
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const parseRes = await fetch(`${baseUrl}/api/quiz/import/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    if (!parseRes.ok) {
      const parseBody = await parseRes.json().catch(() => ({}));
      throw new Error(parseBody?.error || `Parse request failed (${parseRes.status})`);
    }

    return NextResponse.json({ success: true, wordCount: extractedText.split(/\s+/).length });
  } catch (error: any) {
    console.error("[quiz/import/extract] Error:", error.message);
    if (jobId) {
      try {
        const supabase = getSupabase();
        const { error: updateError } = await supabase
          .from("bank_import_jobs")
          .update({
            status: "failed",
            error_message: error?.message || "Extraction failed",
          })
          .eq("id", jobId);
        if (updateError) {
          console.error("[quiz/import/extract] Failed to update job status:", updateError.message);
        }
      } catch (updateError: any) {
        console.error("[quiz/import/extract] Failed to update job status:", updateError.message);
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
