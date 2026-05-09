import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const { streamId } = await params;

    // Get original stream
    const { data: originalStream, error: fetchError } = await supabase
      .from('live_streams')
      .select('*')
      .eq('id', streamId)
      .single();

    if (fetchError) throw fetchError;
    if (!originalStream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    // Create new stream
    const newStream = {
      course_id: originalStream.course_id,
      instructor_id: originalStream.instructor_id,
      title: `${originalStream.title} (Copy)`,
      description: originalStream.description,
      tags: originalStream.tags,
      notes: originalStream.notes,
      status: 'scheduled',
      scheduled_at: new Date().toISOString(), // Will need to be updated by user
      // Reset all YouTube and metrics fields
      yt_broadcast_id: null,
      yt_stream_id: null,
      yt_rtmp_url: null,
      yt_stream_key: null,
      yt_video_id: null,
      yt_live_chat_id: null,
      concurrent_viewers: 0,
      peak_viewers: 0,
      duration_sec: 0,
      total_chat_msgs: 0,
    };

    const { data: duplicatedStream, error: createError } = await supabase
      .from('live_streams')
      .insert(newStream)
      .select()
      .single();

    if (createError) throw createError;

    return NextResponse.json(
      {
        success: true,
        streamId: duplicatedStream.id,
        message: 'Stream duplicated successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to duplicate stream:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
