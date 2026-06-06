import { NextResponse } from 'next/server'

const APP_URL = 'https://smokeless-omega.vercel.app'

export async function GET() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'Missing GOOGLE_OAUTH_CLIENT_ID' }, { status: 500 })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${APP_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/auth?${params}`)
}
