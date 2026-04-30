import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/features/admin/lib/admin-route";
import {
    buildR2ObjectKey,
    createPresignedUploadUrl,
    getR2PublicUrl,
    type R2Folder,
} from "@/lib/cloudflare/r2";
import { createClient } from "@/utils/supabase/server";

const folderRules: Record<
    R2Folder,
    {
        allowedMimeTypes: string[];
        adminOnly: boolean;
    }
> = {
    "course-thumbnails": {
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        adminOnly: true,
    },
    "course-resources": {
        allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        adminOnly: true,
    },
    "question-bank-images": {
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        adminOnly: true,
    },
    avatars: {
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        adminOnly: false,
    },
    certificates: {
        allowedMimeTypes: ["application/pdf"],
        adminOnly: true,
    },
};

function isR2Folder(value: string): value is R2Folder {
    return value in folderRules;
}

function getFileExtension(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() || "bin";
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as {
            filename?: string;
            fileType?: string;
            folder?: string;
        };

        const filename = body.filename?.trim();
        const fileType = body.fileType?.trim();
        const folder = body.folder?.trim();

        if (!filename || !fileType || !folder) {
            return NextResponse.json(
                { error: "filename, fileType, and folder are required" },
                { status: 400 }
            );
        }

        if (!isR2Folder(folder)) {
            return NextResponse.json({ error: "Invalid upload folder" }, { status: 400 });
        }

        const rules = folderRules[folder];
        if (!rules.allowedMimeTypes.includes(fileType)) {
            return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
        }

        let userId: string;

        if (rules.adminOnly) {
            const auth = await requireAdmin(["admin", "instructor"]);
            if ("error" in auth) {
                return auth.error;
            }

            userId = auth.userId;
        } else {
            const supabase = await createClient();
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }

            userId = user.id;
        }

        const key = buildR2ObjectKey({
            folder,
            userId,
            title: filename,
            ext: getFileExtension(filename),
        });

        const presignedUrl = await createPresignedUploadUrl({
            key,
            expiresInSeconds: 3600,
        });

        return NextResponse.json({
            success: true,
            presignedUrl,
            publicUrl: getR2PublicUrl(key),
            filePath: key,
        });
    } catch (error) {
        console.error("Presigned upload URL error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}