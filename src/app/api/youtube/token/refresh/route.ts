/**
 * POST /api/youtube/token/refresh
 * Refreshes YouTube access token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Verify this is called from server-side
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get current token
    const { data: token } = await supabase
      .from('youtube_tokens')
      .select('*')
      .eq('user_id', (await supabase.auth.admin.listUsers()).data?.users?.find(
        u => u.email === 'amarbiradar147@gmail.com'
      )?.id)
      .single();

    if (!token) {
      return NextResponse.json(
        { error: 'YouTube token not found' },
        { status: 404 }
      );
    }

    // Refresh token
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: token.refresh_token,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!refreshRes.ok) {
      const error = await refreshRes.json();
      throw new Error(error.error);
    }

    const refreshData = await refreshRes.json();
    const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000);

    // Update in database
    await supabase
      .from('youtube_tokens')
      .update({
        access_token: refreshData.access_token,
        expires_at: newExpiresAt.toISOString(),
      })
      .eq('user_id', token.user_id);

    return NextResponse.json({
      access_token: refreshData.access_token,
      expires_in: refreshData.expires_in,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
