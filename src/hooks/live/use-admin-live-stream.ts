"use client"

import { useQuery } from "@tanstack/react-query"
import type { LiveStreamPayload } from "@/features/live-stream/types"

async function fetchAdminLiveStream(streamId: string): Promise<LiveStreamPayload> {
    const response = await fetch(`/api/admin/live-streams/${streamId}`, {
        credentials: "include",
        cache: "no-store",
    })

    if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || `Request failed (${response.status})`)
    }

    return response.json() as Promise<LiveStreamPayload>
}

export function useAdminLiveStream(streamId: string) {
    const query = useQuery({
        queryKey: ["admin-live-stream", streamId],
        enabled: Boolean(streamId),
        queryFn: () => fetchAdminLiveStream(streamId),
    })

    return {
        ...query,
        currentStream: query.data?.currentStream ?? null,
        initialMessages: query.data?.messages ?? [],
    }
}
