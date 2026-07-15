/**
 * POST /api/youtube/broadcasts/end
 * Ends a broadcast (transitions to complete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { endBroadcast, getBroadcast } from '@/lib/youtube/api';
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
    try {
      await endBroadcast(stream.yt_broadcast_id);
    } catch (error: any) {
      const msg = error?.message || '';
      // If the broadcast is already completed (redundant transition), we can log a warning and proceed
      if (
        !msg.toLowerCase().includes('redundant transition') &&
        !msg.toLowerCase().includes('redundanttransition')
      ) {
        throw error;
      }
      console.warn('Ignoring YouTube redundant transition error (broadcast already ended):', msg);
    }

    // Calculate duration using actualStartTime and actualEndTime from YouTube!
    let durationSec = 0;
    let endedAt = new Date();
    try {
      const broadcastDetails = await getBroadcast(stream.yt_broadcast_id);
      const actualStart = broadcastDetails.snippet?.actualStartTime;
      const actualEnd = broadcastDetails.snippet?.actualEndTime;
      
      if (actualStart && actualEnd) {
        durationSec = Math.floor((new Date(actualEnd).getTime() - new Date(actualStart).getTime()) / 1000);
        endedAt = new Date(actualEnd);
      } else if (actualStart) {
        durationSec = Math.floor((endedAt.getTime() - new Date(actualStart).getTime()) / 1000);
      }
    } catch (e) {
      console.error('Failed to fetch actual start/end times from YouTube broadcast:', e);
    }

    if (durationSec <= 0) {
      // Fallback to local calculation
      const startedAt = stream.started_at ? new Date(stream.started_at) : new Date();
      durationSec = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
    }

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
