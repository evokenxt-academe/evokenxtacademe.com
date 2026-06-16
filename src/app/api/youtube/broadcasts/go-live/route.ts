/**
 * POST /api/youtube/broadcasts/go-live
 * Transitions a broadcast to "live" status
 */

import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { goLiveBroadcast } from '@/lib/youtube/api';
import {
  notifyLiveStream,
  resolveLiveStreamContext,
} from '@/lib/notifications/server';

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  );
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

    if (!stream.yt_broadcast_id) {
      return NextResponse.json(
        { error: 'Broadcast not created on YouTube yet' },
        { status: 400 }
      );
    }

    if (!stream.yt_stream_id) {
      return NextResponse.json(
        { error: 'YouTube stream binding missing. Recreate the broadcast from the control room.' },
        { status: 400 }
      );
    }

    await goLiveBroadcast(stream.yt_broadcast_id, stream.yt_stream_id);

    // Update stream status in database
    const { error: updateError } = await supabase
      .from('live_streams')
      .update({
        status: 'live',
        started_at: new Date().toISOString(),
      })
      .eq('id', streamId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    after(async () => {
      const stream = await resolveLiveStreamContext(streamId);
      if (!stream) return;
      await notifyLiveStream({
        streamId: stream.id,
        title: stream.title,
        ytVideoId: stream.yt_video_id,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Go live error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to go live' },
      { status: 500 }
    );
  }
}
