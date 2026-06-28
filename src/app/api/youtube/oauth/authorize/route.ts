/**
 * GET /api/youtube/oauth/authorize
 * Redirects user to Google OAuth consent screen
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestOrigin } from '@/lib/youtube/oauth-helper';

export async function GET(req: NextRequest) {
  const scopes = [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/drive.readonly',
  ];

  // Build the redirect URI dynamically for production vs local
  const origin = getRequestOrigin(req);
  const redirectUri = `${origin}/api/youtube/oauth/callback`;

  const state = req.nextUrl.searchParams.get('state') || '';

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  });

  if (state) {
    params.set('state', state);
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  return NextResponse.redirect(googleAuthUrl);
}
