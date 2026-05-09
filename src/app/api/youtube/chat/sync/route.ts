/**
 * POST /api/youtube/chat/sync
 * Syncs YouTube live chat messages to our database
 * Called periodically (every 5-30 seconds) during a live stream
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchLiveChatMessages } from '@/lib/youtube/api';

interface ChatSyncState {
  [key: string]: string; // streamId -> nextPageToken
}

const chatSyncState: ChatSyncState = {};

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { streamId } = await req.json();

    if (!streamId) {
      return NextResponse.json(
        { error: 'streamId required' },
        { status: 400 }
      );
    }

    // Verify cron secret for security
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
      .select('yt_live_chat_id')
      .eq('id', streamId)
      .single();

    if (streamError || !stream?.yt_live_chat_id) {
      return NextResponse.json(
        { error: 'Stream or live chat not found' },
        { status: 404 }
      );
    }

    // Fetch messages from YouTube
    const { messages, nextPageToken } = await fetchLiveChatMessages(
      stream.yt_live_chat_id,
      chatSyncState[streamId]
    );

    if (messages.length > 0) {
      // Get existing message IDs to avoid duplicates
      const { data: existingIds } = await supabase
        .from('chat_messages')
        .select('yt_message_id')
        .eq('live_stream_id', streamId)
        .not('yt_message_id', 'is', null);

      const existingIdSet = new Set(existingIds?.map(m => m.yt_message_id) || []);

      // Filter new messages
      const newMessages = messages.filter(m => !existingIdSet.has(m.id));

      // Insert new messages
      if (newMessages.length > 0) {
        const { error: insertError } = await supabase
          .from('chat_messages')
          .insert(
            newMessages.map(m => ({
              live_stream_id: streamId,
              author_name: m.author,
              author_avatar: m.thumbnail,
              message: m.text,
              type: 'message',
              yt_message_id: m.id,
              is_approved: true, // YouTube messages auto-approved
              user_id: null,
            }))
          );

        if (insertError) {
          console.error('Insert error:', insertError);
        }

        // Update chat message count
        await supabase
          .from('live_streams')
          .update({
            total_chat_msgs: newMessages.length,
          })
          .eq('id', streamId);
      }
    }

    // Store next page token for next sync
    if (nextPageToken) {
      chatSyncState[streamId] = nextPageToken;
    }

    return NextResponse.json({
      success: true,
      messagesSync: messages.length,
    });
  } catch (error) {
    console.error('Chat sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync chat' },
      { status: 500 }
    );
  }
}
