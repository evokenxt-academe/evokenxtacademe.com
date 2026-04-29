"use client"

import * as React from "react"
import { useMutation } from "@tanstack/react-query"

import type { LiveChatMessage } from "@/features/live-stream/types"

type SendMessageInput = {
    streamId: string
    message: string
}

async function sendChatMessage(payload: SendMessageInput): Promise<LiveChatMessage> {
    const response = await fetch("/api/student/live-stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || `Request failed (${response.status})`)
    }

    const data = (await response.json()) as { chatMessage: LiveChatMessage }
    return data.chatMessage
}

export function useSendMessage() {
    const lastSentAtRef = React.useRef(0)

    const mutation = useMutation({
        mutationFn: async (payload: SendMessageInput) => {
            const now = Date.now()
            if (now - lastSentAtRef.current < 900) {
                throw new Error("You're sending messages too quickly.")
            }

            lastSentAtRef.current = now
            return sendChatMessage(payload)
        },
    })

    return {
        sendMessage: mutation.mutateAsync,
        isSending: mutation.isPending,
    }
}