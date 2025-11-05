# Bug Fix: TTS Unicode Encoding Error

## Issue
**Error**: `InvalidCharacterError: Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range.`

**Location**: `components/chat-message.tsx:48`

**Cause**: The `btoa()` function only supports Latin1 (ISO-8859-1) characters. When message content contains Unicode characters (emojis, special characters, non-Latin scripts), `btoa()` throws an error.

## Root Cause Analysis

The TTS feature was using `btoa()` to encode message content for creating cache keys:

```typescript
const cacheKey = `tts_${settings.ttsProvider}_${btoa(message.content).slice(0, 50)}`;
```

This fails when `message.content` includes:
- Emojis (😀, 🎉, etc.)
- Special Unicode characters (™, ©, ®, etc.)
- Non-Latin scripts (中文, العربية, हिन्दी, etc.)
- Mathematical symbols (∑, ∫, √, etc.)

## Solution

Implemented a `safeEncode()` helper function with two strategies:

### Strategy 1: Unicode-Safe Base64 Encoding
```typescript
btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
  return String.fromCharCode(parseInt(p1, 16));
}))
```

This works by:
1. `encodeURIComponent()` - Converts Unicode to percent-encoded ASCII
2. `.replace()` - Converts percent-encoding back to bytes
3. `btoa()` - Safely encodes the byte string

### Strategy 2: Hash Fallback
If encoding still fails, generate a simple hash:
```typescript
let hash = 0;
for (let i = 0; i < str.length; i++) {
  const char = str.charCodeAt(i);
  hash = ((hash << 5) - hash) + char;
  hash = hash & hash;
}
return Math.abs(hash).toString(36);
```

This ensures the cache key is always generated, even with problematic characters.

## Benefits

✅ **No More Crashes**: Handles all Unicode characters gracefully
✅ **Backward Compatible**: Existing cache keys still work
✅ **Fallback Protection**: Hash-based fallback prevents any encoding failure
✅ **Performance**: Minimal overhead, only encodes when needed

## Testing

Test with various message types:
- ✅ Plain English text
- ✅ Text with emojis: "Hello 👋 World 🌍"
- ✅ Special characters: "Price: $99.99™"
- ✅ Non-Latin scripts: "你好世界"
- ✅ Mathematical symbols: "∑ x² = 100"
- ✅ Mixed content: "AI Chat 🤖 with Unicode™"

## Files Modified

- `components/chat-message.tsx` - Added `safeEncode()` helper function

## Impact

- **User Experience**: TTS button now works with all message types
- **Cache**: Existing cached audio remains valid
- **Stability**: No more console errors or crashes

## Future Improvements

Consider:
1. Move `safeEncode()` to a utility file for reuse
2. Use Web Crypto API for more robust hashing
3. Implement cache versioning for better management

## Related

This fix applies to the TTS (Text-to-Speech) feature that caches audio in localStorage. The cache key needs to be unique per message content and TTS provider settings.
