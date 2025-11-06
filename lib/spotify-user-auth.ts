import { createClient } from '@supabase/supabase-js'

export async function getUserSpotifyToken(userId: string, supabaseClient: any): Promise<string | null> {
  
  // Get user's tokens from database
  const { data: tokenData, error } = await supabaseClient
    .from('spotify_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !tokenData) {
    return null // User hasn't connected Spotify yet
  }

  // Check if token is expired or about to expire (5 min buffer)
  if (Date.now() >= tokenData.expires_at - 300000) {
    // Refresh the token
    try {
      const newTokens = await refreshSpotifyToken(tokenData.refresh_token)
      
      // Update database
      await supabaseClient
        .from('spotify_tokens')
        .update({
          access_token: newTokens.access_token,
          expires_at: Date.now() + (newTokens.expires_in * 1000),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      return newTokens.access_token
    } catch (error) {
      console.error('Failed to refresh Spotify token:', error)
      return null
    }
  }

  return tokenData.access_token
}

async function refreshSpotifyToken(refreshToken: string) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh Spotify token')
  }

  return await response.json()
}

export async function checkSpotifyConnection(userId: string, supabaseClient: any): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from('spotify_tokens')
    .select('user_id')
    .eq('user_id', userId)
    .single()

  return !error && !!data
}
