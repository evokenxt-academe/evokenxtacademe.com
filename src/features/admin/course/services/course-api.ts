/**
 * Client-side service for course API calls.
 * Handles video uploads with progress tracking and speed calculations.
 */

import type { CourseFormData } from "../types/course"
import { createClient } from "@/utils/supabase/client"

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface UploadProgress {
    percent: number
    loaded: number
    total: number
    speed: number        // bytes per second
    speedLabel: string   // human-readable speed
    eta: number          // estimated seconds remaining
}

export interface YouTubeUploadResult {
    success: boolean
    videoId: string
    videoUrl: string
    durationSec: number
    error?: string
}

export interface ResourceUploadResult {
    success: boolean
    fileUrl: string
    fileType: "image" | "pdf"
    fileName: string
    fileSize: number
    error?: string
}

export interface ThumbnailUploadResult {
    success: boolean
    thumbnailUrl: string
    fileName: string
    fileSize: number
    error?: string
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
}

async function readResponsePayload(response: Response): Promise<{ json: any | null; rawText: string }> {
    const rawText = await response.text()

    if (!rawText) {
        return { json: null, rawText }
    }

    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
        return { json: null, rawText }
    }

    try {
        return { json: JSON.parse(rawText), rawText }
    } catch {
        return { json: null, rawText }
    }
}

function buildUploadError(response: Response, rawText: string, fallbackMessage: string): Error {
    const snippet = rawText.trim().slice(0, 200)
    const suffix = snippet ? `: ${snippet}` : ""
    return new Error(`${fallbackMessage} (${response.status} ${response.statusText})${suffix}`)
}

// ─────────────────────────────────────────────────────────────
// Upload video to YouTube with progress tracking
// ─────────────────────────────────────────────────────────────

export async function uploadVideoToYouTube(
    file: File,
    title: string,
    description: string,
    onProgress: (progress: UploadProgress) => void
): Promise<YouTubeUploadResult> {
    try {
        const supabase = createClient()
        const { data: sessionData } = await supabase.auth.getSession()
        const providerToken = sessionData.session?.provider_token || ""

        // Step 1: Init Resumable Session
        const initRes = await fetch("/api/youtube/upload/init", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                description,
                fileSize: file.size,
                mimeType: file.type || "video/*",
                accessToken: providerToken,
            }),
        })

        const { json: initData, rawText: initRawText } = await readResponsePayload(initRes)
        if (!initRes.ok) {
            throw buildUploadError(
                initRes,
                initRawText,
                initData?.error || "Failed to init upload"
            )
        }

        if (!initData) {
            throw buildUploadError(initRes, initRawText, "Invalid upload init response")
        }

        const { uploadUrl, accessToken } = initData

        // Step 2: Chunk Loop
        const chunkSize = 5 * 1024 * 1024 // 5MB chunks (Vercel max payload is 4.5MB but streaming handles larger via ArrayBuffer, keep it at 3MB to be safe for serverless)
        const safeChunkSize = 3 * 1024 * 1024 // 3MB to prevent Vercel 413 limits
        let start = 0
        const total = file.size
        const startTime = Date.now()

        while (start < total) {
            const end = Math.min(start + safeChunkSize, total)
            const chunk = file.slice(start, end)

            const chunkRes = await fetch("/api/youtube/upload/chunk", {
                method: "POST",
                headers: {
                    "x-upload-url": uploadUrl,
                    "x-access-token": accessToken,
                    "x-content-type": file.type || "video/*",
                    "content-range": `bytes ${start}-${end - 1}/${total}`,
                },
                body: await chunk.arrayBuffer(),
            })

            const { json: chunkData, rawText: chunkRawText } = await readResponsePayload(chunkRes)
            if (!chunkRes.ok) {
                throw buildUploadError(
                    chunkRes,
                    chunkRawText,
                    chunkData?.error || "Upload chunk failed"
                )
            }

            if (!chunkData) {
                throw buildUploadError(chunkRes, chunkRawText, "Invalid upload chunk response")
            }

            // Calculate progress metrics
            const percent = Math.round((end / total) * 100)
            const elapsedSec = (Date.now() - startTime) / 1000
            const speed = elapsedSec > 0 ? end / elapsedSec : 0
            const remaining = total - end
            const eta = speed > 0 ? remaining / speed : 0

            onProgress({
                percent,
                loaded: end,
                total,
                speed,
                speedLabel: formatSpeed(speed),
                eta: Math.ceil(eta),
            })

            if (chunkData.status === "complete") {
                return {
                    success: true,
                    videoId: chunkData.videoId,
                    videoUrl: chunkData.videoUrl,
                    durationSec: chunkData.durationSec,
                }
            }

            start = end
        }

        throw new Error("Upload loop finished without completion signal.")
    } catch (err: any) {
        return {
            success: false,
            videoId: "",
            videoUrl: "",
            durationSec: 0,
            error: err.message || "Network error",
        }
    }
}

// ─────────────────────────────────────────────────────────────
// Upload resource file with progress tracking
// ─────────────────────────────────────────────────────────────

