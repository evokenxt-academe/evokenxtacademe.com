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
    enableAutoStart?: boolean;
    enableAutoStop?: boolean;
    recordFromStart?: boolean;
    monitorStream?: {
      enableMonitorStream: boolean;
      broadcastStreamDelayMs: number;
    };
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
    enableEmbed?: boolean;
  } = {}
): Promise<{
  broadcastId: string;
  streamId: string;
  rtmpUrl: string;
  streamKey: string;
  videoId?: string;
  liveChatId?: string;
  embedDisabled?: boolean;
}> {
  const accessToken = await getAccessToken();
  let embedDisabled = false;

  // Step 1: Create broadcast
  let broadcastRes = await fetch(`${YOUTUBE_API}/liveBroadcasts?part=snippet,status,contentDetails`, {
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
        selfDeclaredMadeForKids: false,
      },
      contentDetails: {
        enableDvr: options.enableDvr !== false,
        // Omit enableEmbed when enabled — YouTube defaults to true.
        // Explicit enableEmbed: true triggers invalidEmbedSetting on some channels.
        ...(options.enableEmbed === false ? { enableEmbed: false } : {}),
        enableAutoStart: true,
        enableAutoStop: true,
        recordFromStart: true,
        enableMonitorStream: false, // Bypass testing status for direct go-live
      },
    }),
  });

  if (!broadcastRes.ok) {
    const error = await broadcastRes.json();
    const reason = error.error?.errors?.[0]?.reason || '';
    const msg = error.error?.message || 'Failed to create broadcast';
    const err = new Error(`Failed to create broadcast: ${msg}`);
    (err as any).reason = reason;
    (err as any).statusCode = broadcastRes.status;
    throw err;
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
    const reason = error.error?.errors?.[0]?.reason || '';
    const msg = error.error?.message || 'Failed to create stream';
    const err = new Error(`Failed to create stream: ${msg}`);
    (err as any).reason = reason;
    (err as any).statusCode = streamRes.status;
    throw err;
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
    const reason = error.error?.errors?.[0]?.reason || '';
    const msg = error.error?.message || 'Failed to bind broadcast to stream';
    const err = new Error(`Failed to bind broadcast to stream: ${msg}`);
    (err as any).reason = reason;
    (err as any).statusCode = bindRes.status;
    throw err;
  }

  const detailsRes = await fetch(
    `${YOUTUBE_API}/liveBroadcasts?id=${broadcast.id}&part=snippet,status`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  let videoId: string | undefined;
  let liveChatId: string | undefined;

  if (detailsRes.ok) {
    const details = await detailsRes.json();
    const item = details.items?.[0];
    videoId = item?.id;
    liveChatId = item?.snippet?.liveChatId;
  }

  if (options.enableEmbed !== false) {
    const embedResult = await enableBroadcastEmbedding(broadcast.id, {
      maxAttempts: 4,
      delayMs: 1_500,
    });
    if (embedResult.embedDisabled) {
      embedDisabled = true;
    }
  }

  return {
    broadcastId: broadcast.id,
    streamId: stream.id,
    rtmpUrl: stream.cdn.ingestionInfo.ingestionAddress,
    streamKey: stream.cdn.ingestionInfo.streamName,
    videoId,
    liveChatId,
    embedDisabled,
  };
}

