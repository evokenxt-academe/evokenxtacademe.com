'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface ChatMessage {
    id: string;
    live_stream_id: string;
    user_id: string;
    message: string;
    type: 'message' | 'announcement' | 'system' | 'question';
    is_pinned: boolean;
    is_approved: boolean;
    is_deleted: boolean;
    author_name?: string;
    author_avatar?: string;
    yt_message_id?: string;
    created_at: string;
}

/**
 * Hook for real-time chat messages
 * Keeps messages list up-to-date and limited to last 200
 */
export function useStreamChat(streamId: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!streamId) return;

        let mounted = true;
        let channel: ReturnType<typeof supabase.channel> | null = null;
        const channelName = `chat-${streamId}`;

        const fetchMessages = async () => {
            try {
                const { data, error } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('live_stream_id', streamId)
                    .eq('is_deleted', false)
                    .order('created_at', { ascending: false })
                    .limit(200);

                if (error) throw error;
                if (!mounted) return;

                setMessages((data || []).reverse());
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch chat messages:', err);
                if (mounted) setLoading(false);
            }
        };

        const setup = async () => {
            const existingChannels = supabase
                .getChannels()
                .filter(
                    (c) =>
                        c.topic === `realtime:${channelName}` ||
                        c.topic === channelName
                );
            for (const c of existingChannels) {
                await supabase.removeChannel(c);
            }

            if (!mounted) return;

            channel = supabase
                .channel(channelName)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'chat_messages',
                        filter: `live_stream_id=eq.${streamId}`,
                    },
                    (payload) => {
                        setMessages((prev) =>
                            [...prev, payload.new as ChatMessage].slice(-200)
                        );
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'chat_messages',
                        filter: `live_stream_id=eq.${streamId}`,
                    },
                    (payload) => {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === payload.new.id
                                    ? (payload.new as ChatMessage)
                                    : m
                            )
                        );
                    }
                )
                .subscribe();
        };

        setLoading(true);
        fetchMessages();
        setup();

        return () => {
            mounted = false;
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [streamId]);

    const sendMessage = async (
        message: string,
        type: 'message' | 'announcement' | 'system' = 'message'
    ) => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error('Not authenticated');

        const { data: userProfile } = await supabase
            .from('users')
            .select('name, avatar')
            .eq('id', user.id)
            .single();

        const { data, error } = await supabase
            .from('chat_messages')
            .insert([
                {
                    live_stream_id: streamId,
                    user_id: user.id,
                    message,
                    type,
                    author_name:
                        userProfile?.name ||
                        user.email?.split('@')[0] ||
                        'User',
                    author_avatar: userProfile?.avatar || null,
                    is_approved: true,
                    is_pinned: false,
                    is_deleted: false,
                },
            ])
            .select()
            .single();

        if (error) throw error;

        setMessages((prev) => [...prev, data as ChatMessage].slice(-200));
        return data;
    };

    const pinMessage = async (messageId: string) => {
        const { error } = await supabase
            .from('chat_messages')
            .update({ is_pinned: true })
            .eq('id', messageId);

        if (error) throw error;
    };

    const deleteMessage = async (messageId: string) => {
        const { error } = await supabase
            .from('chat_messages')
            .update({ is_deleted: true })
            .eq('id', messageId);

        if (error) throw error;
    };

    return {
        messages: messages.filter((m) => !m.is_deleted),
        pinnedMessages: messages.filter((m) => m.is_pinned && !m.is_deleted),
        loading,
        sendMessage,
        pinMessage,
        deleteMessage,
    };
}
