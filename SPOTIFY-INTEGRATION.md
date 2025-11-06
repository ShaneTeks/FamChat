# Spotify Integration

## Overview
The AI chat now includes Spotify integration with 4 tools and an embedded playlist widget.

## Setup

### 1. Create a Spotify App
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create app"
4. Fill in the app details (name, description)
5. Save your **Client ID** and **Client Secret**

### 2. Add Credentials to .env
Add your Spotify credentials to `.env`:
```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

The app automatically handles OAuth Client Credentials Flow to get access tokens (which expire every hour and are auto-refreshed).

## Features

### AI Tools
The AI has access to these Spotify tools:

#### 1. **searchSpotify**
- Search for tracks, albums, or artists
- Example: "Search for songs by Taylor Swift"

#### 2. **getCurrentlyPlaying**
- Check what's currently playing on Spotify
- Example: "What song is playing on Spotify?"

#### 3. **getSpotifyDevices**
- List available Spotify devices
- Example: "What Spotify devices are available?"

#### 4. **playSpotify**
- Start or resume playback
- Can play specific tracks, albums, or playlists
- Example: "Play the album spotify:album:5ht7ItJgpBH7W6vJ5BqpPr"

### Spotify Widget
When you ask the AI to display a Spotify playlist, it will embed an interactive player:

**Example requests:**
- "Show me this playlist: 3hWBzBUek4GeCjMQNAJKBp"
- "Display the Spotify playlist with ID 3hWBzBUek4GeCjMQNAJKBp"
- "Embed this playlist: https://open.spotify.com/playlist/3hWBzBUek4GeCjMQNAJKBp"

The AI will respond with an embedded Spotify player showing the playlist.

## Technical Details

### API Routes
- `/api/spotify-search` - Search Spotify catalog
- `/api/spotify-current` - Get currently playing track
- `/api/spotify-devices` - List available devices
- `/api/spotify-play` - Start/resume playback

### Components
- `components/spotify-widget.tsx` - Embedded Spotify player component
- `widgets/spotifyPlayer.widget` - Widget definition file

### Types
Added to `lib/types.ts`:
```typescript
export interface SpotifyWidget {
  playlistId: string
  theme?: '0' | '1'  // 0 = light, 1 = dark
  title?: string
}
```

### Response Format
For the AI to display a Spotify widget, it should respond with:
```json
{
  "type": "spotify",
  "playlistId": "3hWBzBUek4GeCjMQNAJKBp",
  "theme": "0",
  "title": "Optional Title",
  "message": "Here's your playlist!"
}
```

## Authentication Flow

The app uses **OAuth 2.0 Client Credentials Flow**:

1. Your Client ID + Client Secret are stored in `.env`
2. The `lib/spotify-auth.ts` helper exchanges them for an access token
3. Access tokens expire after 1 hour
4. Tokens are automatically cached and refreshed 5 minutes before expiry
5. All API requests use the current valid access token

## Important Notes

**Limitations of Client Credentials Flow:**
- ✅ Can search Spotify catalog
- ❌ Cannot access user-specific data (currently playing, devices, playback control)
- ❌ Cannot control playback

**For User-Specific Features:**
You would need to implement **Authorization Code Flow** which requires:
- User login and consent
- Redirect URIs configured in Spotify Dashboard
- Handling OAuth callback
- User-specific access tokens with proper scopes

**Current Working Features:**
- ✅ Search tracks, albums, artists
- ✅ Display playlist embeds
- ⚠️ Currently Playing, Devices, and Playback tools are implemented but require Authorization Code Flow

**Future Enhancement:**
To enable user playback control, you'd need to add Authorization Code Flow with scopes like:
- `user-read-playback-state`
- `user-modify-playback-state`
- `user-read-currently-playing`
