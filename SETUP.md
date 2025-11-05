# FamChat Setup Guide

## Prerequisites

1. Node.js 18+ installed
2. Supabase account (free tier works)
3. API keys for Groq, FAL.ai, and Cartesia

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Fill in your environment variables in `.env`:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   FAL_KEY=your_fal_ai_api_key_here
   CARTESIA_API_KEY=your_cartesia_api_key_here
   NEXT_PUBLIC_CARTESIA_API_KEY=your_cartesia_api_key_here
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Supabase Configuration

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Copy the Project URL and Anon Key from Settings > API

### 2. Database Schema

The database schema has already been applied via MCP. You should have:
- `profiles` table
- `chats` table
- `messages` table
- Row Level Security (RLS) policies
- Automatic profile creation trigger

### 3. Enable Email Authentication

1. Go to Authentication > Providers in Supabase dashboard
2. Enable Email provider
3. Configure email templates if desired

## Installation

```bash
npm install --legacy-peer-deps
```

## Running the App

### Development
```bash
npm run dev
```

Visit `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## PWA Installation

### On Desktop (Chrome/Edge):
1. Visit your deployed app
2. Look for the install icon in the address bar
3. Click "Install"

### On Mobile:
1. Visit your app in Safari (iOS) or Chrome (Android)
2. Tap the share button
3. Select "Add to Home Screen"

## Features

### Authentication
- Email/password authentication via Supabase
- Sign in/sign up from the auth page (`/auth`)
- Sign out from the sidebar

### Chat Sync
- **Device-first storage**: All chats are saved to localStorage by default
- **Optional cloud sync**: Click the sync button (cloud icon) in the chat header to enable syncing to Supabase
- **Green glow indicator**: When sync is enabled, the cloud icon glows green
- **Automatic syncing**: When sync is enabled, changes are automatically saved to Supabase
- **Offline support**: Chats work offline and sync when connection is restored

### PWA Features
- Install on mobile and desktop
- Offline support via service worker
- App-like experience
- Fast loading with caching

## Troubleshooting

### Service Worker Issues
Clear your browser cache and service workers:
1. Open DevTools (F12)
2. Go to Application > Service Workers
3. Click "Unregister"
4. Reload the page

### Supabase Connection Issues
- Verify your environment variables are correct
- Check Supabase project status
- Ensure RLS policies are properly configured

### PWA Not Installing
- Ensure you're using HTTPS (required for PWA)
- Check that manifest.json is accessible
- Verify service worker is registered

## Development Notes

- Chats are stored in localStorage as `ai-chats`
- Settings are stored in localStorage as `app-settings`
- Theme preference is stored as `famchat-theme`
- Service worker caches static assets for offline use
