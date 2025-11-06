import { getUserSpotifyToken } from '@/lib/spotify-user-auth'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  try {
    // Get auth token from header
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return new Response(JSON.stringify({ 
        error: 'NOT_AUTHENTICATED',
        message: 'Please sign in to use Spotify features',
        requiresAuth: true
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create Supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )
    
    // Verify the token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return new Response(JSON.stringify({ 
        error: 'NOT_AUTHENTICATED',
        message: 'Invalid session',
        requiresAuth: true
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get user's Spotify token
    const spotifyToken = await getUserSpotifyToken(user.id, supabase)
    
    if (!spotifyToken) {
      return new Response(JSON.stringify({ 
        error: 'SPOTIFY_NOT_CONNECTED',
        message: 'Please connect your Spotify account to control playback',
        requiresSpotifyAuth: true,
        loginUrl: '/api/spotify/login'
      }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const url = 'https://api.spotify.com/v1/me/player/currently-playing'
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${spotifyToken}`,
      },
    })

    // 204 No Content means nothing is playing
    if (response.status === 204) {
      return new Response(JSON.stringify({ 
        isPlaying: false,
        message: 'Nothing is currently playing'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Spotify API error:', response.status, errorText)
      return new Response(JSON.stringify({ 
        error: 'Failed to get currently playing track',
        status: response.status 
      }), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error getting currently playing:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
