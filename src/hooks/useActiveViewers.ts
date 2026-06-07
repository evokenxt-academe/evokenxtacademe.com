'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

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

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (!streamId) return;

        const fetchActiveViewers = async () => {
            try {
                // Get unique users who sent messages in the last 30 minutes
                const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
                
                const { data: messages, error } = await supabase
                    .from('chat_messages')
                    .select('user_id, author_name, author_avatar, created_at')
                    .eq('live_stream_id', streamId)
                    .gte('created_at', thirtyMinutesAgo)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Get unique users with their latest activity
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
                setLoading(false);
            }
        };

        fetchActiveViewers();

        // Refresh every 30 seconds
        const interval = setInterval(fetchActiveViewers, 30000);

        // Subscribe to new messages to update viewer list in real-time
        const channel = supabase
            .channel(`viewers-${streamId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `live_stream_id=eq.${streamId}`,
                },
                (payload: any) => {
                    const msg = payload.new;
                    if (msg.user_id) {
                        setViewers((prev) => {
                            const exists = prev.find((v) => v.user_id === msg.user_id);
                            if (exists) {
                                // Update last_seen
                                return prev.map((v) =>
                                    v.user_id === msg.user_id
                                        ? { ...v, last_seen: msg.created_at }
                                        : v
                                );
                            } else {
                                // Add new viewer
                                return [
                                    ...prev,
                                    {
                                        user_id: msg.user_id,
                                        name: msg.author_name,
                                        avatar: msg.author_avatar,
                                        last_seen: msg.created_at,
                                    },
                                ];
                            }
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [streamId, supabase]);

    return {
        viewers,
        loading,
        count: viewers.length,
    };
}
