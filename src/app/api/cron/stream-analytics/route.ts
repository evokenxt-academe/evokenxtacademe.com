import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';



type AnalyticsSyncError = {
    streamId: string;
    error: string;
};

type AnalyticsSyncResults = {
    streamsProcessed: number;
    analyticsUpdated: number;
    chatSynced: number;
    errors: AnalyticsSyncError[];
};

/**
 * Cron endpoint: Sync live stream analytics
 * Runs every 60 seconds during live broadcasts
 *
 * This endpoint:
 * 1. Fetches all live streams
 * 2. Updates viewer counts from YouTube
 * 3. Syncs YouTube chat messages
 * 4. Creates analytics snapshots
 *
 * Called by: Vercel cron (vercel.json) or external cron service
 */
export async function POST(request: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify cron secret
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Find all live streams
        const { data: liveStreams, error: streamError } = await supabase
            .from('live_streams')
            .select('id, yt_video_id, yt_live_chat_id')
            .eq('status', 'live');

        if (streamError) throw streamError;

        const results: AnalyticsSyncResults = {
            streamsProcessed: 0,
            analyticsUpdated: 0,
            chatSynced: 0,
            errors: [],
        };

        for (const stream of liveStreams || []) {
            try {
                // 1. Update viewer analytics from YouTube
                if (stream.yt_video_id) {
                    const analyticsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/youtube/analytics/sync`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ streamId: stream.id }),
                    });

                    if (analyticsRes.ok) {
                        results.analyticsUpdated++;
                    }
                }

                // 2. Sync YouTube chat messages
                if (stream.yt_live_chat_id) {
                    const chatRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/youtube/chat/sync`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ streamId: stream.id }),
                    });

                    if (chatRes.ok) {
                        results.chatSynced++;
                    }
                }

                results.streamsProcessed++;
            } catch (streamErr) {
                results.errors.push({
                    streamId: stream.id,
                    error: streamErr instanceof Error ? streamErr.message : 'Unknown error',
                });
            }
        }

        console.log('Analytics sync completed:', results);

        return NextResponse.json({
            success: true,
            results,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Failed to sync analytics:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
