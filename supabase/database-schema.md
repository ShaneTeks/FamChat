# FamChat Database Schema

## Tables

### `public.profiles`
User profile information extending Supabase auth.users
- `id` (UUID, PK): References auth.users(id)
- `email` (TEXT): User email
- `created_at` (TIMESTAMP): Profile creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

### `public.chats`
Chat conversations for each user
- `id` (TEXT, PK): Unique chat identifier
- `user_id` (UUID, FK): References auth.users(id)
- `title` (TEXT): Chat title/name
- `is_favorite` (BOOLEAN): Favorite status
- `created_at` (BIGINT): Chat creation timestamp (milliseconds)
- `updated_at` (BIGINT): Last update timestamp (milliseconds)
- `synced_at` (TIMESTAMP): Last sync to database timestamp

### `public.messages`
Individual messages within chats
- `id` (TEXT, PK): Unique message identifier
- `chat_id` (TEXT, FK): References public.chats(id)
- `role` (TEXT): Message role ('user' or 'assistant')
- `content` (TEXT): Message content
- `timestamp` (BIGINT): Message timestamp (milliseconds)
- `image_url` (TEXT): Generated image URL (optional)
- `image_width` (INTEGER): Image width (optional)
- `image_height` (INTEGER): Image height (optional)
- `is_generating_image` (BOOLEAN): Image generation status

## Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only:
- View their own data
- Insert data associated with their account
- Update their own data
- Delete their own data

## Indexes

- `idx_chats_user_id`: Fast lookup of chats by user
- `idx_chats_updated_at`: Fast sorting by update time
- `idx_messages_chat_id`: Fast lookup of messages by chat
- `idx_messages_timestamp`: Fast sorting of messages by time

## Triggers

- `on_auth_user_created`: Automatically creates a profile entry when a new user signs up
