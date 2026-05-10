import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { listLiveBroadcasts } from '@/lib/youtube/api';

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    // 1. Get all broadcasts from YouTube to find live ones
    const ytBroadcasts = await listLiveBroadcasts('all');

    if (ytBroadcasts.length === 0) {
      return NextResponse.json({ message: 'No broadcasts found on YouTube', count: 0 });
    }

    // Get the admin user ID (Amar Biradar)
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'amarbiradar147@gmail.com')
      .single();

    if (!adminUser) {
      throw new Error('Admin user not found for sync');
    }

    // Get a fallback course ID
    const { data: firstCourse } = await supabase
      .from('courses')
      .select('id')
      .limit(1)
      .single();

    const results: any[] = [];

    for (const yt of ytBroadcasts) {
      const lifecycle = yt.status?.lifeCycleStatus;
      
      // Only sync streams that are actually live or in testing
      if (lifecycle !== 'live' && lifecycle !== 'testing') continue;

      const broadcastId = yt.id;
      const title = yt.snippet?.title;
      const description = yt.snippet?.description;
      const scheduledAt = yt.snippet?.scheduledStartTime;
      const liveChatId = yt.snippet?.liveChatId;

      // 2. Check if already in our database
      const { data: existingStream } = await supabase
        .from('live_streams')
        .select('id, status')
        .eq('yt_broadcast_id', broadcastId)
        .maybeSingle();

      if (existingStream) {
        // Update status to live if it's not already
        if (existingStream.status !== 'live' && lifecycle === 'live') {
          await supabase
            .from('live_streams')
            .update({ 
              status: 'live', 
              started_at: new Date().toISOString(),
              yt_live_chat_id: liveChatId 
            })
            .eq('id', existingStream.id);
        }
        results.push({ id: existingStream.id, title, status: 'updated' });
      } else {
        // 3. Create new stream record
        const { data: newStream, error: insertError } = await supabase
          .from('live_streams')
          .insert({
            title: title || 'Synced YouTube Stream',
            description: description || '',
            status: lifecycle === 'live' ? 'live' : 'scheduled',
            scheduled_at: scheduledAt || new Date().toISOString(),
            started_at: lifecycle === 'live' ? new Date().toISOString() : null,
            yt_broadcast_id: broadcastId,
            yt_video_id: broadcastId,
            yt_live_chat_id: liveChatId,
            course_id: firstCourse?.id || '',
            instructor_id: adminUser.id,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Failed to insert synced stream:', insertError);
        } else {
          results.push({ id: newStream.id, title, status: 'created' });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: results.length, 
      results 
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    
    const message = error?.message || '';
    
    // Detect insufficient scopes or auth errors
    if (message.includes('insufficient authentication scopes') || 
        message.includes('insufficientPermissions')) {
      return NextResponse.json({ 
        error: message,
        code: 'INSUFFICIENT_SCOPES',
        action: 'reauth',
      }, { status: 403 });
    }
    
    if (message.includes('invalid_grant') || message.includes('Token has been expired')) {
      return NextResponse.json({ 
        error: message,
        code: 'TOKEN_EXPIRED',
        action: 'reauth',
      }, { status: 401 });
    }
    
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
