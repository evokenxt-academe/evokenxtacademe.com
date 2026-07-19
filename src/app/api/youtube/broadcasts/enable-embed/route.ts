/**
 * POST /api/youtube/broadcasts/enable-embed
 * Enables "Allow embedding" on a YouTube live broadcast/video via API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { enableBroadcastEmbedding } from '@/lib/youtube/api';
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
      .select('id, yt_broadcast_id, enable_embed')
      .eq('id', streamId)
      .single();

    if (streamError || !stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    if (!stream.yt_broadcast_id) {
      return NextResponse.json(
        { error: 'YouTube broadcast not created yet' },
        { status: 400 },
      );
    }

    const embedResult = await enableBroadcastEmbedding(stream.yt_broadcast_id, {
      maxAttempts: 6,
      delayMs: 2_000,
    });

    await supabase
      .from('live_streams')
      .update({ enable_embed: embedResult.enabled && !embedResult.embedDisabled })
      .eq('id', streamId);

    return NextResponse.json({
      success: embedResult.enabled,
      embedDisabled: embedResult.embedDisabled ?? false,
    });
  } catch (error) {
    console.error('Enable embed error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enable embedding' },
      { status: 500 },
    );
  }
}
