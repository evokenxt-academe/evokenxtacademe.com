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

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
}

// FIX: ensure whatever R2 returns is a proper Node.js Buffer
function toBuffer(input: unknown): Buffer {
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof Uint8Array) return Buffer.from(input);
  if (input instanceof ArrayBuffer) return Buffer.from(input);
  // ReadableStream / Blob — caller should await .arrayBuffer() before this
  throw new Error(`Unexpected R2 response type: ${Object.prototype.toString.call(input)}`);
}

async function extractText(buffer: Buffer, fileType: string): Promise<string> {
  const type = fileType.toLowerCase().replace(".", "");

  switch (type) {
    case "pdf": {
      return extractTextFromPdf(buffer);
    }

    case "docx":
    case "doc": {
      // FIX: mammoth expects { buffer: Buffer } — pass explicitly
      const result = await mammoth.extractRawText({ buffer });
      if (result.messages?.length) {
        // Log warnings but don't fail — mammoth warnings are non-fatal
        console.warn("[extract] mammoth warnings:", result.messages.map(m => m.message));
      }
      return result.value;
    }

    case "txt": {
      return buffer.toString("utf-8");
    }

    case "csv": {
      return buffer.toString("utf-8");
    }

    case "xlsx":
    case "xls": {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const rows: string[] = [];
      for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
        for (const row of json) {
          const line = row.filter(Boolean).join("\t");
          if (line.trim()) rows.push(line);
        }
      }
      return rows.join("\n");
    }

    default: {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }
}

export async function POST(request: NextRequest) {
  let jobId: string | undefined;

  try {
    const body = await request.json();
    jobId = body?.jobId;

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const supabase = await getSupabase();

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from("bank_import_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // FIX: mark as extracting immediately so UI can show progress
    await supabase
      .from("bank_import_jobs")
      .update({ status: "extracting" })
      .eq("id", jobId);

    // Parse R2 key from URL
    const r2Url = job.r2_file_url as string;
    let key = "";
    try {
      const url = new URL(r2Url);
      key = decodeR2Key(
        url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname
      );
    } catch {
      key = decodeR2Key(r2Url);
    }

    // Fetch from R2
    console.log("[bank/import/extract] Fetching R2 key:", key);
    const raw = await getR2Object(key);

    // FIX: normalize to Buffer regardless of what R2 returns
    const buffer = toBuffer(raw);

    // Extract text
    const fileType = (job.file_type as string ?? "").toLowerCase();
    const extractedText = await extractText(buffer, fileType);

    if (!extractedText?.trim()) {
      throw new Error("Extracted text is empty — file may be scanned or corrupted");
    }

    const wordCount = extractedText.trim().split(/\s+/).length;

    // Update job with extracted text + status
    const { error: updateError } = await supabase
      .from("bank_import_jobs")
      .update({
        extracted_text: extractedText,
        status: "processing",
        word_count: wordCount,  // store for UI if column exists
      })
      .eq("id", jobId);

    if (updateError) {
      throw new Error(`Failed to update job: ${updateError.message}`);
    }

    // Trigger parse step (fire-and-forget)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    fetch(`${baseUrl}/api/bank/import/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    }).catch((err) =>
      console.error("[bank/import/extract] Failed to trigger parse:", err.message)
    );

    return NextResponse.json({ success: true, wordCount });

  } catch (error: any) {
    console.error("[bank/import/extract] Error:", error.message);

    // FIX: mark job as failed with error message so UI can surface it
    if (jobId) {
      try {
        const supabase = await getSupabase();
        await supabase
          .from("bank_import_jobs")
          .update({ status: "failed", error_message: error.message })
          .eq("id", jobId);
      } catch {
        // ignore secondary failure
      }
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}