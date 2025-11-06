// Spotify authentication helper
// Handles OAuth Client Credentials Flow to get access tokens

let cachedToken: string | null = null
let tokenExpiry: number = 0

export async function getSpotifyAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured')
  }

  // Encode credentials as base64
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get Spotify access token: ${response.status} ${error}`)
  }

  const data = await response.json()
  
  // Cache the token (expires in 3600 seconds, refresh 5 minutes early)
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000

  return data.access_token
}
