# Progressive Web App (PWA) Features

## Overview

FamChat is now a fully-featured Progressive Web App that can be installed on both mobile devices and desktop computers.

## Key Features

### 📱 **Installable**
- Add FamChat to your home screen (mobile) or desktop
- Launch like a native app
- No app store required

### 🔌 **Offline Support**
- Works without an internet connection
- Service worker caches essential files
- Chats are saved locally first

### ⚡ **Fast Performance**
- Instant loading with cached resources
- Optimized for mobile networks
- Smooth animations and transitions

### 🔄 **Sync Options**
- **Local-first**: All data stored on device by default
- **Optional cloud sync**: Enable per-chat syncing to Supabase
- **Visual indicator**: Green glowing cloud icon when sync is active
- **Automatic syncing**: Changes sync in real-time when enabled

## Installation Guide

### Mobile (iOS)

1. Open Safari and navigate to your FamChat URL
2. Tap the Share button (square with arrow pointing up)
3. Scroll down and tap "Add to Home Screen"
4. Customize the name if desired
5. Tap "Add"

### Mobile (Android)

1. Open Chrome and navigate to your FamChat URL
2. Tap the menu button (three dots)
3. Tap "Add to Home Screen" or "Install App"
4. Confirm the installation

### Desktop (Chrome/Edge)

1. Navigate to your FamChat URL
2. Look for the install icon in the address bar (⊕ or computer icon)
3. Click the install button
4. Confirm the installation

### Desktop (Firefox)

1. Navigate to your FamChat URL
2. Click the menu button (three lines)
3. Select "Install FamChat"
4. Confirm the installation

## How Sync Works

### Without Authentication
- All chats stored locally on your device
- Fast and private
- No account required
- Data persists across sessions

### With Authentication
- Sign in to enable cloud sync
- Toggle sync per chat using the cloud button
- Green glow indicates active syncing
- Local storage is always maintained
- Sync happens automatically in background

### Sync Button States

#### 🔵 **Cloud Off (Grey)**
- Chat is stored locally only
- Not synced to Supabase
- Click to enable sync (requires login)

#### 🟢 **Cloud On (Green, Glowing)**
- Chat is actively syncing
- Changes saved to Supabase
- Click to disable and return to local-only

#### ⚪ **Syncing (Pulsing)**
- Currently uploading changes
- Brief animation during sync

## Technical Details

### Service Worker
- Caches app shell and static resources
- Serves cached content when offline
- Updates cache in background

### Manifest
- Defines app name, icons, and theme
- Controls display mode (standalone)
- Specifies start URL and orientation

### Storage Strategy
1. **Primary**: localStorage (always)
2. **Secondary**: Supabase (when sync enabled)
3. **Merge**: On login, local and cloud chats are merged

### Caching Strategy
- **Network First**: For API calls
- **Cache First**: For static assets
- **Stale While Revalidate**: For images

## Browser Compatibility

### ✅ Supported Browsers
- Chrome 67+
- Edge 79+
- Safari 11.1+
- Firefox 63+
- Samsung Internet 8.2+
- Opera 54+

### ⚠️ Partial Support
- Older mobile browsers may have limited PWA features
- Some features require HTTPS

## Permissions

### Required
- None! The app works without any special permissions

### Optional (Enhanced Features)
- **Notifications**: For future chat notifications (not yet implemented)
- **Storage**: Automatically managed by browser

## Best Practices

### For Users
1. Install the app for best experience
2. Enable sync if you use multiple devices
3. Keep the app updated (happens automatically)
4. Clear cache if you experience issues

### For Developers
1. Always test PWA features on actual devices
2. Test offline functionality
3. Verify manifest.json is correct
4. Check service worker registration
5. Use Lighthouse for PWA audits

## Troubleshooting

### App Won't Install
- Ensure you're using HTTPS
- Check that manifest.json is accessible
- Verify service worker is registered
- Try a different browser

### Sync Not Working
- Verify you're signed in
- Check internet connection
- Ensure Supabase credentials are correct
- Look for errors in browser console

### Offline Mode Issues
- Service worker may need to be re-registered
- Clear cache and reload
- Check browser DevTools > Application > Service Workers

## Future Enhancements

Potential future PWA features:
- Push notifications for chat updates
- Background sync for better offline support
- Share target API for sharing to FamChat
- File handling for drag-and-drop
- Shortcuts API for quick actions
