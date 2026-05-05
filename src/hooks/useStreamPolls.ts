'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useQueryClient } from '@tanstack/react-query';

interface PollOption {
    id: string;
    poll_id: string;
    option_text: string;
    votes: number;
}

interface Poll {
    id: string;
    live_stream_id: string;
    question: string;
    is_active: boolean;
    is_anonymous: boolean;
    created_at: string;
    ended_at?: string;
    options: PollOption[];
}

/**
 * Hook for real-time poll updates and voting
 */
export function useStreamPolls(streamId: string) {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [activePoll, setActivePoll] = useState<Poll | null>(null);
    const [loading, setLoading] = useState(true);
    const queryClient = useQueryClient();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (!streamId) return;

        // Fetch polls
        const fetchPolls = async () => {
            try {
                const { data, error } = await supabase
                    .from('stream_polls')
                    .select(`
            *,
            options:stream_poll_options(
              id,
              poll_id,
              option_text,
              votes:stream_poll_votes(count)
            )
          `)
                    .eq('live_stream_id', streamId)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const formattedPolls = (data || []).map((p: any) => ({
                    ...p,
                    options: p.options.map((o: any) => ({
                        ...o,
                        votes: o.votes?.[0]?.count || 0,
                    })),
                }));

                setPolls(formattedPolls);
                setActivePoll(formattedPolls.find((p) => p.is_active) || null);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch polls:', err);
                setLoading(false);
            }
        };

        fetchPolls();

        // Subscribe to poll changes
        const channel = supabase
            .channel(`polls-${streamId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'stream_polls',
                    filter: `live_stream_id=eq.${streamId}`,
                },
                (payload) => {
                    setActivePoll(payload.new as Poll);
                    queryClient.invalidateQueries({ queryKey: ['polls', streamId] });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'stream_polls',
                    filter: `live_stream_id=eq.${streamId}`,
                },
                (payload) => {
                    if ((payload.new as any).is_active) {
                        setActivePoll(payload.new as Poll);
                    }
                    queryClient.invalidateQueries({ queryKey: ['polls', streamId] });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'stream_poll_votes',
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['polls', streamId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [streamId, supabase, queryClient]);

    const createPoll = async (
        question: string,
        options: string[],
        isAnonymous: boolean = false
    ) => {
        try {
            // Create poll
            const { data: poll, error: pollError } = await supabase
                .from('stream_polls')
                .insert([
                    {
                        live_stream_id: streamId,
                        question,
                        is_anonymous: isAnonymous,
                        is_active: true,
                    },
                ])
                .select()
                .single();

            if (pollError) throw pollError;

            // Create options
            const { error: optionsError } = await supabase
                .from('stream_poll_options')
                .insert(options.map((text) => ({ poll_id: poll.id, option_text: text })));

            if (optionsError) throw optionsError;

            setActivePoll(poll as Poll);
            return poll;
        } catch (err) {
            console.error('Failed to create poll:', err);
            throw err;
        }
    };

    const votePoll = async (pollId: string, optionId: string) => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase.from('stream_poll_votes').insert([
                {
                    poll_id: pollId,
                    option_id: optionId,
                    user_id: user.id,
                },
            ]);

            if (error) throw error;
        } catch (err) {
            console.error('Failed to vote on poll:', err);
            throw err;
        }
    };

    const closePoll = async (pollId: string) => {
        try {
            const { error } = await supabase
                .from('stream_polls')
                .update({ is_active: false, ended_at: new Date().toISOString() })
                .eq('id', pollId);

            if (error) throw error;

            setActivePoll(null);
        } catch (err) {
            console.error('Failed to close poll:', err);
            throw err;
        }
    };

    return {
        polls,
        activePoll,
        loading,
        createPoll,
        votePoll,
        closePoll,
    };
}
