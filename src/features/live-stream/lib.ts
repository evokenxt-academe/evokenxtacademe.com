const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/

export function extractYoutubeVideoId(input: string) {
    const value = input.trim()

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
            return url.pathname.replace("/", "").slice(0, 11)
        }

        if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
            const embedMatch = url.pathname.match(/\/(embed|shorts|live)\/([a-zA-Z0-9_-]{11})/)
            if (embedMatch?.[2]) {
                return embedMatch[2]
            }

            const searchId = url.searchParams.get("v")
            if (searchId && YOUTUBE_ID_PATTERN.test(searchId)) {
                return searchId
            }
        }
    } catch {
        return ""
    }

    const fallbackMatch = value.match(/([a-zA-Z0-9_-]{11})/)
    return fallbackMatch?.[1] ?? ""
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