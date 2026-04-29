import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";
import { buildR2ObjectKey, uploadBufferToR2 } from "@/lib/cloudflare/r2";

/**
 * POST /api/admin/courses/upload-thumbnail
 *
 * Upload a course thumbnail to Cloudflare R2.
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
    const title = (formData.get("title") as string) || "course-thumbnail";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WebP, and GIF are supported for thumbnails" },
        { status: 400 }
      );
    }

    const maxImageSize = 10 * 1024 * 1024;
    if (file.size > maxImageSize) {
      return NextResponse.json({ error: "Image file too large. Max 10MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const key = buildR2ObjectKey({
      folder: "course-thumbnails",
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
      thumbnailUrl: upload.publicUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Thumbnail upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
