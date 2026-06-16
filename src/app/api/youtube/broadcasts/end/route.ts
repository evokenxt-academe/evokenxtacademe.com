/**
 * POST /api/youtube/broadcasts/end
 * Ends a broadcast (transitions to complete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { endBroadcast } from '@/lib/youtube/api';
import { cleanupStreamEngagement } from '@/lib/live-stream/cleanup-engagement';

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

    // End broadcast
    await endBroadcast(stream.yt_broadcast_id);

    // Calculate duration
    const startedAt = stream.started_at ? new Date(stream.started_at) : new Date();
    const endedAt = new Date();
    const durationSec = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    // Update stream status in database
    const { error: updateError } = await supabase
      .from('live_streams')
      .update({
        status: 'ended',
        ended_at: endedAt.toISOString(),
        duration_sec: durationSec,
      })
      .eq('id', streamId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    after(async () => {
      try {
        await cleanupStreamEngagement(streamId, supabase);
      } catch (cleanupError) {
        console.error('Stream engagement cleanup failed:', cleanupError);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('End broadcast error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to end broadcast' },
      { status: 500 }
    );
  }
}
