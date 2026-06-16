/**
 * POST /api/youtube/token/refresh
 * Refreshes YouTube access token for the authenticated admin
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/features/admin/lib/admin-route';
import { getAccessTokenForUser } from '@/lib/youtube/getAccessToken';

export async function POST() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const accessToken = await getAccessTokenForUser(auth.userId);
    return NextResponse.json({ access_token: accessToken, success: true });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refresh token' },
      { status: 500 },
    );
  }
}
