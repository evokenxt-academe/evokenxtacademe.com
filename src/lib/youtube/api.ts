/**
 * YouTube API v3 client helpers for live streaming operations
 */

import { getAccessToken } from './getAccessToken';

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';

interface LiveBroadcast {
  id: string;
  snippet: {
    title: string;
    description?: string;
    scheduledStartTime: string;
    liveChatId?: string;
    actualStartTime?: string;
    actualEndTime?: string;
  };
  status: {
    lifeCycleStatus: string;
    privacyStatus: string;
    recordingStatus?: string;
  };
  contentDetails: {
    enableDvr: boolean;
    enableEmbed: boolean;
    boundStreamId?: string;
  };
}

interface LiveStream {
  id: string;
  snippet: {
    title: string;
  };
  cdn: {
    ingestionType: string;
    ingestionInfo: {
      ingestionAddress: string;
      streamName: string;
    };
    resolution: string;
    frameRate: string;
  };
}

/**
 * Create a YouTube Live Broadcast + Stream pair
 */
export async function createLiveBroadcast(
  title: string,
  description: string,
  scheduledStartTime: string,
  options: {
    privacy?: 'public' | 'unlisted' | 'private';
    enableDvr?: boolean;
    enableChat?: boolean;
    resolution?: string;
  } = {}
): Promise<{ broadcastId: string; streamId: string; rtmpUrl: string; streamKey: string }> {
  const accessToken = await getAccessToken();

  // Step 1: Create broadcast
  const broadcastRes = await fetch(`${YOUTUBE_API}/liveBroadcasts?part=snippet,status,contentDetails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      snippet: {
        title,
        description,
        scheduledStartTime,
      },
      status: {
        privacyStatus: options.privacy || 'unlisted',
      },
      contentDetails: {
        enableDvr: options.enableDvr !== false,
        enableEmbed: true,
        enableAutoStart: true,
        enableAutoStop: true,
        recordFromStart: true,
        enableMonitorStream: false, // Bypass testing status for direct go-live
      },
    }),
  });

  if (!broadcastRes.ok) {
    const error = await broadcastRes.json();
    throw new Error(`Failed to create broadcast: ${error.error?.message}`);
  }

  const broadcast: LiveBroadcast = await broadcastRes.json();

  // Step 2: Create stream
  const streamRes = await fetch(`${YOUTUBE_API}/liveStreams?part=snippet,cdn`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      snippet: {
        title: `Stream for ${title}`,
      },
      cdn: {
        ingestionType: 'rtmp',
        resolution: options.resolution || '1080p',
        frameRate: '30fps',
      },
    }),
  });

  if (!streamRes.ok) {
    const error = await streamRes.json();
    throw new Error(`Failed to create stream: ${error.error?.message}`);
  }

  const stream: LiveStream = await streamRes.json();

  // Step 3: Bind broadcast to stream
  const bindRes = await fetch(
    `${YOUTUBE_API}/liveBroadcasts/bind?id=${broadcast.id}&streamId=${stream.id}&part=contentDetails`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!bindRes.ok) {
    const error = await bindRes.json();
    throw new Error(`Failed to bind broadcast to stream: ${error.error?.message}`);
  }

  return {
    broadcastId: broadcast.id,
    streamId: stream.id,
    rtmpUrl: stream.cdn.ingestionInfo.ingestionAddress,
    streamKey: stream.cdn.ingestionInfo.streamName,
  };
}

/**
 * Transition a broadcast to "live" status
 */
export async function transitionToLive(broadcastId: string): Promise<void> {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `${YOUTUBE_API}/liveBroadcasts/transition?broadcastStatus=live&id=${broadcastId}&part=status`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`YouTube Error: ${error.error?.message || 'Failed to transition to live status. Make sure your encoder (OBS) is already streaming.'}`);
  }
}

/**
 * End a broadcast (transition to complete)
 */
export async function endBroadcast(broadcastId: string): Promise<void> {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `${YOUTUBE_API}/liveBroadcasts/transition?broadcastStatus=complete&id=${broadcastId}&part=status`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Failed to end broadcast: ${error.error?.message}`);
  }
}

/**
 * Get YouTube channel info (name, subscriber count, avatar)
 */
