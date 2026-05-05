'use client';

/**
 * Hook: Manage YouTube OAuth connection state
 */

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface YouTubeChannelInfo {
  channelName: string;
  subscribers: string;
  thumbnail: string;
}

export function useYouTubeAuth() {
  const queryClient = useQueryClient();
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  const { data: channelInfo, isLoading: isLoadingChannel } = useQuery({
    queryKey: ['youtube-channel'],
    queryFn: async () => {
      const res = await fetch('/api/youtube/channel');
      if (!res.ok) throw new Error('Not connected');
      return res.json() as Promise<YouTubeChannelInfo>;
    },
    retry: false,
    enabled: isCheckingConnection,
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/youtube/oauth/disconnect', {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-channel'] });
      queryClient.invalidateQueries({ queryKey: ['youtube-tokens'] });
    },
  });

  const isConnected = !!channelInfo;

  return {
    isConnected,
    channelInfo,
    isLoadingChannel,
    isCheckingConnection,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
  };
}