export function uploadResourceFile(
    file: File,
    title: string,
    onProgress: (progress: UploadProgress) => void
): Promise<ResourceUploadResult> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        const formData = new FormData()
        formData.append("file", file)
        formData.append("title", title)

        const startTime = Date.now()

        xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100)
                const elapsedMs = Date.now() - startTime
                const elapsedSec = elapsedMs / 1000
                const speed = elapsedSec > 0 ? e.loaded / elapsedSec : 0
                const remaining = e.total - e.loaded
                const eta = speed > 0 ? remaining / speed : 0

                onProgress({
                    percent,
                    loaded: e.loaded,
                    total: e.total,
                    speed,
                    speedLabel: formatSpeed(speed),
                    eta: Math.ceil(eta),
                })
            }
        })

        xhr.addEventListener("load", () => {
            try {
                const result = JSON.parse(xhr.responseText)
                if (xhr.status >= 200 && xhr.status < 300 && result.success) {
                    resolve(result as ResourceUploadResult)
                } else {
                    resolve({
                        success: false,
                        fileUrl: "",
                        fileType: "pdf",
                        fileName: file.name,
                        fileSize: file.size,
                        error: result.error || "Upload failed",
                    })
                }
            } catch {
                resolve({
                    success: false,
                    fileUrl: "",
                    fileType: "pdf",
                    fileName: file.name,
                    fileSize: file.size,
                    error: "Invalid server response",
                })
            }
        })

        xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"))
        })

        xhr.open("POST", "/api/admin/courses/upload-resource")
        xhr.send(formData)
    })
}

export function uploadThumbnailFile(
    file: File,
    title: string,
    onProgress: (progress: UploadProgress) => void
): Promise<ThumbnailUploadResult> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        const formData = new FormData()
        formData.append("file", file)
        formData.append("title", title)

        const startTime = Date.now()

        xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100)
                const elapsedMs = Date.now() - startTime
                const elapsedSec = elapsedMs / 1000
                const speed = elapsedSec > 0 ? e.loaded / elapsedSec : 0
                const remaining = e.total - e.loaded
                const eta = speed > 0 ? remaining / speed : 0

                onProgress({
                    percent,
                    loaded: e.loaded,
                    total: e.total,
                    speed,
                    speedLabel: formatSpeed(speed),
                    eta: Math.ceil(eta),
                })
            }
        })

        xhr.addEventListener("load", () => {
            try {
                const result = JSON.parse(xhr.responseText)
                if (xhr.status >= 200 && xhr.status < 300 && result.success) {
                    resolve(result as ThumbnailUploadResult)
                } else {
                    resolve({
                        success: false,
                        thumbnailUrl: "",
                        fileName: file.name,
                        fileSize: file.size,
                        error: result.error || "Thumbnail upload failed",
                    })
                }
            } catch {
                resolve({
                    success: false,
                    thumbnailUrl: "",
                    fileName: file.name,
                    fileSize: file.size,
                    error: "Invalid server response",
                })
            }
        })

        xhr.addEventListener("error", () => {
            reject(new Error("Network error during thumbnail upload"))
        })

        xhr.open("POST", "/api/admin/courses/upload-thumbnail")
        xhr.send(formData)
    })
}

// ─────────────────────────────────────────────────────────────
// Fetch YouTube video duration from a URL
// ─────────────────────────────────────────────────────────────

export interface YouTubeDurationResult {
    success: boolean
    videoId: string
    videoUrl: string
    durationSec: number
    title: string
    thumbnailUrl: string
    error?: string
}

export async function fetchYouTubeVideoDuration(
    videoUrl: string
): Promise<YouTubeDurationResult> {
    try {
        const response = await fetch("/api/youtube/duration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videoUrl }),
        })

        const data = await response.json()

        if (!response.ok) {
            return {
                success: false,
                videoId: "",
                videoUrl: "",
                durationSec: 0,
                title: "",
                thumbnailUrl: "",
                error: data.error || "Failed to fetch video duration",
            }
        }

        return {
            success: true,
            videoId: data.videoId,
            videoUrl: data.videoUrl,
            durationSec: data.durationSec,
            title: data.title || "",
            thumbnailUrl: data.thumbnailUrl || "",
        }
    } catch (err: any) {
        return {
            success: false,
            videoId: "",
            videoUrl: "",
            durationSec: 0,
            title: "",
            thumbnailUrl: "",
            error: err.message || "Network error",
        }
    }
}

// ─────────────────────────────────────────────────────────────
// Compute total course duration from all lectures
// ─────────────────────────────────────────────────────────────

export function computeCourseTotalDuration(formData: CourseFormData): number {
    return formData.sections.reduce(
        (courseTotal, section) =>
            courseTotal +
            section.lectures.reduce(
                (sectionTotal, lecture) => sectionTotal + lecture.durationSec,
                0
            ),
        0
    )
}

// ─────────────────────────────────────────────────────────────
// Submit full course to Supabase
// ─────────────────────────────────────────────────────────────

export async function submitCourse(
    formData: CourseFormData,
    courseId?: string
): Promise<{
    success: boolean
    courseId?: string
    error?: string
}> {
    try {
        // Auto-calculate total duration across all lectures
        const totalDurationSec = computeCourseTotalDuration(formData)

        const endpoint = courseId ? `/api/admin/courses/${courseId}` : "/api/admin/courses"
        const response = await fetch(endpoint, {
            method: courseId ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                level: formData.level,
                thumbnailUrl: formData.thumbnailUrl,
                instructorId: formData.instructorId,
                price: formData.price,
                discountPrice: formData.discountPrice,
                status: formData.status,
                totalDurationSec,
                sections: formData.sections.map((s) => ({
                    id: s.id,
                    title: s.title,
                    position: s.position,
                    lectures: s.lectures.map((l) => ({
                        id: l.id,
                        title: l.title,
                        videoUrl: l.videoUrl,
                        description: l.description,
                        durationSec: l.durationSec,
                        position: l.position,
                        isPreview: l.isPreview,
                        resources: l.resources.map((r) => ({
                            id: r.id,
                            title: r.title,
                            fileUrl: r.fileUrl,
                        })),
                    })),
                })),
            }),
        })

        const result = await response.json()

        if (!response.ok) {
            return { success: false, error: result.error || "Failed to save course" }
        }

        return { success: true, courseId: result.courseId ?? courseId }
    } catch (err) {
        return { success: false, error: "Network error" }
    }
}