export async function getChannelInfo(): Promise<{
  channelName: string;
  subscribers: string;
  thumbnail: string;
}> {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `${YOUTUBE_API}/channels?part=snippet,statistics&mine=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch channel info');
  }

  const data: any = await res.json();
  const channel = data.items?.[0];

  return {
    channelName: channel?.snippet?.title || '',
    subscribers: channel?.statistics?.subscriberCount || '0',
    thumbnail: channel?.snippet?.thumbnails?.default?.url || '',
  };
}

/**
 * Fetch live chat messages from YouTube
 */
export async function fetchLiveChatMessages(
  liveChatId: string,
  pageToken?: string
): Promise<{
  messages: Array<{
    id: string;
    author: string;
    authorChannel: string;
    text: string;
    thumbnail: string;
  }>;
  nextPageToken: string;
}> {
  const accessToken = await getAccessToken();

  const params = new URLSearchParams({
    liveChatId,
    part: 'snippet,authorDetails',
    maxResults: '200',
  });

  if (pageToken) {
    params.append('pageToken', pageToken);
  }

  const res = await fetch(`${YOUTUBE_API}/liveChat/messages?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch chat messages');
  }

  const data: any = await res.json();

  return {
    messages: data.items?.map((item: any) => ({
      id: item.id,
      author: item.authorDetails?.displayName || 'Anonymous',
      authorChannel: item.authorDetails?.channelId || '',
      text: item.snippet?.displayMessage || '',
      thumbnail: item.authorDetails?.profileImageUrl || '',
    })) || [],
    nextPageToken: data.nextPageToken || '',
  };
}

/**
 * Get live stream statistics from video
 */
export async function getVideoStatistics(
  videoId: string
): Promise<{
  concurrentViewers: number;
  totalViewers: number;
}> {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `${YOUTUBE_API}/videos?id=${videoId}&part=liveStreamingDetails,statistics`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch video statistics');
  }

  const data: any = await res.json();
  const video = data.items?.[0];

  return {
    concurrentViewers: parseInt(video?.liveStreamingDetails?.concurrentViewers || '0'),
    totalViewers: parseInt(video?.statistics?.viewCount || '0'),
  };
}

/**
 * List broadcasts for the authenticated channel
 * @param status 'active' | 'all' | 'completed' | 'upcoming'
 */
export async function listLiveBroadcasts(status: 'active' | 'all' | 'completed' | 'upcoming' = 'active'): Promise<any[]> {
  const accessToken = await getAccessToken();

  // YouTube API does not support broadcastStatus=all with mine=true
  // So we fetch each status separately and merge
  if (status === 'all') {
    const statuses: Array<'active' | 'completed' | 'upcoming'> = ['active', 'upcoming', 'completed'];
    const allBroadcasts: any[] = [];
    const seen = new Set<string>();
    
    for (const s of statuses) {
      try {
        const url = `${YOUTUBE_API}/liveBroadcasts?part=snippet,status,contentDetails&mine=true&broadcastStatus=${s}&maxResults=50`;
        console.log(`[YouTube API] Fetching broadcasts with status: ${s}`);
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          console.log(`[YouTube API] Found ${data.items?.length || 0} broadcasts with status ${s}`);
          if (data.items) {
            for (const item of data.items) {
              if (!seen.has(item.id)) {
                seen.add(item.id);
                console.log(`[YouTube API] Adding broadcast: ${item.snippet?.title} (${item.status?.lifeCycleStatus})`);
                allBroadcasts.push(item);
              }
            }
          }
        } else {
          const errBody = await res.json().catch(() => ({}));
          console.error(`Failed to fetch ${s} broadcasts:`, errBody?.error?.message || res.statusText);
        }
      } catch (err) {
        console.error(`Error fetching ${s} broadcasts:`, err);
      }
    }
    
    // ADDITIONAL FIX: Also fetch without broadcastStatus filter to catch manually created broadcasts
    try {
      console.log(`[YouTube API] Fetching all broadcasts without status filter (for manually created streams)`);
      const url = `${YOUTUBE_API}/liveBroadcasts?part=snippet,status,contentDetails&mine=true&maxResults=50`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[YouTube API] Found ${data.items?.length || 0} broadcasts without status filter`);
        if (data.items) {
          for (const item of data.items) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              console.log(`[YouTube API] Adding broadcast (no filter): ${item.snippet?.title} (${item.status?.lifeCycleStatus})`);
              allBroadcasts.push(item);
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error fetching broadcasts without filter:`, err);
    }
    
    console.log(`[YouTube API] Total unique broadcasts found: ${allBroadcasts.length}`);
    return allBroadcasts;
  }

  const url = `${YOUTUBE_API}/liveBroadcasts?part=snippet,status,contentDetails&mine=true&broadcastStatus=${status}&maxResults=50`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Failed to list broadcasts: ${error.error?.message}`);
  }

  const data = await res.json();
  return data.items || [];
}
