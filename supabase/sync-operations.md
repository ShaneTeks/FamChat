# Chat Sync Operations

This document tracks the sync operations and patterns used in FamChat.

## Sync Service Methods

### `syncChat(chat: Chat, userId: string): Promise<boolean>`
Syncs a single chat to Supabase.

**Operations:**
1. Upserts chat to `public.chats` table
2. Deletes existing messages for the chat
3. Inserts all current messages

**Returns:** `true` if successful, `false` if error

**Usage:**
```typescript
const success = await SyncService.syncChat(chat, user.id)
```

### `loadChatsFromSupabase(userId: string): Promise<Chat[]>`
Loads all chats for a user from Supabase.

**Operations:**
1. Fetches chats for user_id
2. Fetches all messages for those chats
3. Groups messages by chat_id
4. Combines chats with their messages

**Returns:** Array of Chat objects with sync enabled

**Usage:**
```typescript
const remoteChats = await SyncService.loadChatsFromSupabase(user.id)
```

### `deleteChat(chatId: string): Promise<boolean>`
Deletes a chat from Supabase.

**Operations:**
1. Deletes from `public.chats` (messages cascade delete)

**Returns:** `true` if successful, `false` if error

**Usage:**
```typescript
const success = await SyncService.deleteChat(chatId)
```

### `mergeChats(localChats: Chat[], remoteChats: Chat[]): Chat[]`
Merges local and remote chats, preferring newer versions.

**Logic:**
1. Create map of all local chats
2. For each remote chat:
   - If not in local, add it
   - If in local, use the one with latest updatedAt
3. Sort by updatedAt descending

**Returns:** Merged array of Chat objects

**Usage:**
```typescript
const merged = SyncService.mergeChats(localChats, remoteChats)
```

## Sync Patterns

### Initial Load
```typescript
// On app load with authenticated user
const localChats = JSON.parse(localStorage.getItem("ai-chats") || "[]")
const remoteChats = await SyncService.loadChatsFromSupabase(user.id)
const mergedChats = SyncService.mergeChats(localChats, remoteChats)
setChats(mergedChats)
localStorage.setItem("ai-chats", JSON.stringify(mergedChats))
```

### Enable Sync
```typescript
// When user clicks sync button
updateChat(currentChat.id, { syncEnabled: true })
const success = await SyncService.syncChat(
  { ...currentChat, syncEnabled: true },
  user.id
)
if (success) {
  updateChat(currentChat.id, { lastSyncedAt: Date.now() })
}
```

### Auto-Sync
```typescript
// Debounced auto-sync for enabled chats
useEffect(() => {
  const syncEnabledChats = chats.filter(chat => chat.syncEnabled)
  if (syncEnabledChats.length > 0 && user) {
    const timer = setTimeout(async () => {
      for (const chat of syncEnabledChats) {
        await SyncService.syncChat(chat, user.id)
      }
    }, 1000)
    return () => clearTimeout(timer)
  }
}, [chats, user])
```

### Delete with Sync
```typescript
// When deleting a synced chat
const chatToDelete = chats.find(c => c.id === chatId)
if (user && chatToDelete?.syncEnabled) {
  await SyncService.deleteChat(chatId)
}
// Then delete locally
const updatedChats = chats.filter((chat) => chat.id !== chatId)
setChats(updatedChats)
```

## Database Queries

### Sync Chat
```sql
-- Upsert chat
INSERT INTO public.chats (id, user_id, title, is_favorite, created_at, updated_at, synced_at)
VALUES ($1, $2, $3, $4, $5, $6, NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  is_favorite = EXCLUDED.is_favorite,
  updated_at = EXCLUDED.updated_at,
  synced_at = NOW();

-- Delete old messages
DELETE FROM public.messages WHERE chat_id = $1;

-- Insert messages
INSERT INTO public.messages (id, chat_id, role, content, timestamp, image_url, image_width, image_height, is_generating_image, weather_widget, forecast_widget)
VALUES ...;
```

### Load Chats
```sql
-- Get chats
SELECT * FROM public.chats
WHERE user_id = $1
ORDER BY updated_at DESC;

-- Get messages
SELECT * FROM public.messages
WHERE chat_id = ANY($1)
ORDER BY timestamp ASC;
```

### Delete Chat
```sql
DELETE FROM public.chats WHERE id = $1;
-- Messages cascade delete automatically
```

## RLS Policies

All operations are secured by Row Level Security:

### Chats Table
- **SELECT**: `auth.uid() = user_id`
- **INSERT**: `auth.uid() = user_id`
- **UPDATE**: `auth.uid() = user_id`
- **DELETE**: `auth.uid() = user_id`

### Messages Table
- **SELECT**: Via chat ownership check
- **INSERT**: Via chat ownership check
- **UPDATE**: Via chat ownership check
- **DELETE**: Via chat ownership check

## Error Handling

All sync operations include try-catch blocks and return boolean success indicators:

```typescript
try {
  // Sync operation
  return true
} catch (error) {
  console.error('Sync error:', error)
  return false
}
```

## Performance Considerations

1. **Debouncing**: Auto-sync is debounced to avoid excessive database calls
2. **Batch Operations**: Messages are inserted in batch for efficiency
3. **Indexes**: Database indexes on user_id, chat_id, and timestamps
4. **Selective Sync**: Only enabled chats are synced
5. **Local First**: All operations update localStorage immediately

## Future Improvements

Potential enhancements:
- Incremental sync (only changed messages)
- Conflict resolution for simultaneous edits
- Background sync API for better offline support
- Optimistic updates with rollback
- Sync status per chat (last synced, errors, etc.)
