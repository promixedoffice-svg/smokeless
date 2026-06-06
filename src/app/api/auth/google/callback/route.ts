import { NextRequest, NextResponse } from 'next/server'

const APP_URL = 'https://smokeless-omega.vercel.app'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${APP_URL}?auth_error=${error ?? 'no_code'}`)
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${APP_URL}?auth_error=missing_config`)
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${APP_URL}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokens.id_token) {
    return NextResponse.redirect(`${APP_URL}?auth_error=no_token`)
  }

  // Pass id_token to client via URL hash (not stored in server logs or history)
  return NextResponse.redirect(`${APP_URL}#gtoken=${encodeURIComponent(tokens.id_token)}`)
}
