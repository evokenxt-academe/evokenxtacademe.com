'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface ActiveViewer {
    user_id: string;
    name: string | null;
    avatar: string | null;
    last_seen: string;
}

/**
 * Hook to track active viewers in a live stream
 * Shows users who have been active in the last 5 minutes
 */
export function useActiveViewers(streamId: string) {
    const [viewers, setViewers] = useState<ActiveViewer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!streamId) return;

        let mounted = true;
        let channel: ReturnType<typeof supabase.channel> | null = null;
        const channelName = `viewers-${streamId}`;

        const fetchActiveViewers = async () => {
            try {
                const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

                const { data: messages, error } = await supabase
                    .from('chat_messages')
                    .select('user_id, author_name, author_avatar, created_at')
                    .eq('live_stream_id', streamId)
                    .gte('created_at', thirtyMinutesAgo)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (!mounted) return;

                const userMap = new Map<string, ActiveViewer>();

                messages?.forEach((msg) => {
                    if (msg.user_id && !userMap.has(msg.user_id)) {
                        userMap.set(msg.user_id, {
                            user_id: msg.user_id,
                            name: msg.author_name,
                            avatar: msg.author_avatar,
                            last_seen: msg.created_at,
                        });
                    }
                });

                setViewers(Array.from(userMap.values()));
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch active viewers:', err);
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
                    (payload: { new: Record<string, string | null> }) => {
                        const msg = payload.new;
                        if (msg.user_id) {
                            setViewers((prev) => {
                                const exists = prev.find((v) => v.user_id === msg.user_id);
                                if (exists) {
                                    return prev.map((v) =>
                                        v.user_id === msg.user_id
                                            ? { ...v, last_seen: msg.created_at as string }
                                            : v
                                    );
                                }
                                return [
                                    ...prev,
                                    {
                                        user_id: msg.user_id as string,
                                        name: msg.author_name ?? null,
                                        avatar: msg.author_avatar ?? null,
                                        last_seen: msg.created_at as string,
                                    },
                                ];
                            });
                        }
                    }
                )
                .subscribe();
        };

        setLoading(true);
        fetchActiveViewers();
        const interval = setInterval(fetchActiveViewers, 30000);
        setup();

        return () => {
            mounted = false;
            clearInterval(interval);
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [streamId]);

    return {
        viewers,
        loading,
        count: viewers.length,
    };
}
