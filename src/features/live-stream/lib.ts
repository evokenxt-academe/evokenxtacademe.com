import type { SupabaseClient } from "@supabase/supabase-js"

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/

/** Extract an 11-char YouTube video ID from a bare ID or any common YouTube / Studio URL. */
export function extractYoutubeVideoId(input: string | null | undefined) {
    const value = (input ?? "").trim()

    if (!value) {
        return ""
    }

    if (YOUTUBE_ID_PATTERN.test(value)) {
        return value
    }

    try {
        const url = new URL(value)
        const host = url.hostname.replace(/^www\./, "")

        if (host === "youtu.be") {
            const id = url.pathname.replace(/^\//, "").slice(0, 11)
            return YOUTUBE_ID_PATTERN.test(id) ? id : ""
        }

        if (host === "studio.youtube.com") {
            const studioMatch = url.pathname.match(/\/video\/([a-zA-Z0-9_-]{11})/)
            if (studioMatch?.[1]) {
                return studioMatch[1]
            }
        }

        if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
            const embedMatch = url.pathname.match(/\/(embed|shorts|live|v)\/([a-zA-Z0-9_-]{11})/)
            if (embedMatch?.[2]) {
                return embedMatch[2]
            }

            const searchId = url.searchParams.get("v")
            if (searchId && YOUTUBE_ID_PATTERN.test(searchId)) {
                return searchId
            }
        }
    } catch {
        // fall through to regex fallback
    }

    const fallbackMatch = value.match(/(?:^|[/?=&])([a-zA-Z0-9_-]{11})(?:[/?&#]|$)/)
    return fallbackMatch?.[1] && YOUTUBE_ID_PATTERN.test(fallbackMatch[1])
        ? fallbackMatch[1]
        : ""
}

/** YouTube Studio edit page for a stream/video (accepts bare ID or any supported URL). */
export function buildYoutubeStudioEditUrl(input: string | null | undefined) {
    const videoId = extractYoutubeVideoId(input)
    return videoId ? `https://studio.youtube.com/video/${videoId}/edit` : null
}

/** YouTube Studio live control page for a stream/video. */
export function buildYoutubeStudioLiveUrl(input: string | null | undefined) {
    const videoId = extractYoutubeVideoId(input)
    return videoId ? `https://studio.youtube.com/video/${videoId}/livestreaming` : null
}

export function buildYoutubeEmbedUrl(videoId: string) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&controls=1&iv_load_policy=3&disablekb=0`
}

export function formatLiveDateTime(value: string | null) {
    if (!value) {
        return "—"
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return "—"
    }

    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date)
}

export function formatLiveTime(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return "—"
    }

    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    })
}

export function getInitials(name: string) {
    return (
        name
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "U"
    )
}

export function resolveChatAuthorName(options: {
    authorName?: string | null
    profileName?: string | null
    userEmail?: string | null
}) {
    const fromAuthor = options.authorName?.trim()
    if (fromAuthor) return fromAuthor

    const fromProfile = options.profileName?.trim()
    if (fromProfile) return fromProfile

    const emailPrefix = options.userEmail?.split("@")[0]?.trim()
    if (emailPrefix) return emailPrefix

    return "Anonymous"
}

type ChatAuthorProfile = {
    name: string | null
    avatar: string | null
    email?: string | null
}

export function resolveChatMessageDisplay(options: {
    authorName?: string | null
    authorAvatar?: string | null
    userId?: string | null
    profile?: ChatAuthorProfile | null
}) {
    const authorName = resolveChatAuthorName({
        authorName: options.authorName,
        profileName: options.profile?.name,
        userEmail: options.profile?.email,
    })

    return {
        authorName,
        authorAvatar:
            options.authorAvatar?.trim() ||
            options.profile?.avatar ||
            null,
    }
}

export async function fetchChatAuthorProfiles(
    supabase: SupabaseClient,
    userIds: string[],
) {
    const uniqueIds = [...new Set(userIds.filter(Boolean))]
    if (uniqueIds.length === 0) {
        return new Map<string, ChatAuthorProfile>()
    }

    const { data } = await supabase
        .from("users")
        .select("id, name, avatar, email")
        .in("id", uniqueIds)

    return new Map(
        (data ?? []).map((user) => [
            user.id,
            {
                name: user.name,
                avatar: user.avatar,
                email: user.email ?? null,
            },
        ]),
    )
}