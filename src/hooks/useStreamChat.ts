'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    fetchChatAuthorProfiles,
    resolveChatMessageDisplay,
} from '@/features/live-stream/lib';
import type { ChatMsgType } from '@/types/live-stream';

const supabase = createClient();

interface ChatMessage {
    id: string;
    live_stream_id: string;
    user_id: string | null;
    message: string;
    type: ChatMsgType;
    is_pinned: boolean;
    is_approved: boolean;
    is_deleted: boolean;
    author_name?: string;
    author_avatar?: string;
    yt_message_id?: string;
    created_at: string;
}

async function enrichChatMessages(messages: ChatMessage[]): Promise<ChatMessage[]> {
    const missingUserIds = [
        ...new Set(
            messages
                .filter((message) => !message.author_name?.trim() && message.user_id)
                .map((message) => message.user_id as string),
        ),
    ];

    if (missingUserIds.length === 0) {
        return messages;
    }

    const profiles = await fetchChatAuthorProfiles(supabase, missingUserIds);

    return messages.map((message) => {
        if (message.author_name?.trim()) {
            return message;
        }

        const profile = message.user_id ? profiles.get(message.user_id) : null;
        if (!profile) {
            return message;
        }

        const display = resolveChatMessageDisplay({
            authorName: message.author_name,
            authorAvatar: message.author_avatar,
            userId: message.user_id,
            profile,
        });

        return {
            ...message,
            author_name: display.authorName,
            author_avatar: display.authorAvatar ?? message.author_avatar,
        };
    });
}

export function useStreamChat(streamId: string, chatModeration = false) {
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
                    .order('created_at', { ascending: true })
                    .limit(500);

                if (error) throw error;
                if (!mounted) return;

                setMessages(await enrichChatMessages(data || []));
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch chat messages:', err);
                if (mounted) setLoading(false);
            }
        };

        const setup = async () => {
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
                        void enrichChatMessages([payload.new as ChatMessage]).then(
                            ([enriched]) => {
                                setMessages((prev) => {
                                    const exists = prev.some(
                                        (m) => m.id === enriched.id,
                                    );
                                    if (exists) return prev;
                                    return [...prev, enriched];
                                });
                            },
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
        type: ChatMsgType = 'message',
        isAdmin = false,
    ) => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error('Not authenticated');

        const { data: userProfile } = await supabase
            .from('users')
            .select('name, avatar, email')
            .eq('id', user.id)
            .single();

        const authorName = resolveChatMessageDisplay({
            authorName: null,
            authorAvatar: userProfile?.avatar,
            userId: user.id,
            profile: userProfile
                ? {
                      name: userProfile.name,
                      avatar: userProfile.avatar,
                      email: userProfile.email ?? user.email,
                  }
                : null,
        }).authorName;

        const optimisticId = `optimistic-${Date.now()}`;
        const optimistic: ChatMessage = {
            id: optimisticId,
            live_stream_id: streamId,
            user_id: user.id,
            message,
            type,
            author_name: authorName,
            author_avatar: userProfile?.avatar || undefined,
            is_approved: isAdmin || !chatModeration,
            is_pinned: false,
            is_deleted: false,
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimistic]);

        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                live_stream_id: streamId,
                user_id: user.id,
                message,
                type,
                author_name: optimistic.author_name,
                author_avatar: userProfile?.avatar || null,
                is_approved: isAdmin || !chatModeration,
                is_pinned: false,
                is_deleted: false,
            })
            .select()
            .single();

        if (error) {
            setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
            throw error;
        }

        setMessages((prev) =>
            prev.map((m) => (m.id === optimisticId ? (data as ChatMessage) : m)),
        );
        return data;
    };

    const pinMessage = async (messageId: string) => {
        const msg = messages.find((m) => m.id === messageId);
        const { error } = await supabase
            .from('chat_messages')
            .update({ is_pinned: !msg?.is_pinned })
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

    const approveMessage = async (messageId: string) => {
        const { error } = await supabase
            .from('chat_messages')
            .update({ is_approved: true })
            .eq('id', messageId);

        if (error) throw error;
    };

    const markAsQuestion = async (messageId: string) => {
        const { error } = await supabase
            .from('chat_messages')
            .update({ type: 'question' })
            .eq('id', messageId);

        if (error) throw error;
    };

    const visibleMessages = messages.filter((m) => !m.is_deleted);

    return {
        messages: visibleMessages,
        pendingMessages: visibleMessages.filter((m) => !m.is_approved),
        approvedMessages: visibleMessages.filter((m) => m.is_approved),
        pinnedMessages: visibleMessages.filter((m) => m.is_pinned && m.is_approved),
        loading,
        sendMessage,
        pinMessage,
        deleteMessage,
        approveMessage,
        markAsQuestion,
    };
}
