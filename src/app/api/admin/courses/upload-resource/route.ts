import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";
import { buildR2ObjectKey, uploadBufferToR2 } from "@/lib/cloudflare/r2";

/**
 * POST /api/admin/courses/upload-resource
 * 
 * Uploads a resource file (image or PDF) to Cloudflare R2.
 * Returns the public URL of the uploaded file.
 * 
 * Constraints:
 * - Only images (jpg, png, webp, gif) and PDFs allowed
 * - Max PDF size: 50MB
 * - Max image size: 10MB
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(["admin", "instructor"]);
    if ("error" in auth) {
      return auth.error;
    }

    const { userId } = auth;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = String(formData.get("folder") || "course-resources");
    const title = (formData.get("title") as string) || "Untitled";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const allowedPdfTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const isImage = allowedImageTypes.includes(file.type);
    const isPdf = allowedPdfTypes.includes(file.type);

    if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: "Only images (JPG, PNG, WebP, GIF) and PDF files are allowed" },
        { status: 400 }
      );
    }

    const maxImageSize = 10 * 1024 * 1024;
    const maxPdfSize = 50 * 1024 * 1024;

    if (isImage && file.size > maxImageSize) {
      return NextResponse.json({ error: "Image file too large. Max 10MB" }, { status: 400 });
    }
    if (isPdf && file.size > maxPdfSize) {
      return NextResponse.json({ error: "PDF file too large. Max 50MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const key = buildR2ObjectKey({
      folder,
      userId,
      title,
      ext,
    });

    const upload = await uploadBufferToR2({
      key,
      body: await file.arrayBuffer(),
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({
      success: true,
      fileUrl: upload.publicUrl,
      fileType: isImage ? "image" : "pdf",
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (err) {
    console.error("Resource upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
