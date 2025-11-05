# Authentication & Branding Updates

## Changes Summary

### 1. **Authentication Required**
- Users must sign in before accessing the app
- No user is logged in → redirected to `/auth` page
- Only sign-in functionality (no sign-up)
- Users must be manually created in Supabase dashboard

### 2. **Sign-Up Removed**
- Auth page now shows only sign-in form
- Removed sign-up tab and functionality
- Removed `signUp` from auth context
- Users are created manually in Supabase Auth dashboard

### 3. **Branding Updated: FamChat → Raimond**
All references updated across the application:
- App title: "Raimond"
- PWA manifest name: "Raimond - AI Chat Assistant"
- Page metadata and descriptions
- Theme storage key: `raimond-theme`
- Service worker cache: `raimond-v1`

### 4. **Logo & Icon Updates**
- Favicon: Using `/public/favicon.png`
- App logo: Dynamic based on theme
  - Light mode: `/public/light-logo.svg`
  - Dark mode: `/public/dark-logo.svg`
- Logo displays on login page with theme switching

## Files Modified

### Authentication Changes
- `app/auth/page.tsx` - Simplified to sign-in only, added logo
- `contexts/auth-context.tsx` - Removed signUp functionality
- `app/page.tsx` - Added redirect for unauthenticated users
- `components/chat-sidebar.tsx` - Removed sign-in button

### Branding Changes
- `app/layout.tsx` - Updated title, favicon, theme key
- `public/manifest.json` - Updated app name and description
- `public/sw.js` - Updated cache name

## How to Create Users

Since sign-up is disabled, create users manually in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Click **"Add user"** button
4. Enter:
   - Email address
   - Password (auto-generate or create)
5. Optional: Disable email confirmation for immediate access
6. Click **"Create user"**

The user can now sign in with these credentials!

## User Experience Flow

### Before (with sign-up):
1. User opens app
2. Can use locally without authentication
3. Optional sign-in/sign-up for sync

### After (authentication required):
1. User opens app
2. **Redirected to sign-in page**
3. Must sign in to access the app
4. All chats automatically sync to cloud

## Testing

1. Clear your local storage
2. Visit `http://localhost:3000`
3. Should redirect to `/auth`
4. Sign in with a user you created in Supabase
5. Should redirect to main app with chats loaded

## Important Notes

- **No public sign-up** - App is for personal/family use only
- **Authentication required** - No guest/anonymous access
- **Manual user creation** - All users created via Supabase dashboard
- **Auto-sync enabled** - All chats sync to cloud when authenticated
- **Theme-aware logo** - Logo changes based on light/dark mode

## Security

- User credentials managed by Supabase Auth
- Row Level Security (RLS) enforces data isolation
- Users can only see their own chats and messages
- Sign-out functionality available in sidebar

## Next Steps

1. Create user accounts in Supabase dashboard
2. Share credentials with family members
3. Each user signs in with their unique account
4. Chats are automatically synced and private per user
