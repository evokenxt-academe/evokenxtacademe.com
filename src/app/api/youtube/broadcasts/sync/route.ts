import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { listLiveBroadcasts } from '@/lib/youtube/api';
import { cleanupStreamEngagement } from '@/lib/live-stream/cleanup-engagement';

/**
 * Maps YouTube lifeCycleStatus to our internal stream status.
 * 
 * YouTube lifecycle: created → ready → testing → live → complete
 * - 'ready' means the stream key is bound and OBS can connect
 * - 'testing' means OBS is actively sending data but broadcast isn't public yet
 * - 'live' means the broadcast is publicly live
 * - 'complete' means the broadcast has ended
 */
function mapLifecycleToStatus(lifecycle: string): 'scheduled' | 'live' | 'ended' | null {
  switch (lifecycle) {
    case 'live':
    case 'liveStarting':
      return 'live';
    case 'complete':
    case 'revoked':
      return 'ended';
    case 'ready':
    case 'testing':
    case 'testStarting':
      // OBS is connected / sending data — treat as live in our system
      return 'live';
    case 'created':
      return 'scheduled';
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    // 1. Get all broadcasts from YouTube to find live ones
    const ytBroadcasts = await listLiveBroadcasts('all');

    if (ytBroadcasts.length === 0) {
      return NextResponse.json({ success: true, message: 'No broadcasts found on YouTube', count: 0 });
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
      const mappedStatus = mapLifecycleToStatus(lifecycle);
      
      // Skip broadcasts with unmappable lifecycle status
      if (!mappedStatus) {
        console.log(`Skipping broadcast ${yt.id} with lifecycle: ${lifecycle}`);
        continue;
      }

      const broadcastId = yt.id;
      const title = yt.snippet?.title;
      const description = yt.snippet?.description;
      const scheduledAt = yt.snippet?.scheduledStartTime;
      const liveChatId = yt.snippet?.liveChatId;
      const actualStartTime = yt.snippet?.actualStartTime;
      const actualEndTime = yt.snippet?.actualEndTime;

      // 2. Check if already in our database
      const { data: existingStream } = await supabase
        .from('live_streams')
        .select('id, status, yt_video_id, yt_live_chat_id')
        .eq('yt_broadcast_id', broadcastId)
        .maybeSingle();

      if (existingStream) {
        // Build update payload — always sync relevant fields
        const updatePayload: Record<string, any> = {};

        // Update status if it changed
        if (existingStream.status !== mappedStatus) {
          updatePayload.status = mappedStatus;
          
          if (mappedStatus === 'live' && existingStream.status !== 'live') {
            updatePayload.started_at = actualStartTime || new Date().toISOString();
          }
          if (mappedStatus === 'ended' && existingStream.status !== 'ended') {
            updatePayload.ended_at = actualEndTime || new Date().toISOString();
          }
        }

        // Always sync video ID (broadcast ID = video ID on YouTube)
        if (!existingStream.yt_video_id || existingStream.yt_video_id !== broadcastId) {
          updatePayload.yt_video_id = broadcastId;
        }

        // Sync live chat ID if available
        if (liveChatId && existingStream.yt_live_chat_id !== liveChatId) {
          updatePayload.yt_live_chat_id = liveChatId;
        }

        // Only update if there are changes
        if (Object.keys(updatePayload).length > 0) {
          const becameEnded =
            mappedStatus === 'ended' && existingStream.status !== 'ended';

          await supabase
            .from('live_streams')
            .update(updatePayload)
            .eq('id', existingStream.id);

          if (becameEnded) {
            after(async () => {
              try {
                await cleanupStreamEngagement(existingStream.id, supabase);
              } catch (cleanupError) {
                console.error('Stream engagement cleanup failed:', cleanupError);
              }
            });
          }

          results.push({ 
            id: existingStream.id, 
            title, 
            status: `updated (${Object.keys(updatePayload).join(', ')})`,
            lifecycle,
          });
        }
      } else {
        // Only create new stream records for active broadcasts (not completed/old ones)
        if (mappedStatus === 'ended') continue;

        // 3. Create new stream record
        const { data: newStream, error: insertError } = await supabase
          .from('live_streams')
          .insert({
            title: title || 'Synced YouTube Stream',
            description: description || '',
            status: mappedStatus,
            scheduled_at: scheduledAt || new Date().toISOString(),
            started_at: mappedStatus === 'live' ? (actualStartTime || new Date().toISOString()) : null,
            yt_broadcast_id: broadcastId,
            yt_video_id: broadcastId, // On YouTube, broadcast ID is the video ID
            yt_live_chat_id: liveChatId,
            course_id: firstCourse?.id || '',
            instructor_id: adminUser.id,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Failed to insert synced stream:', insertError);
        } else {
          results.push({ id: newStream.id, title, status: 'created', lifecycle });
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

