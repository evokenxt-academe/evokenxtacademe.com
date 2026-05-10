/**
 * GET /api/youtube/oauth/authorize
 * Redirects user to Google OAuth consent screen
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const scopes = [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  // Build the redirect URI dynamically for production vs local
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI || `${baseUrl}/api/youtube/oauth/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  return NextResponse.redirect(googleAuthUrl);
}
