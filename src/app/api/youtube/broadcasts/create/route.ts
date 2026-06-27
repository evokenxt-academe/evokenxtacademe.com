/**
 * POST /api/youtube/broadcasts/create
 * Creates a YouTube Live Broadcast + Stream and links it to a live_streams record
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLiveBroadcast } from '@/lib/youtube/api';
import { requireAdmin } from '@/features/admin/lib/admin-route';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const supabase = auth.supabase;

  try {
    const { streamId } = await req.json();

    if (!streamId) {
      return NextResponse.json({ error: 'streamId required' }, { status: 400 });
    }

    const { data: stream, error: streamError } = await supabase
      .from('live_streams')
      .select('*')
      .eq('id', streamId)
      .single();

    if (streamError || !stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    if (stream.yt_broadcast_id) {
      return NextResponse.json({
        success: true,
        broadcastId: stream.yt_broadcast_id,
        streamId: stream.yt_stream_id,
        videoId: stream.yt_video_id,
        rtmpUrl: stream.yt_rtmp_url,
        streamKey: stream.yt_stream_key,
        alreadyExists: true,
      });
    }

    if (!stream.scheduled_at) {
      return NextResponse.json(
        { error: 'Stream must have a scheduled_at time before creating a YouTube broadcast' },
        { status: 400 },
      );
    }

    const {
      broadcastId,
      streamId: youtubeStreamId,
      rtmpUrl,
      streamKey,
      videoId,
      liveChatId,
      embedDisabled,
    } = await createLiveBroadcast(
      stream.title,
      stream.description || '',
      stream.scheduled_at,
      {
        privacy: stream.visibility || 'unlisted',
        enableDvr: stream.enable_dvr !== false,
        enableChat: stream.enable_chat !== false,
        enableEmbed: stream.enable_embed !== false,
        resolution: stream.max_quality || '1080p',
      },
    );

    const { error: updateError } = await supabase
      .from('live_streams')
      .update({
        yt_broadcast_id: broadcastId,
        yt_stream_id: youtubeStreamId,
        yt_video_id: videoId ?? broadcastId,
        yt_rtmp_url: rtmpUrl,
        yt_stream_key: streamKey,
        yt_live_chat_id: liveChatId ?? null,
        ...(embedDisabled ? { enable_embed: false } : {}),
      })
      .eq('id', streamId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      success: true,
      broadcastId,
      streamId: youtubeStreamId,
      videoId: videoId ?? broadcastId,
      rtmpUrl,
      streamKey,
      liveChatId,
      embedDisabled,
    });
  } catch (error: any) {
    console.error('Create broadcast error:', error);
    const message = error.message || 'Failed to create broadcast';
    const reason = error.reason || (message.includes('not enabled for live streaming') ? 'liveStreamingNotEnabled' : null);

    if (reason === 'liveStreamingNotEnabled' || (error.statusCode === 403 && message.includes('live streaming'))) {
      return NextResponse.json(
        {
          error: 'The connected YouTube channel does not have live streaming enabled. Please enable it in YouTube Studio (requires phone verification and may take up to 24 hours to activate).',
          reason: 'liveStreamingNotEnabled',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: message,
        reason: reason || null,
      },
      { status: error.statusCode || 500 }
    );
  }
}