const LIVE_BROADCAST_STATUSES = new Set([
  'live',
  'liveStarting',
  'testing',
  'testStarting',
]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a single live broadcast's current lifecycle status.
 */
export async function getBroadcast(broadcastId: string): Promise<LiveBroadcast> {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `${YOUTUBE_API}/liveBroadcasts?id=${broadcastId}&part=snippet,status,contentDetails`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Failed to fetch broadcast: ${error.error?.message}`);
  }

  const data = await res.json();
  const broadcast = data.items?.[0];
  if (!broadcast) {
    throw new Error('YouTube broadcast not found');
  }

  return broadcast;
}

const NON_UPDATABLE_EMBED_STATUSES = new Set([
  'testing',
  'testStarting',
  'live',
  'liveStarting',
]);

type VideoStatus = {
  embeddable?: boolean;
  privacyStatus?: string;
  selfDeclaredMadeForKids?: boolean;
  license?: string;
  publicStatsViewable?: boolean;
};

type EmbedAttemptResult = {
  enabled: boolean;
  embedDisabled?: boolean;
  retryable?: boolean;
};

/**
 * Enable "Allow embedding" on a live broadcast via the YouTube API.
 * Uses videos.update (same as YouTube Studio checkbox) as the primary method.
 */
export async function enableBroadcastEmbedding(
  broadcastId: string,
  options: { maxAttempts?: number; delayMs?: number } = {},
): Promise<{ enabled: boolean; embedDisabled?: boolean }> {
  const maxAttempts = options.maxAttempts ?? 6;
  const delayMs = options.delayMs ?? 2_000;
  let lastResult: EmbedAttemptResult = { enabled: false, retryable: true };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    lastResult = await attemptEnableBroadcastEmbedding(broadcastId);
    if (lastResult.enabled || lastResult.embedDisabled) {
      return lastResult;
    }

    if (!lastResult.retryable || attempt === maxAttempts - 1) {
      break;
    }

    await sleep(delayMs);
  }

  if (lastResult.embedDisabled) {
    return { enabled: false, embedDisabled: true };
  }

  return { enabled: false };
}

async function attemptEnableBroadcastEmbedding(
  broadcastId: string,
): Promise<EmbedAttemptResult> {
  const videoResult = await enableVideoEmbedding(broadcastId);
  if (videoResult.enabled) {
    return { enabled: true };
  }
  if (videoResult.embedDisabled) {
    return videoResult;
  }

  const broadcast = await getBroadcast(broadcastId);

  if (
    broadcast.contentDetails.enableEmbed &&
    isVideoEmbeddable(await getVideoStatus(broadcastId))
  ) {
    return { enabled: true };
  }

  if (NON_UPDATABLE_EMBED_STATUSES.has(broadcast.status.lifeCycleStatus)) {
    return videoResult;
  }

  const accessToken = await getAccessToken();
  const monitor = broadcast.contentDetails.monitorStream;

  const res = await fetch(`${YOUTUBE_API}/liveBroadcasts?part=snippet,contentDetails`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: broadcastId,
      snippet: {
        title: broadcast.snippet.title,
        description: broadcast.snippet.description ?? '',
        scheduledStartTime: broadcast.snippet.scheduledStartTime,
      },
      contentDetails: {
        enableEmbed: true,
        enableDvr: broadcast.contentDetails.enableDvr,
        enableAutoStart: broadcast.contentDetails.enableAutoStart ?? true,
        enableAutoStop: broadcast.contentDetails.enableAutoStop ?? true,
        recordFromStart: broadcast.contentDetails.recordFromStart ?? true,
        enableMonitorStream: monitor?.enableMonitorStream ?? false,
        broadcastStreamDelayMs: monitor?.broadcastStreamDelayMs ?? 0,
      },
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    const reason = error.error?.errors?.[0]?.reason || '';
    if (reason === 'invalidEmbedSetting') {
      console.warn(`YouTube channel does not allow embedding for broadcast ${broadcastId}`);
      return { enabled: false, embedDisabled: true };
    }

    console.warn(
      `liveBroadcasts.update enableEmbed failed for ${broadcastId}, trying videos.update:`,
      error.error?.message,
    );
    return videoResult.retryable ? videoResult : { enabled: false, retryable: true };
  }

  const retryVideo = await enableVideoEmbedding(broadcastId);
  if (retryVideo.enabled) {
    return { enabled: true };
  }
  if (retryVideo.embedDisabled) {
    return retryVideo;
  }

  const updated = await getBroadcast(broadcastId);
  if (updated.contentDetails.enableEmbed) {
    return { enabled: true };
  }

  return { enabled: false, retryable: true };
}

async function getVideoStatus(videoId: string): Promise<VideoStatus | null> {
  const accessToken = await getAccessToken();
  const res = await fetch(`${YOUTUBE_API}/videos?id=${videoId}&part=status`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.items?.[0]?.status ?? null;
}

function isVideoEmbeddable(status: { embeddable?: boolean } | null): boolean {
  return status?.embeddable === true;
}

/**
 * Set embeddable on the linked video (same id as the broadcast) — mirrors YouTube Studio "Allow embedding".
 */
async function enableVideoEmbedding(
  videoId: string,
): Promise<EmbedAttemptResult> {
  const accessToken = await getAccessToken();
  const status = await getVideoStatus(videoId);

  if (!status) {
    return { enabled: false, retryable: true };
  }

  if (status.embeddable === true) {
    return { enabled: true };
  }

  const res = await fetch(`${YOUTUBE_API}/videos?part=status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: videoId,
      status: {
        embeddable: true,
        privacyStatus: status.privacyStatus ?? 'unlisted',
        selfDeclaredMadeForKids: status.selfDeclaredMadeForKids ?? false,
        ...(status.license ? { license: status.license } : {}),
        ...(status.publicStatsViewable !== undefined
          ? { publicStatsViewable: status.publicStatsViewable }
          : {}),
      },
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    const reason = error.error?.errors?.[0]?.reason || '';
    if (
      reason === 'invalidEmbedSetting' ||
      reason === 'forbiddenEmbedSetting' ||
      reason === 'forbidden'
    ) {
      return { enabled: false, embedDisabled: true };
    }
    console.warn(`videos.update embeddable failed for ${videoId}:`, error.error?.message);
    return { enabled: false, retryable: true };
  }

  const verified = await getVideoStatus(videoId);
  if (verified?.embeddable === true) {
    return { enabled: true };
  }

  return { enabled: false, retryable: true };
}

/**
 * Fetch the RTMP ingestion stream status (active = encoder is sending data).
 */
