import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * POST /api/admin/courses/upload-resource
 * 
 * Uploads a resource file (image or PDF) to Supabase Storage.
 * Returns the public URL of the uploaded file.
 * 
 * Constraints:
 * - Only images (jpg, png, webp, gif) and PDFs allowed
 * - Max PDF size: 50MB
 * - Max image size: 10MB
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Verify auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File | null
        const title = (formData.get("title") as string) || "Untitled"

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Validate file type
        const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
        const allowedPdfTypes = ["application/pdf"]
        const isImage = allowedImageTypes.includes(file.type)
        const isPdf = allowedPdfTypes.includes(file.type)

        if (!isImage && !isPdf) {
            return NextResponse.json(
                { error: "Only images (JPG, PNG, WebP, GIF) and PDF files are allowed" },
                { status: 400 }
            )
        }

        // Validate file size
        const maxImageSize = 10 * 1024 * 1024  // 10MB
        const maxPdfSize = 50 * 1024 * 1024    // 50MB

        if (isImage && file.size > maxImageSize) {
            return NextResponse.json(
                { error: "Image file too large. Max 10MB" },
                { status: 400 }
            )
        }

        if (isPdf && file.size > maxPdfSize) {
            return NextResponse.json(
                { error: "PDF file too large. Max 50MB" },
                { status: 400 }
            )
        }

        // Generate unique file path
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin"
        const timestamp = Date.now()
        const sanitizedTitle = title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 50)
        const filePath = `course-resources/${user.id}/${timestamp}-${sanitizedTitle}.${ext}`

        // Upload to Supabase Storage
        const fileBuffer = await file.arrayBuffer()
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("resources")
            .upload(filePath, fileBuffer, {
                contentType: file.type,
                upsert: false,
            })

        if (uploadError) {
            console.error("Storage upload error:", uploadError)
            return NextResponse.json(
                { error: "Failed to upload file" },
                { status: 500 }
            )
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("resources")
            .getPublicUrl(uploadData.path)

        return NextResponse.json({
            success: true,
            fileUrl: urlData.publicUrl,
            fileType: isImage ? "image" : "pdf",
            fileName: file.name,
            fileSize: file.size,
        })
    } catch (err) {
        console.error("Resource upload error:", err)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
