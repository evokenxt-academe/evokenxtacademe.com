"use client"

import { useQuery } from "@tanstack/react-query"

import type { LiveStreamPayload } from "@/features/live-stream/types"

async function fetchLiveStream(courseId: string): Promise<LiveStreamPayload> {
    const response = await fetch(`/api/student/live-stream?courseId=${encodeURIComponent(courseId)}`, {
        credentials: "include",
        cache: "no-store",
    })

    if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || `Request failed (${response.status})`)
    }

    return response.json() as Promise<LiveStreamPayload>
}

export function useLiveStream(courseId: string) {
    const query = useQuery({
        queryKey: ["live-stream", courseId],
        enabled: Boolean(courseId),
        queryFn: () => fetchLiveStream(courseId),
    })

    return {
        ...query,
        currentStream: query.data?.currentStream ?? null,
        initialMessages: query.data?.messages ?? [],
    }
}