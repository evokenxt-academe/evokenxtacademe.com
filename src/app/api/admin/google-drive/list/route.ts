import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/features/admin/lib/admin-route";
import { getDriveAccessToken } from "@/lib/google-drive/token";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(["admin", "instructor"]);
    if ("error" in auth) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId") || "root";
    const search = searchParams.get("search") || "";
    const pageToken = searchParams.get("pageToken") || "";

    let accessToken: string;
    try {
      accessToken = await getDriveAccessToken();
    } catch (err: any) {
      console.warn("Google Drive token resolve error:", err.message);
      if (err.message.includes("not found") || err.message.includes("scope") || err.message.includes("missing")) {
        return NextResponse.json({ error: "reauth_required", message: err.message }, { status: 403 });
      }
      return NextResponse.json({ error: "auth_failed", message: err.message }, { status: 401 });
    }

    // Build the query q (keep Google Drive search syntax simple and robust)
    let query = "trashed = false";

    if (search) {
      const escapedSearch = search.replace(/'/g, "\\'");
      query += ` and name contains '${escapedSearch}'`;
    } else {
      query += ` and '${folderId}' in parents`;
    }

    const driveUrl = new URL("https://www.googleapis.com/drive/v3/files");
    driveUrl.searchParams.set("q", query);
    driveUrl.searchParams.set("pageSize", "50");
    driveUrl.searchParams.set("orderBy", "folder,name");
    driveUrl.searchParams.set("fields", "nextPageToken,files(id,name,mimeType,size,webViewLink,iconLink,createdTime)");
    if (pageToken) {
      driveUrl.searchParams.set("pageToken", pageToken);
    }

    const res = await fetch(driveUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      console.warn("Google Drive API response error:", data);

      const errMsg = data.error?.message || "";
      const isApiDisabled = errMsg.includes("has not been used") || 
                            errMsg.includes("disabled") || 
                            (data.error?.details && data.error.details.some((d: any) => d.reason === "SERVICE_DISABLED"));

      if (isApiDisabled) {
        return NextResponse.json({
          error: "api_disabled",
          message: errMsg || "Google Drive API is disabled in your Google Developer Project."
        }, { status: 403 });
      }

      if (res.status === 401 || (res.status === 403 && (errMsg.includes("expired") || errMsg.includes("auth") || errMsg.includes("credential")))) {
        return NextResponse.json({ error: "reauth_required", message: "Token expired or invalid" }, { status: 403 });
      }
      return NextResponse.json({ error: "drive_api_error", message: data.error?.message || "Google Drive API failed" }, { status: res.status });
    }

    // Filter files in-memory to prevent API query errors
    const allowedMimeTypes = [
      "application/vnd.google-apps.folder",
      "application/pdf",
      "application/vnd.google-apps.document",
      "application/vnd.google-apps.spreadsheet",
      "application/vnd.google-apps.presentation",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/zip",
      "application/x-zip-compressed",
    ];

    const rawFiles = data.files || [];
    const filteredFiles = rawFiles.filter((file: any) => {
      const mime = file.mimeType || "";
      return allowedMimeTypes.includes(mime) ||
             mime.startsWith("image/") ||
             mime.startsWith("video/") ||
             mime.startsWith("audio/");
    });

    return NextResponse.json({
      success: true,
      files: filteredFiles,
      nextPageToken: data.nextPageToken || null,
    });
  } catch (err: any) {
    console.error("Google Drive list route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
