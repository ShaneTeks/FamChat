import { getSpotifyAccessToken } from '@/lib/spotify-auth'

export async function POST(req: Request) {
  try {
    const { query, type = 'track,album,artist' } = await req.json()
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const spotifyToken = await getSpotifyAccessToken()

    const encodedQuery = encodeURIComponent(query)
    const url = `https://api.spotify.com/v1/search?q=${encodedQuery}&type=${type}&limit=10`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${spotifyToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Spotify API error:', response.status, errorText)
      return new Response(JSON.stringify({ 
        error: 'Failed to search Spotify',
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
    console.error('Error searching Spotify:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
