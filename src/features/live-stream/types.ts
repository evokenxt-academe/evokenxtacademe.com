export type LiveStreamStatus = "scheduled" | "live" | "ended"

export type LiveStreamCourseOption = {
    id: string
    name: string
    slug: string | null
}

export type LiveStreamSummary = {
    id: string
    title: string
    courseId: string
    courseName: string
    ytVideoId: string | null
    status: LiveStreamStatus
    startedAt: string | null
    endedAt: string | null
}

export type LiveChatMessage = {
    id: string
    liveStreamId: string
    userId: string | null
    userName: string
    userAvatar: string | null
    message: string
    createdAt: string
}

export type LiveStreamPayload = {
    currentStream: LiveStreamSummary | null
    messages: LiveChatMessage[]
}

export type LiveStreamAdminItem = LiveStreamSummary & {
    courseSlug: string | null
}