/**
 * POST /api/youtube/broadcasts/create
 * Creates a YouTube Live Broadcast + Stream and links it to a live_streams record
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLiveBroadcast } from '@/lib/youtube/api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { streamId } = await req.json();

    if (!streamId) {
      return NextResponse.json(
        { error: 'streamId required' },
        { status: 400 }
      );
    }

    // Get stream details
    const { data: stream, error: streamError } = await supabase
      .from('live_streams')
      .select('*')
      .eq('id', streamId)
      .single();

    if (streamError || !stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    // Create YouTube broadcast + stream
    const { broadcastId, streamId: youtubeStreamId, rtmpUrl, streamKey } = await createLiveBroadcast(
      stream.title,
      stream.description || '',
      stream.scheduled_at,
      {
        privacy: 'unlisted',
        enableDvr: true,
        enableChat: true,
        resolution: '1080p',
      }
    );

    // Get broadcast details to extract video ID and live chat ID
    const accessTokenRes = await fetch('/api/youtube/token/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer internal' },
    });

    const { access_token } = await accessTokenRes.json();

    const broadcastRes = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts?id=${broadcastId}&part=snippet`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const broadcastData = await broadcastRes.json();
    const videoId = broadcastData.items?.[0]?.id;
    const liveChatId = broadcastData.items?.[0]?.snippet?.liveChatId;

    // Update live_streams with YouTube details
    const { error: updateError } = await supabase
      .from('live_streams')
      .update({
        yt_broadcast_id: broadcastId,
        yt_stream_id: youtubeStreamId,
        yt_video_id: videoId,
        yt_rtmp_url: rtmpUrl,
        yt_stream_key: streamKey,
        yt_live_chat_id: liveChatId,
      })
      .eq('id', streamId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      success: true,
      broadcastId,
      streamId: youtubeStreamId,
      videoId,
      rtmpUrl,
      streamKey,
    });
  } catch (error) {
    console.error('Create broadcast error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create broadcast' },
      { status: 500 }
    );
  }
}
