# Spotify User Auth - Local Testing Setup

## Quick Start (5 minutes)

### 1. Update Spotify Dashboard
1. Go to https://developer.spotify.com/dashboard
2. Click on your app
3. Click "Edit Settings"
4. Under **Redirect URIs**, add:
   ```
   http://localhost:3000/api/spotify/callback
   ```
5. Click "Save"

### 2. Update `.env`
Add this line to your `.env` file:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Your `.env` should now have:
```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Database Migration
In your Supabase SQL Editor, run the migration:
```sql
-- File: supabase/add_spotify_tokens.sql
CREATE TABLE IF NOT EXISTS spotify_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE spotify_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own Spotify tokens"
  ON spotify_tokens
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_spotify_tokens_user_id ON spotify_tokens(user_id);
```

### 4. Start Your App
```bash
npm run dev
```

## How It Works

### User Flow:
1. **You ask AI**: "Play some music on my PC"
2. **AI tries to access Spotify** → Realizes you're not connected
3. **Dialog appears**: "Connect Spotify" prompt
4. **You click "Connect"** → Redirected to Spotify login
5. **You authorize** → Spotify redirects back to your app
6. **Tokens stored** → Now AI can control your Spotify!

### What Happens Behind the Scenes:
```
User Request
    ↓
AI calls /api/spotify-play
    ↓
API checks for user's Spotify token
    ↓
No token found → Returns error with requiresSpotifyAuth: true
    ↓
Chat interface detects error
    ↓
Shows "Connect Spotify" dialog
    ↓
User clicks "Connect with Spotify"
    ↓
Redirects to /api/spotify/login
    ↓
Redirects to Spotify authorization
    ↓
User authorizes
    ↓
Spotify redirects to /api/spotify/callback
    ↓
Callback exchanges code for tokens
    ↓
Tokens stored in spotify_tokens table
    ↓
User redirected back to chat
    ↓
Next request works! 🎉
```

## Testing

### Test 1: Search (Works Without Auth)
```
You: "Search Spotify for Taylor Swift"
AI: [Shows search results]
```
✅ This works with Client Credentials (no user auth needed)

### Test 2: Playback Control (Requires Auth)
```
You: "Play some music on my PC"
AI: "I need access to your Spotify account..."
[Dialog appears: "Connect Spotify"]
You: [Click "Connect with Spotify"]
[Redirected to Spotify → Authorize → Back to app]
You: "Play some music on my PC"
AI: [Starts playback] ✅
```

### Test 3: Currently Playing
```
You: "What's playing on Spotify?"
[If not connected, shows dialog]
[If connected, shows current track]
```

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure you added `http://localhost:3000/api/spotify/callback` to Spotify Dashboard
- Check that `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env`

### "Not authenticated" error
- Make sure you're signed in to Raimond (your Supabase auth)
- The Spotify auth is per-user, so you need to be logged in first

### Tokens not saving
- Check Supabase SQL Editor for errors
- Make sure the `spotify_tokens` table was created
- Check RLS policies are enabled

### Dialog doesn't appear
- Check browser console for errors
- Make sure `SpotifyConnectDialog` component is imported

## Files Created

### New Files:
- `lib/spotify-user-auth.ts` - User token management
- `app/api/spotify/login/route.ts` - Initiates OAuth
- `app/api/spotify/callback/route.ts` - Handles OAuth callback
- `components/spotify-connect-dialog.tsx` - Connect UI
- `supabase/add_spotify_tokens.sql` - Database migration

### Modified Files:
- `app/api/spotify-current/route.ts` - Uses user tokens
- `app/api/spotify-devices/route.ts` - Uses user tokens
- `app/api/spotify-play/route.ts` - Uses user tokens
- `components/chat-interface.tsx` - Shows dialog when needed

## Next Steps

Once you've tested locally and it works:

1. **Deploy to production**:
   - Update Spotify Dashboard with production redirect URI
   - Update `NEXT_PUBLIC_APP_URL` to your production domain

2. **Add more features**:
   - Pause/resume playback
   - Skip tracks
   - Adjust volume
   - Queue management

3. **UI improvements**:
   - Show connected status in settings
   - Disconnect button
   - Show current device

## Important Notes

- **One-time setup**: Users only need to connect once
- **Tokens refresh automatically**: Access tokens expire in 1 hour but are auto-refreshed
- **Spotify Premium**: Some playback features require Spotify Premium
- **Active device**: User needs an active Spotify device (phone, desktop app, web player)
