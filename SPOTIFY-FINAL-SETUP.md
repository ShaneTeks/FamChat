# Spotify Integration - Final Setup

## ✅ What I Implemented

Instead of a confusing dialog popup, I created a **Settings page** where you manage Spotify connection.

### Changes Made:

1. **`app/settings/page.tsx`** - New Settings page with Integrations section
2. **`app/page.tsx`** - Settings button now navigates to `/settings`
3. **`app/api/chat/route.ts`** - AI now directs users to Settings when Spotify isn't connected
4. **All Spotify API routes** - Now properly authenticate using your session

## 🎯 How It Works Now

### **User Flow:**

1. You ask: "Play some music on my PC"
2. AI responds: *"To control Spotify playback, you need to connect your Spotify account first. Please go to Settings (click the gear icon in the sidebar) and connect your Spotify account under Integrations."*
3. You click **Settings (⚙️ icon)** in sidebar
4. Navigate to `/settings` page
5. See **Spotify Integration card** with status
6. Click **"Connect Spotify"**
7. Redirected to Spotify → Authorize
8. Redirected back to app
9. Status shows **"Connected ✅"**
10. Now you can control Spotify via AI!

## 📋 Setup Checklist

### 1. Spotify Dashboard
- [x] Go to https://developer.spotify.com/dashboard
- [x] Add redirect URI: `http://localhost:3000/api/spotify/callback`
- [x] Save settings

### 2. Environment Variables
Add to `.env`:
```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Migration
Run in Supabase SQL Editor:
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

## 🚀 Test It!

```bash
npm run dev
```

### Test Flow:

1. **Without Connection:**
   - Ask: "Play some music"
   - AI says: "Go to Settings to connect Spotify"
   - ✅ Clear instructions

2. **Connect Spotify:**
   - Click Settings (⚙️) in sidebar
   - Click "Connect Spotify" button
   - Authorize on Spotify
   - See "Connected ✅" status

3. **With Connection:**
   - Ask: "Play some music on my laptop"
   - AI calls `getSpotifyDevices`
   - Gets your devices
   - Starts playback
   - ✅ Works!

## 📱 Settings Page Features

**Shows:**
- ✅ Connection status (Connected/Not connected)
- ✅ Visual indicator with icons
- ✅ List of capabilities
- ✅ Connect/Disconnect button
- ✅ Back to Chat navigation

**Benefits:**
- Clear, professional UX
- One place for all integrations
- Easy to expand (can add more integrations later)
- Status always visible
- No confusing popups

## 🔧 Files Modified

### New Files:
- `app/settings/page.tsx` - Settings page UI

### Modified Files:
- `app/page.tsx` - Navigate to /settings
- `app/api/chat/route.ts` - AI instructions updated
- All Spotify API routes - Auth header forwarding

## 💡 Important Notes

1. **Auth Required**: You must be signed in to Raimond (Supabase auth)
2. **One-Time Setup**: Connect Spotify once, tokens persist
3. **Auto-Refresh**: Access tokens refresh automatically
4. **Premium Features**: Some playback requires Spotify Premium
5. **Active Device**: Need Spotify open somewhere (desktop, phone, web)

## 🎵 What Works

✅ **Search** - Works without connection (Client Credentials)
✅ **Playlist Embeds** - Display playlists
✅ **Get Devices** - After connecting
✅ **Currently Playing** - After connecting  
✅ **Playback Control** - After connecting

## 🐛 Troubleshooting

**"Not connected" in Settings?**
- Run the SQL migration in Supabase
- Make sure you're signed in to Raimond

**Redirect URI mismatch?**
- Check Spotify Dashboard has exact URL: `http://localhost:3000/api/spotify/callback`
- Check `.env` has: `NEXT_PUBLIC_APP_URL=http://localhost:3000`

**Can't see devices?**
- Open Spotify somewhere (desktop, phone, web player)
- Make sure you're playing something
- Spotify needs an active session

**AI still says "Could not get devices"?**
- Clear browser cache and reload
- Check connection status in Settings
- Try disconnecting and reconnecting

## 🎉 Ready!

Everything is set up. Just:
1. Add your Spotify credentials to `.env`
2. Run the database migration
3. Start the dev server
4. Go to Settings and connect!

Your AI can now control Spotify! 🎵
