# How to Enable Spotify Playback Control (User Authentication)

## What You Need to Do

To enable your AI to control Spotify playback on specific devices and access user data, you need to implement **Authorization Code Flow** instead of the current Client Credentials Flow.

## Overview: What Changes

### Current Setup (Client Credentials):
- ✅ Search Spotify catalog
- ✅ Display playlist embeds
- ❌ No user data access
- ❌ No playback control

### After Adding User Auth (Authorization Code):
- ✅ Everything above, PLUS:
- ✅ See what's currently playing
- ✅ List user's Spotify devices
- ✅ Control playback (play, pause, skip, etc.)
- ✅ Access user's playlists and library

## Required Scopes

You'll need to request these permissions from users:

```javascript
const scopes = [
  'user-read-playback-state',      // Read what's playing, devices
  'user-modify-playback-state',    // Control playback
  'user-read-currently-playing',   // Get current track
].join(' ')
```

## Implementation Steps

### 1. Update Spotify Dashboard Settings

1. Go to your app at https://developer.spotify.com/dashboard
2. Click "Edit Settings"
3. Add **Redirect URIs**:
   ```
   http://localhost:3000/api/spotify/callback
   https://yourdomain.com/api/spotify/callback
   ```
4. Save settings

### 2. Add New Environment Variables

Update your `.env`:
```env
# Existing
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

# New
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_secret_here
```

Generate secret:
```bash
openssl rand -base64 32
```

### 3. Create Database Tables (if using Supabase)

You'll need to store user-specific Spotify tokens:

```sql
-- Add to supabase/migrations
CREATE TABLE spotify_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE spotify_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tokens
CREATE POLICY "Users can manage own Spotify tokens"
  ON spotify_tokens
  FOR ALL
  USING (auth.uid() = user_id);
```

### 4. Create Auth Routes

**File: `app/api/spotify/login/route.ts`**
```typescript
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const state = generateRandomString(16)
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

  // Store state in session/cookie for validation
  const response = new Response(null, {
    status: 302,
    headers: {
      Location: `https://accounts.spotify.com/authorize?${params}`,
      'Set-Cookie': `spotify_auth_state=${state}; Path=/; HttpOnly; SameSite=Lax`,
    },
  })

  return response
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
```

**File: `app/api/spotify/callback/route.ts`**
```typescript
import { NextRequest } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { getServerSession } from 'next-auth' // or your auth solution

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Validate state matches what we sent
  const storedState = request.cookies.get('spotify_auth_state')?.value
  
  if (error || !code || state !== storedState) {
    return new Response('Authentication failed', { status: 400 })
  }

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
    return new Response('Failed to get tokens', { status: 500 })
  }

  const tokens = await tokenResponse.json()
  
  // Store tokens in database (associated with current user)
  const session = await getServerSession() // Get your user session
  const supabase = getSupabaseClient()
  
  await supabase.from('spotify_tokens').upsert({
    user_id: session.user.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + (tokens.expires_in * 1000),
  })

  // Redirect back to app
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/?spotify_connected=true',
    },
  })
}
```

### 5. Create Token Management Helper

**File: `lib/spotify-user-auth.ts`**
```typescript
import { getSupabaseClient } from './supabase'

export async function getUserSpotifyToken(userId: string): Promise<string> {
  const supabase = getSupabaseClient()
  
  // Get user's tokens from database
  const { data: tokenData, error } = await supabase
    .from('spotify_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !tokenData) {
    throw new Error('Spotify not connected. User needs to authorize.')
  }

  // Check if token is expired or about to expire (5 min buffer)
  if (Date.now() >= tokenData.expires_at - 300000) {
    // Refresh the token
    const newTokens = await refreshSpotifyToken(tokenData.refresh_token)
    
    // Update database
    await supabase
      .from('spotify_tokens')
      .update({
        access_token: newTokens.access_token,
        expires_at: Date.now() + (newTokens.expires_in * 1000),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    return newTokens.access_token
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
```

### 6. Update API Routes to Use User Tokens

Update your existing routes to check for user tokens first:

```typescript
// app/api/spotify-current/route.ts
import { getUserSpotifyToken } from '@/lib/spotify-user-auth'
import { getServerSession } from 'next-auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ 
        error: 'Not authenticated' 
      }), { status: 401 })
    }

    // Get user's Spotify token
    const spotifyToken = await getUserSpotifyToken(session.user.id)

    const url = 'https://api.spotify.com/v1/me/player/currently-playing'
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${spotifyToken}`,
      },
    })

    // ... rest of your code
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Spotify not connected. Please authorize first.' 
    }), { status: 403 })
  }
}
```

### 7. Add UI for Spotify Connection

Add a settings page or button to connect Spotify:

```typescript
// components/spotify-connect-button.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Music } from 'lucide-react'

export function SpotifyConnectButton() {
  const connectSpotify = () => {
    window.location.href = '/api/spotify/login'
  }

  return (
    <Button onClick={connectSpotify} className="gap-2">
      <Music className="w-4 h-4" />
      Connect Spotify
    </Button>
  )
}
```

### 8. Handle Disconnected State Gracefully

Update your AI tools to provide helpful error messages:

```typescript
// When Spotify not connected
{
  error: 'SPOTIFY_NOT_CONNECTED',
  message: 'Please connect your Spotify account in Settings to control playback.',
  action: 'connect_spotify'
}
```

## User Flow

1. **User opens Raimond** → Sees option to "Connect Spotify"
2. **User clicks Connect** → Redirected to Spotify login
3. **User authorizes** → Spotify redirects back to your app
4. **Tokens stored** → Associated with user's Raimond account
5. **AI can now control playback** → Using user's Spotify account

## Testing

1. Add redirect URI in Spotify Dashboard
2. Implement login/callback routes
3. Test authorization flow:
   ```
   Visit: http://localhost:3000/api/spotify/login
   → Should redirect to Spotify
   → After login, should redirect back
   → Check database for stored tokens
   ```
4. Test playback control:
   ```
   Ask AI: "What's playing on Spotify?"
   Ask AI: "Play some music on my bedroom speaker"
   ```

## Important Notes

- **Tokens per user**: Each user needs their own Spotify authorization
- **Token expiry**: Access tokens expire in 1 hour, refresh tokens don't expire
- **Refresh tokens**: Must be securely stored and used to get new access tokens
- **Privacy**: Only access what user authorized via scopes
- **Spotify Premium**: Some playback features require Spotify Premium

## Simpler Alternative: Just Use Current Flow

If this seems too complex and you mainly want **search** and **playlists**:
- Keep the current Client Credentials Flow
- Remove the playback control tools from the AI
- Focus on search and playlist embeds (which work great!)

The user auth flow is mainly needed if playback control is a must-have feature.
