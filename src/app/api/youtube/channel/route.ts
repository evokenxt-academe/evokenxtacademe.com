/**
 * GET /api/youtube/channel
 * Fetches connected YouTube channel info
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChannelInfo } from '@/lib/youtube/api';

export async function GET(req: NextRequest) {
  try {
    const info = await getChannelInfo();
    return NextResponse.json(info);
  } catch (error) {
    console.error('Channel info error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channel info' },
      { status: 500 }
    );
  }
}
