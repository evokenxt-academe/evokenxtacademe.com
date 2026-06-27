"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { createClient } from "@/utils/supabase/client"
import type { LiveStreamPayload, LiveChatMessage } from "@/features/live-stream/types"

async function fetchLiveStream(courseId: string): Promise<LiveStreamPayload> {
    const response = await fetch(
        `/api/student/live-stream?courseId=${encodeURIComponent(courseId)}`,
        {
            credentials: "include",
            cache: "no-store",
        },
    )

    if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
            error?: string
        } | null
        throw new Error(payload?.error || `Request failed (${response.status})`)
    }

    return response.json() as Promise<LiveStreamPayload>
}

const EMPTY_MESSAGES: LiveChatMessage[] = []

export function useLiveStream(courseId: string) {
    const queryClient = useQueryClient()
    const previousStatusRef = React.useRef<string | null>(null)

    const query = useQuery({
        queryKey: ["live-stream", courseId],
        enabled: Boolean(courseId),
        queryFn: () => fetchLiveStream(courseId),
        refetchInterval: (currentQuery) => {
            const status = currentQuery.state.data?.currentStream?.status
            if (!status || status === "scheduled") {
                return 4_000
            }
            if (status === "live") {
                return 30_000
            }
            return false
        },
        staleTime: 3_000,
    })

    const currentStream = query.data?.currentStream ?? null

    React.useEffect(() => {
        if (!courseId) return

        const supabase = createClient()
        const channel = supabase
            .channel(`course-live-${courseId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "live_streams",
                    filter: `course_id=eq.${courseId}`,
                },
                () => {
                    void queryClient.invalidateQueries({
                        queryKey: ["live-stream", courseId],
                    })
                },
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [courseId, queryClient])

    const wentLive =
        previousStatusRef.current !== "live" &&
        currentStream?.status === "live"

    React.useEffect(() => {
        previousStatusRef.current = currentStream?.status ?? null
    }, [currentStream?.status])

    return {
        ...query,
        currentStream,
        initialMessages: query.data?.messages ?? EMPTY_MESSAGES,
        wentLive,
    }
}
