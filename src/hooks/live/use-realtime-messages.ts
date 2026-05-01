"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";
import type { LiveChatMessage } from "@/features/live-stream/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Hook to subscribe to real-time chat messages for a live stream
 * using Supabase Realtime.
 *
 * Automatically subscribes when streamId is available and unsubscribes on cleanup.
 * New messages are appended to the provided messages array.
 */
export function useRealtimeMessages(
    streamId: string | null,
    onNewMessage: (message: LiveChatMessage) => void,
) {
    const [isSubscribed, setIsSubscribed] = React.useState(false);
    const channelRef = React.useRef<RealtimeChannel | null>(null);

    React.useEffect(() => {
        if (!streamId) {
            setIsSubscribed(false);
            return;
        }

        const supabase = createClient();
        const channel = supabase.channel(`live-chat:${streamId}`);

        channel
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                    filter: `live_stream_id=eq.${streamId}`,
                },
                (payload) => {
                    // Transform the raw database insert into a LiveChatMessage
                    const rawMessage = payload.new as Record<string, unknown>;

                    // The message comes without user details, so we need to fetch them
                    // or rely on the client to enrich it
                    const message: LiveChatMessage = {
                        id: String(rawMessage.id),
                        liveStreamId: String(rawMessage.live_stream_id),
                        userId: String(rawMessage.user_id),
                        userName: "Loading...",
                        userAvatar: null,
                        message: String(rawMessage.message),
                        createdAt: String(rawMessage.created_at),
                    };

                    onNewMessage(message);
                },
            )
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    setIsSubscribed(true);
                } else if (status === "CLOSED") {
                    setIsSubscribed(false);
                }
            });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            setIsSubscribed(false);
        };
    }, [streamId, onNewMessage]);

    return { isSubscribed };
}

/**
 * Simpler version: just subscribe and handle with a callback
 */
export function useRealtimeSubscription(
    streamId: string | null,
    onInsert: (payload: unknown) => void,
) {
    const [isConnected, setIsConnected] = React.useState(false);

    React.useEffect(() => {
        if (!streamId) {
            setIsConnected(false);
            return;
        }

        const supabase = createClient();
        const channel = supabase.channel(`live-chat:${streamId}`, {
            config: {
                broadcast: { self: true },
            },
        });

        channel
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                    filter: `live_stream_id=eq.${streamId}`,
                },
                (payload) => {
                    onInsert(payload);
                },
            )
            .subscribe((status) => {
                setIsConnected(status === "SUBSCRIBED");
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [streamId, onInsert]);

    return { isConnected };
}
