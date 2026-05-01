import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/adminClient'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const authErrorDescription = searchParams.get('error_description')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      const session = data.session

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
          const adminClient = createAdminClient()
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

      return NextResponse.redirect(`${origin}${next}`)
    }

    const message = error?.message ?? 'Could not authenticate user'
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(message)}`)
  }

  if (authErrorDescription) {
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(authErrorDescription)}`)
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate user`)
}
