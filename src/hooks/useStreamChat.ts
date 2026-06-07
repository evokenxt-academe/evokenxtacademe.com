'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useQueryClient } from '@tanstack/react-query';

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
    const queryClient = useQueryClient();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (!streamId) return;

        // Initial fetch (last 200 messages)
        const fetchMessages = async () => {
            try {
                const { data, error } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('live_stream_id', streamId)
                    .order('created_at', { ascending: false })
                    .limit(200);

                if (error) throw error;
                
                setMessages((data || []).reverse());
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch chat messages:', err);
                setLoading(false);
            }
        };

        fetchMessages();

        // Subscribe to new messages
        const channel = supabase
            .channel(`chat-${streamId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `live_stream_id=eq.${streamId}`,
                },
                (payload) => {
                    // Messages already have author_name and author_avatar populated
                    setMessages((prev) => [...prev, payload.new as ChatMessage].slice(-200));
                    queryClient.setQueryData(['chat', streamId], (old: any[] | undefined) =>
                        [...(old ?? []), payload.new].slice(-200)
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
                        prev.map((m) => (m.id === payload.new.id ? (payload.new as ChatMessage) : m))
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [streamId, supabase, queryClient]);

    const sendMessage = async (message: string, type: 'message' | 'announcement' | 'system' = 'message') => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) throw new Error('Not authenticated');

            // Get user profile
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
                        author_name: userProfile?.name || user.email?.split('@')[0] || 'User',
                        author_avatar: userProfile?.avatar || null,
                        is_approved: true,
                        is_pinned: false,
                        is_deleted: false,
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            // Optimistic update - data already has author_name and author_avatar
            setMessages((prev) => [...prev, data as ChatMessage].slice(-200));

            return data;
        } catch (err) {
            console.error('Failed to send message:', err);
            throw err;
        }
    };

    const pinMessage = async (messageId: string) => {
        try {
            const { error } = await supabase
                .from('chat_messages')
                .update({ is_pinned: true })
                .eq('id', messageId);

            if (error) throw error;
        } catch (err) {
            console.error('Failed to pin message:', err);
            throw err;
        }
    };

    const deleteMessage = async (messageId: string) => {
        try {
            const { error } = await supabase
                .from('chat_messages')
                .update({ is_deleted: true })
                .eq('id', messageId);

            if (error) throw error;
        } catch (err) {
            console.error('Failed to delete message:', err);
            throw err;
        }
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
