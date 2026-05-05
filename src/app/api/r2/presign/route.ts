import { NextRequest, NextResponse } from "next/server";
import { generatePresignedUrl } from "@/lib/r2/upload";

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, folder } = await request.json();
    if (!fileName || !folder) {
      return NextResponse.json({ error: "fileName and folder are required" }, { status: 400 });
    }

    const result = await generatePresignedUrl(fileName, fileType || "application/octet-stream", folder);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[r2/presign] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
