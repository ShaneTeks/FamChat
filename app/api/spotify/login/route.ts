import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Get user ID from query parameter (passed from client)
  const userId = request.nextUrl.searchParams.get('user_id')
  
  if (!userId) {
    console.error('No user_id provided in query parameter')
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?spotify_error=not_authenticated`
    )
  }
  
  console.log('Spotify login initiated for user:', userId)
  
  // Encode user ID in state parameter (base64 for simplicity in dev)
  const randomState = generateRandomString(16)
  const state = Buffer.from(`${userId}:${randomState}`).toString('base64')
  const scope = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
  ].join(' ')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: scope,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/spotify/callback`,
    state: state,
  })

  console.log('Redirecting to Spotify with user ID encoded in state')
  
  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params}`
  )
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
