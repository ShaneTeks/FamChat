import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?spotify_error=${error}`
    )
  }

  if (!code || !state) {
    console.error('No code or state received!')
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?spotify_error=no_code`
    )
  }
  
  // Decode user ID from state parameter
  let userId: string
  try {
    const decoded = Buffer.from(state, 'base64').toString('utf-8')
    const [extractedUserId, randomState] = decoded.split(':')
    userId = extractedUserId
    console.log('Decoded user ID from state:', userId)
  } catch (e) {
    console.error('Failed to decode state:', e)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?spotify_error=invalid_state`
    )
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/spotify/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to get tokens')
    }

    const tokens = await tokenResponse.json()
    
    console.log('Successfully exchanged code for Spotify tokens')
    
    // Create Supabase client - use service role if available to bypass RLS
    // We already have the user ID from the state parameter
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey
    )
    
    console.log('Storing tokens for user:', userId)

    // Store tokens in database
    const { error: dbError } = await supabase
      .from('spotify_tokens')
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + (tokens.expires_in * 1000),
        updated_at: new Date().toISOString(),
      })

    if (dbError) {
      console.error('Failed to store Spotify tokens:', dbError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/?spotify_error=storage_failed`
      )
    }

    // Success! Redirect back to app
    console.log('Spotify tokens stored successfully!')
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?spotify_connected=true`
    )
  } catch (error) {
    console.error('Spotify callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?spotify_error=unknown`
    )
  }
}
