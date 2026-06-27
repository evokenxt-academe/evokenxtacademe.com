"use client"

import * as React from "react"

import { createClient } from "@/utils/supabase/client"
import { resolveChatMessageDisplay } from "@/features/live-stream/lib"
import type { LiveChatMessage } from "@/features/live-stream/types"

type UserProfile = {
    name: string | null
    avatar: string | null
    email?: string | null
}

function mapChatMessage(
    payload: Record<string, unknown>,
    profile: UserProfile | null,
): LiveChatMessage | null {
    const id = String(payload.id ?? "")
    const liveStreamId = String(payload.live_stream_id ?? "")
    const message = String(payload.message ?? "")
    const createdAt = String(payload.created_at ?? "")
    const userId = payload.user_id ? String(payload.user_id) : null

    if (!id || !liveStreamId || !message || !createdAt) {
        return null
    }

    const display = resolveChatMessageDisplay({
        authorName: payload.author_name as string | null | undefined,
        authorAvatar: payload.author_avatar as string | null | undefined,
        userId,
        profile,
    })

    return {
        id,
        liveStreamId,
        userId,
        userName: display.authorName,
        userAvatar: display.authorAvatar,
        message,
        createdAt,
    }
}

export function useChatMessages(
    streamId: string | null,
    initialMessages: LiveChatMessage[] = [],
) {
    const [messages, setMessages] = React.useState<LiveChatMessage[]>(initialMessages)

    const initialMessagesKey = initialMessages
        .map((message) => `${message.id}:${message.createdAt}`)
        .join("|")

    React.useEffect(() => {
        setMessages((current) => {
            if (
                current.length === initialMessages.length &&
                current.every(
                    (message, index) => message.id === initialMessages[index]?.id,
                )
            ) {
                return current
            }
            return initialMessages
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps -- initialMessages read when key changes
    }, [streamId, initialMessagesKey])

    React.useEffect(() => {
        if (!streamId) {
            return
        }

        const supabase = createClient()
        const channel = supabase
            .channel(`live-chat-${streamId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                    filter: `live_stream_id=eq.${streamId}`,
                },
                async (payload) => {
                    const nextMessage = payload.new as Record<string, unknown>
                    const userId = nextMessage.user_id
                        ? String(nextMessage.user_id)
                        : null

                    let profile: UserProfile | null = null
                    const hasAuthorName = Boolean(
                        String(nextMessage.author_name ?? "").trim(),
                    )

                    // Only look up the signed-in user's profile — RLS blocks other users.
                    if (userId && !hasAuthorName) {
                        const {
                            data: { user },
                        } = await supabase.auth.getUser()
                        if (user?.id === userId) {
                            const { data } = await supabase
                                .from("users")
                                .select("name, avatar, email")
                                .eq("id", userId)
                                .maybeSingle()
                            profile = data ?? null
                        }
                    }

                    const chatMessage = mapChatMessage(nextMessage, profile)
                    if (!chatMessage) {
                        return
                    }

                    setMessages((current) => {
                        if (current.some((message) => message.id === chatMessage.id)) {
                            return current
                        }

                        return [...current, chatMessage]
                    })
                },
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [streamId])

    return { messages, setMessages }
}
