import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getR2Object } from "@/lib/r2/upload";
const pdfParse = require("pdf-parse");
import mammoth from "mammoth";

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

    // Extract the R2 key from the URL
    const r2Url = job.r2_file_url as string;
    const publicUrlBase = process.env.R2_PUBLIC_URL || "";
    const key = r2Url.replace(publicUrlBase + "/", "");

    // Fetch file from R2
    const buffer = await getR2Object(key);

    // Extract text based on file type
    let extractedText = "";
    const fileType = (job.file_type as string).toLowerCase();

    if (fileType === "pdf") {
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else if (fileType === "docx" || fileType === "doc") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileType === "txt") {
      extractedText = buffer.toString("utf-8");
    } else if (fileType === "csv") {
      extractedText = buffer.toString("utf-8");
    } else if (fileType === "xlsx") {
      // Dynamic import to avoid build issues
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const rows: string[] = [];
      workbook.SheetNames.forEach((name) => {
        const sheet = workbook.Sheets[name];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        json.forEach((row) => rows.push(row.join("\t")));
      });
      extractedText = rows.join("\n");
    }

    // Update job with extracted text
    await supabase.from("bank_import_jobs").update({
      extracted_text: extractedText,
      status: "processing",
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    // Trigger parsing
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    fetch(`${baseUrl}/api/bank/import/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    }).catch(console.error);

    return NextResponse.json({ success: true, wordCount: extractedText.split(/\s+/).length });
  } catch (error: any) {
    console.error("[bank/import/extract] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
