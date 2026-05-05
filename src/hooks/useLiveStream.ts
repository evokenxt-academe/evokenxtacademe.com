'use client';

/**
 * Hook: Watch a single live stream for real-time updates
 * Subscribes to changes in live_streams table
 * Subscribes to new chat messages
 * Subscribes to analytics snapshots
 * Subscribes to poll votes
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useLiveStream(streamId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`live-stream-${streamId}`)

      // Stream status, viewer count changes
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_streams',
          filter: `id=eq.${streamId}`,
        },
        (payload) => {
          queryClient.setQueryData(['stream', streamId], payload.new);
        }
      )

      // New chat messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `live_stream_id=eq.${streamId}`,
        },
        (payload) => {
          queryClient.setQueryData(['chat', streamId], (old: any[] | undefined) =>
            [...(old ?? []), payload.new].slice(-200)
          );
        }
      )

      // Poll vote updates
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

      // Analytics snapshots
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stream_analytics',
          filter: `live_stream_id=eq.${streamId}`,
        },
        (payload) => {
          queryClient.setQueryData(['analytics', streamId], (old: any[] | undefined) =>
            [...(old ?? []), payload.new]
          );
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, queryClient]);
}

/**
 * Hook: Watch all live streams dashboard
 * Subscribes to any changes in live_streams table for dashboard updates
 */
export function useStreamsDashboard() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('streams-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_streams',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['streams'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/**
 * Hook: Watch stream chat for moderation
 */
export function useStreamChat(streamId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`stream-chat-${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `live_stream_id=eq.${streamId}`,
        },
        (payload) => {
          queryClient.setQueryData(
            ['chat', streamId],
            (old: any[] | undefined) => [...(old ?? []), payload.new]
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
          queryClient.setQueryData(
            ['chat', streamId],
            (old: any[] | undefined) =>
              old?.map(msg => (msg.id === payload.new.id ? payload.new : msg)) || []
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, queryClient]);
}

/**
 * Hook: Watch polls during stream
 */
export function useStreamPolls(streamId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`stream-polls-${streamId}`)
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
  }, [streamId, queryClient]);
}

/**
 * Hook: Get YouTube connection status
 */
export async function checkYouTubeConnection(): Promise<boolean> {
  try {
    const res = await fetch('/api/youtube/channel');
    return res.ok;
  } catch {
    return false;
  }
}
