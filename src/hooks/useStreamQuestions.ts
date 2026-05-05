'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useQueryClient } from '@tanstack/react-query';

interface ChatMessage {
    id: string;
    live_stream_id: string;
    user_id: string;
    message: string;
    type: 'question';
    is_answered: boolean;
    is_pinned: boolean;
    author_name?: string;
    author_avatar?: string;
    created_at: string;
}

/**
 * Hook for managing student questions during live streams
 * Filters chat messages where type = 'question'
 */
export function useStreamQuestions(streamId: string) {
    const [questions, setQuestions] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const queryClient = useQueryClient();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (!streamId) return;

        // Fetch questions
        const fetchQuestions = async () => {
            try {
                const { data, error } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('live_stream_id', streamId)
                    .eq('type', 'question')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setQuestions(data || []);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch questions:', err);
                setLoading(false);
            }
        };

        fetchQuestions();

        // Subscribe to new questions
        const channel = supabase
            .channel(`questions-${streamId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `live_stream_id=eq.${streamId} AND type=eq.question`,
                },
                (payload) => {
                    setQuestions((prev) => [payload.new as ChatMessage, ...prev]);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `live_stream_id=eq.${streamId} AND type=eq.question`,
                },
                (payload) => {
                    setQuestions((prev) =>
                        prev.map((q) => (q.id === payload.new.id ? (payload.new as ChatMessage) : q))
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [streamId, supabase, queryClient]);

    const markAnswered = async (questionId: string) => {
        try {
            const { error } = await supabase
                .from('chat_messages')
                .update({ is_answered: true })
                .eq('id', questionId);

            if (error) throw error;
        } catch (err) {
            console.error('Failed to mark question as answered:', err);
            throw err;
        }
    };

    const pinQuestion = async (questionId: string) => {
        try {
            const { error } = await supabase
                .from('chat_messages')
                .update({ is_pinned: true })
                .eq('id', questionId);

            if (error) throw error;
        } catch (err) {
            console.error('Failed to pin question:', err);
            throw err;
        }
    };

    return {
        questions,
        unansweredCount: questions.filter((q) => !q.is_answered).length,
        loading,
        markAnswered,
        pinQuestion,
    };
}
