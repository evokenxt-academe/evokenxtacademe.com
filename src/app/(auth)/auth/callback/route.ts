import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/adminClient'
import {
  buildSessionCookieOptions,
  countSupabaseAuthSessions,
  hasActiveSessionElsewhere,
  isSingleSessionEnforced,
  LMS_SESSION_COOKIE,
} from '@/lib/auth/single-session'
import { autoEnrollUserInAllCourses } from '@/lib/auth/enrollment-sync'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const authErrorDescription = searchParams.get('error_description')
  const isPwa = searchParams.get('pwa') === '1'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      const session = data.session
      const adminClient = createAdminClient()

      const { data: existingProfile } = await adminClient
        .from('users')
        .select('current_session_id, session_last_seen_at, role')
        .eq('id', session.user.id)
        .maybeSingle()

      const userRole = existingProfile?.role ?? null

      if (userRole === 'admin' || userRole === 'instructor') {
        await autoEnrollUserInAllCourses(session.user.id, userRole)
      }

      const enforceSingleSession = isSingleSessionEnforced(userRole)

      if (enforceSingleSession) {
        const sessionCount = await countSupabaseAuthSessions(session.user.id)
        const blocked = hasActiveSessionElsewhere(
          existingProfile,
          sessionCount,
        )

        if (blocked) {
          await supabase.auth.signOut({ scope: 'local' })

          const blockedUrl = new URL('/auth/active-session', origin)
          const response = NextResponse.redirect(blockedUrl.toString())
          response.cookies.delete(LMS_SESSION_COOKIE)
          return response
        }
      }

      const newSessionId = crypto.randomUUID()

      try {
        const { error: updateSessionError } = await adminClient
          .from('users')
          .update({
            current_session_id: newSessionId,
            session_last_seen_at: new Date().toISOString(),
          })
          .eq('id', session.user.id)

        if (updateSessionError) {
          console.error('Error updating current session ID in DB:', updateSessionError)
        }
      } catch (err) {
        console.error('Failed to register session:', err)
      }

      // Persist the YouTube refresh token in user_metadata (legacy approach)
      if (session.provider_refresh_token) {
        await supabase.auth.updateUser({
          data: {
            youtube_refresh_token: session.provider_refresh_token
          }
        })
      }

      // Also persist tokens in dedicated youtube_tokens table for reliability.
      // This fixes the bug where provider_token / provider_refresh_token are lost
      // after the Supabase session expires or on subsequent logins without "consent" prompt.
      if ((session.provider_refresh_token || session.provider_token) && session.user?.email === 'amarbiradar147@gmail.com') {
        try {
          await adminClient
            .from('youtube_tokens')
            .upsert(
              {
                user_id: session.user.id,
                refresh_token: session.provider_refresh_token ?? '',
                access_token: session.provider_token ?? null,
                expires_at: session.expires_at
                  ? new Date(session.expires_at * 1000).toISOString()
                  : null,
                scopes: 'email profile https://www.googleapis.com/auth/youtube.upload',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            )
        } catch (err) {
          console.error('Failed to persist YouTube tokens:', err)
          // Non-blocking — user can still log in
        }
      }

      // Determine redirect destination based on user role
      let redirectDestination = next;
      if (userRole === 'admin' || userRole === 'instructor') {
        if (next === '/' || next === '/dashboard') {
          redirectDestination = '/admin';
        }
      } else {
        if (next === '/' || next === '/admin') {
          redirectDestination = '/dashboard';
        }
      }

      const separator = redirectDestination.includes('?') ? '&' : '?';
      const redirectUrl = isPwa
        ? `${origin}/auth/pwa-callback?status=success`
        : `${origin}${redirectDestination}${separator}pwa_install=1`;
      const response = NextResponse.redirect(redirectUrl)

      response.cookies.set(LMS_SESSION_COOKIE, newSessionId, buildSessionCookieOptions())

      return response
    }

    const message = error?.message ?? 'Could not authenticate user'
    if (isPwa) {
      return NextResponse.redirect(`${origin}/auth/pwa-callback?status=error&error=${encodeURIComponent(message)}`)
    }
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(message)}`)
  }

  if (authErrorDescription) {
    if (isPwa) {
      return NextResponse.redirect(`${origin}/auth/pwa-callback?status=error&error=${encodeURIComponent(authErrorDescription)}`)
    }
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(authErrorDescription)}`)
  }

  // return the user to an error page with some instructions
  if (isPwa) {
    return NextResponse.redirect(`${origin}/auth/pwa-callback?status=error&error=Could%20not%20authenticate%20user`)
  }
  return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate user`)
}
