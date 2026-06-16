'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PollOption } from '@/types/live-stream';

interface Poll {
    id: string;
    live_stream_id: string;
    question: string;
    options: PollOption[];
    is_active: boolean;
    is_anonymous: boolean;
    created_at: string;
    closed_at?: string;
}

export function useStreamPolls(streamId: string) {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [activePoll, setActivePoll] = useState<Poll | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const formatPoll = (poll: Record<string, unknown>, votes: Array<{ option_id: number }>): Poll => {
        const options = (poll.options as PollOption[]) ?? [];
        const voteCounts = votes.reduce<Record<number, number>>((acc, v) => {
            acc[v.option_id] = (acc[v.option_id] ?? 0) + 1;
            return acc;
        }, {});

        return {
            id: poll.id as string,
            live_stream_id: poll.live_stream_id as string,
            question: poll.question as string,
            options: options.map((o) => ({
                ...o,
                votes: voteCounts[o.id] ?? o.votes ?? 0,
            })),
            is_active: poll.is_active as boolean,
            is_anonymous: poll.is_anonymous as boolean,
            created_at: poll.created_at as string,
            closed_at: poll.closed_at as string | undefined,
        };
    };

    const fetchPolls = async () => {
        try {
            const { data: pollRows, error } = await supabase
                .from('stream_polls')
                .select('*')
                .eq('live_stream_id', streamId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formatted: Poll[] = [];
            for (const poll of pollRows ?? []) {
                const { data: votes } = await supabase
                    .from('stream_poll_votes')
                    .select('option_id')
                    .eq('poll_id', poll.id);
                formatted.push(formatPoll(poll, votes ?? []));
            }

            setPolls(formatted);
            setActivePoll(formatted.find((p) => p.is_active) ?? null);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch polls:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!streamId) return;

        fetchPolls();

        const channel = supabase
            .channel(`polls-${streamId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'stream_polls',
                    filter: `live_stream_id=eq.${streamId}`,
                },
                () => fetchPolls(),
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'stream_poll_votes',
                },
                () => fetchPolls(),
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [streamId]);

    const createPoll = async (
        question: string,
        optionTexts: string[],
        isAnonymous = false,
    ) => {
        const options: PollOption[] = optionTexts.map((text, i) => ({
            id: i + 1,
            text,
            votes: 0,
        }));

        await supabase
            .from('stream_polls')
            .update({ is_active: false, closed_at: new Date().toISOString() })
            .eq('live_stream_id', streamId)
            .eq('is_active', true);

        const { data: poll, error } = await supabase
            .from('stream_polls')
            .insert({
                live_stream_id: streamId,
                question,
                options,
                is_anonymous: isAnonymous,
                is_active: true,
            })
            .select()
            .single();

        if (error) throw error;
        await fetchPolls();
        return poll;
    };

    const votePoll = async (pollId: string, optionId: number) => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase.from('stream_poll_votes').upsert(
            { poll_id: pollId, option_id: optionId, user_id: user.id },
            { onConflict: 'poll_id,user_id' },
        );

        if (error) throw error;
        await fetchPolls();
    };

    const closePoll = async (pollId: string) => {
        const { error } = await supabase
            .from('stream_polls')
            .update({ is_active: false, closed_at: new Date().toISOString() })
            .eq('id', pollId);

        if (error) throw error;
        setActivePoll(null);
        await fetchPolls();
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