export async function getLiveStreamIngestionStatus(
  youtubeStreamId: string,
): Promise<string> {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `${YOUTUBE_API}/liveStreams?id=${youtubeStreamId}&part=status`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Failed to fetch live stream status: ${error.error?.message}`);
  }

  const data = await res.json();
  return data.items?.[0]?.status?.streamStatus ?? 'unknown';
}

/**
 * Move scheduled start to now so YouTube allows the live transition.
 */
export async function ensureBroadcastScheduleNow(broadcastId: string): Promise<void> {
  const broadcast = await getBroadcast(broadcastId);
  const scheduled = new Date(broadcast.snippet.scheduledStartTime);
  const now = new Date();

  if (scheduled <= now) return;

  const accessToken = await getAccessToken();
  const newStart = new Date(now.getTime() - 60_000).toISOString();

  const res = await fetch(`${YOUTUBE_API}/liveBroadcasts?part=snippet`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: broadcastId,
      snippet: {
        title: broadcast.snippet.title,
        description: broadcast.snippet.description ?? '',
        scheduledStartTime: newStart,
      },
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Failed to update broadcast schedule: ${error.error?.message}`);
  }
}

async function waitForEncoderSignal(
  broadcastId: string,
  youtubeStreamId: string,
  maxWaitMs = 90_000,
): Promise<string> {
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const [lifecycle, streamStatus] = await Promise.all([
      getBroadcast(broadcastId).then((b) => b.status.lifeCycleStatus),
      getLiveStreamIngestionStatus(youtubeStreamId),
    ]);

    if (LIVE_BROADCAST_STATUSES.has(lifecycle)) {
      return lifecycle;
    }

    if (streamStatus === 'active' && (lifecycle === 'ready' || lifecycle === 'created')) {
      // YouTube takes a few seconds to internalize the active state before allowing a transition.
      // A 3-second stabilization delay prevents the subsequent transitionToLive call from throwing a transition invalid error.
      await sleep(3000);
      return lifecycle;
    }

    await sleep(2_000);
  }

  throw new Error(
    'YouTube did not receive the encoder signal in time. Confirm OBS is streaming to the correct RTMP URL and stream key.',
  );
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

async function finalizeBroadcastEmbedding(
  broadcastId: string,
  embedDisabled?: boolean,
): Promise<boolean | undefined> {
  const embedResult = await enableBroadcastEmbedding(broadcastId, {
    maxAttempts: 5,
    delayMs: 2_000,
  });

  if (embedResult.enabled) return undefined;
  if (embedResult.embedDisabled) return true;
  return embedDisabled ? true : undefined;
}

/**
 * Wait for encoder readiness, then transition (or detect auto-start).
 */
export async function goLiveBroadcast(
  broadcastId: string,
  youtubeStreamId: string,
  options: { enableEmbed?: boolean } = {},
): Promise<{ embedDisabled?: boolean }> {
  let embedDisabled: boolean | undefined;

  if (options.enableEmbed !== false) {
    const embedResult = await enableBroadcastEmbedding(broadcastId, {
      maxAttempts: 4,
      delayMs: 1_500,
    });
    if (embedResult.embedDisabled) {
      embedDisabled = true;
    }
  }

  await ensureBroadcastScheduleNow(broadcastId);

  let lifecycle = await waitForEncoderSignal(broadcastId, youtubeStreamId);

  if (lifecycle === 'live' || lifecycle === 'liveStarting') {
    return { embedDisabled: await finalizeBroadcastEmbedding(broadcastId, embedDisabled) };
  }

  const maxAttempts = 12;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    lifecycle = (await getBroadcast(broadcastId)).status.lifeCycleStatus;

    if (lifecycle === 'live' || lifecycle === 'liveStarting') {
      return { embedDisabled: await finalizeBroadcastEmbedding(broadcastId, embedDisabled) };
    }

    if (lifecycle === 'ready' || lifecycle === 'testing' || lifecycle === 'testStarting') {
      try {
        await transitionToLive(broadcastId);
        return { embedDisabled: await finalizeBroadcastEmbedding(broadcastId, embedDisabled) };
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        const lower = message.toLowerCase();
        const currentStatus = (await getBroadcast(broadcastId)).status.lifeCycleStatus;

        if (
          currentStatus === 'live' ||
          currentStatus === 'liveStarting' ||
          lower.includes('redundant') ||
          lower.includes('already')
        ) {
          return { embedDisabled: await finalizeBroadcastEmbedding(broadcastId, embedDisabled) };
        }

        if (attempt < maxAttempts - 1) {
          await sleep(3_000);
          continue;
        }

        throw err;
      }
    }

    if (lifecycle === 'created') {
      await sleep(3_000);
      continue;
    }

    throw new Error(`Cannot go live from YouTube broadcast status: ${lifecycle}`);
  }

  throw new Error('Timed out waiting for YouTube to go live. Ensure OBS is streaming and try again.');
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
