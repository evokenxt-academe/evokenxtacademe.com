/**
 * POST /api/youtube/analytics/sync
 * Fetches live viewer count from YouTube and stores analytics snapshots
 * Called every 60 seconds during a live stream
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getVideoStatistics } from '@/lib/youtube/api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

    // Verify cron secret
    const cronSecret = req.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get stream details
    const { data: stream, error: streamError } = await supabase
      .from('live_streams')
      .select('yt_video_id')
      .eq('id', streamId)
      .single();

    if (streamError || !stream?.yt_video_id) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    // Fetch statistics from YouTube
    const { concurrentViewers, totalViewers } = await getVideoStatistics(stream.yt_video_id);

    // Get current chat message count
    const { count: messageCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact' })
      .eq('live_stream_id', streamId);

    // Create analytics snapshot
    const { error: insertError } = await supabase
      .from('stream_analytics')
      .insert({
        live_stream_id: streamId,
        concurrent_viewers: concurrentViewers,
        messages_total: messageCount || 0,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }

    // Update live_streams with current stats
    const { data: currentStream } = await supabase
      .from('live_streams')
      .select('peak_viewers')
      .eq('id', streamId)
      .single();

    const newPeak = Math.max(currentStream?.peak_viewers || 0, concurrentViewers);

    const { error: updateError } = await supabase
      .from('live_streams')
      .update({
        concurrent_viewers: concurrentViewers,
        peak_viewers: newPeak,
        total_chat_msgs: messageCount || 0,
      })
      .eq('id', streamId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      success: true,
      concurrent_viewers: concurrentViewers,
      total_viewers: totalViewers,
      messages: messageCount,
      peak: newPeak,
    });
  } catch (error) {
    console.error('Analytics sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync analytics' },
      { status: 500 }
    );
  }
}
