import { NextRequest, NextResponse } from 'next/server';
import { syncYouTubeLiveChat } from '@/lib/live-stream/sync-youtube-chat';

export async function POST(req: NextRequest) {
  try {
    const cronSecret = req.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { streamId } = await req.json();

    if (!streamId) {
      return NextResponse.json(
        { error: 'streamId required' },
        { status: 400 }
      );
    }

    const result = await syncYouTubeLiveChat(streamId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Chat sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync chat' },
      { status: 500 }
    );
  }
}
