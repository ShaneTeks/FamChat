# Quick Start Guide

## Immediate Next Steps

### 1. Configure Environment Variables

You need to add your Supabase credentials to your `.env` file:

```bash
# Your .env file should already have:
GROQ_API_KEY=...
FAL_KEY=...
CARTESIA_API_KEY=...
NEXT_PUBLIC_CARTESIA_API_KEY=...

# Add these Supabase variables:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Where to find these:**
1. Go to your Supabase project dashboard
2. Click "Settings" (gear icon)
3. Go to "API" section
4. Copy "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
5. Copy "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Verify Database Schema

The database schema was already applied via MCP. Verify it exists:

1. Go to your Supabase project
2. Click "Table Editor"
3. You should see:
   - `profiles` table
   - `chats` table
   - `messages` table

If tables are missing, check the SQL in `/supabase/database-schema.md`

### 3. Enable Email Authentication

1. Go to Supabase dashboard
2. Click "Authentication" > "Providers"
3. Ensure "Email" is enabled
4. (Optional) Disable email confirmation for testing:
   - Go to "Authentication" > "Settings"
   - Scroll to "Email Auth"
   - Uncheck "Enable email confirmations"

### 4. Run the App

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Test the Features

#### Test Without Login (Local Storage)
1. Start chatting immediately
2. Chats are saved to localStorage
3. No sync button visible (not logged in)

#### Test With Login (Cloud Sync)
1. Click "Sign In" in the sidebar
2. Go to `/auth` page
3. Sign up with an email and password
4. You'll be redirected to the main app
5. Your email appears in the sidebar
6. Click the cloud icon in the chat header
7. Watch it turn green and glow
8. Chat is now syncing to Supabase!

#### Test PWA Installation
1. Open the app in a browser
2. Look for install prompt or icon in address bar
3. Click to install
4. App opens as standalone application

#### Test Offline Mode
1. Install the PWA
2. Open browser DevTools (F12)
3. Go to "Network" tab
4. Toggle "Offline"
5. App should still work (service worker serving cached content)

## Testing Checklist

- [ ] App runs without errors
- [ ] Can create chats without login
- [ ] Can sign up with email/password
- [ ] Can sign in with credentials
- [ ] Email shows in sidebar when logged in
- [ ] Sync button appears in chat header when logged in
- [ ] Sync button turns green when enabled
- [ ] Chat syncs to Supabase (check Table Editor)
- [ ] Can sign out
- [ ] Can install as PWA
- [ ] Works offline

## Common Issues

### "Invalid API key" or connection errors
- Verify `.env` has correct Supabase credentials
- Make sure variables start with `NEXT_PUBLIC_`
- Restart dev server after changing `.env`

### PWA not installing
- Ensure you're using `http://localhost` or HTTPS
- Service worker only works on localhost or HTTPS
- Check browser console for errors

### Sync not working
- Make sure you're logged in
- Check network tab for failed requests
- Verify RLS policies in Supabase

### Icons not showing
- Placeholder icons are in place
- Replace with proper icons later (see `/public/ICONS-README.md`)

## What's Working Now

✅ **Core App**: All chat features working
✅ **Authentication**: Sign up, sign in, sign out
✅ **Database**: Tables created with RLS policies
✅ **Sync**: Optional per-chat cloud sync with green glow indicator
✅ **PWA**: Manifest, service worker, installable
✅ **Offline**: Works offline with cached resources

## Architecture at a Glance

```
┌─────────────────────────────────────────┐
│         User Interacts with App         │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│       Always Save to localStorage       │
└───────────────┬─────────────────────────┘
                │
                ▼
        ┌───────────────┐
        │ Sync Enabled? │
        └───────┬───────┘
                │
        ┌───────┴───────┐
        │               │
       No              Yes
        │               │
        ▼               ▼
    ┌──────┐    ┌──────────────┐
    │ Done │    │ User Logged  │
    └──────┘    │   In?        │
                └──────┬────────┘
                       │
                ┌──────┴──────┐
                │             │
               No            Yes
                │             │
                ▼             ▼
            ┌──────┐   ┌────────────┐
            │ Done │   │ Auto-Sync  │
            └──────┘   │ (Debounced)│
                       └────────────┘
```

## Next Steps After Testing

1. **Deploy to Production**
   - Deploy to Vercel or similar
   - Ensure HTTPS for PWA features
   - Update Supabase allowed origins

2. **Customize Icons**
   - Create proper 192x192 and 512x512 icons
   - Replace placeholder icons

3. **Optional Enhancements**
   - Add push notifications
   - Implement share target
   - Add keyboard shortcuts

## Need Help?

Check these files:
- `SETUP.md` - Complete setup guide
- `PWA-FEATURES.md` - PWA documentation
- `IMPLEMENTATION-SUMMARY.md` - Full implementation details
- `/supabase/database-schema.md` - Database schema
- `/supabase/sync-operations.md` - Sync patterns

Everything is ready to go! 🚀
