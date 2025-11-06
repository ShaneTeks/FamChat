import { getUserSpotifyToken } from '@/lib/spotify-user-auth'
import { createClient } from '@supabase/supabase-js'

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { context_uri, uris, offset, position_ms, device_id } = body
    
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

    // Build URL with optional device_id parameter
    let url = 'https://api.spotify.com/v1/me/player/play'
    if (device_id) {
      url += `?device_id=${device_id}`
    }
    
    // Build request body
    const requestBody: any = {}
    if (context_uri) requestBody.context_uri = context_uri
    if (uris) requestBody.uris = uris
    if (offset !== undefined) requestBody.offset = offset
    if (position_ms !== undefined) requestBody.position_ms = position_ms
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${spotifyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    // 204 No Content means success
    if (response.status === 204) {
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Playback started'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Spotify API error:', response.status, errorText)
      return new Response(JSON.stringify({ 
        error: 'Failed to start playback',
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
    console.error('Error starting playback:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
