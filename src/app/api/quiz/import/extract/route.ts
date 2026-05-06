import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getR2Object } from "@/lib/r2/upload";
import mammoth from "mammoth";
import { extractTextFromPdf } from "@/lib/pdf/extract";

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
  let jobId: string | null = null;
  try {
    const body = await request.json();
    jobId = body?.jobId ?? null;
    if (!jobId) return NextResponse.json({ error: "jobId is required" }, { status: 400 });

    const supabase = await getSupabase();
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

    await supabase.from("bank_import_jobs").update({
      extracted_text: extractedText, status: "processing", updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    // Trigger parse
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    fetch(`${baseUrl}/api/quiz/import/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    }).catch(console.error);

    return NextResponse.json({ success: true, wordCount: extractedText.split(/\s+/).length });
  } catch (error: any) {
    console.error("[quiz/import/extract] Error:", error.message);
    if (jobId) {
      try {
        const supabase = await getSupabase();
        await supabase
          .from("bank_import_jobs")
          .update({
            status: "failed",
            error_message: error?.message || "Extraction failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", jobId);
      } catch (updateError: any) {
        console.error("[quiz/import/extract] Failed to update job status:", updateError.message);
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
