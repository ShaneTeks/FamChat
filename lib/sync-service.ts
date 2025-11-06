import { supabase } from './supabase'
import type { Chat, Message } from './types'

export class SyncService {
  // Sync a chat to Supabase
  static async syncChat(chat: Chat, userId: string): Promise<boolean> {
    try {
      if (!chat.syncEnabled) {
        return false
      }

      // Upsert chat
      const { error: chatError } = await supabase
        .from('chats')
        .upsert({
          id: chat.id,
          user_id: userId,
          title: chat.title,
          is_favorite: chat.isFavorite || false,
          created_at: chat.createdAt,
          updated_at: chat.updatedAt,
          synced_at: new Date().toISOString(),
        })

      if (chatError) {
        console.error('Error syncing chat:', chatError)
        return false
      }

      // Delete existing messages for this chat
      await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chat.id)

      // Insert all messages
      if (chat.messages.length > 0) {
        const messagesData = chat.messages.map((msg: Message) => ({
          id: msg.id,
          chat_id: chat.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          image_url: msg.imageUrl,
          image_width: msg.imageWidth,
          image_height: msg.imageHeight,
          is_generating_image: msg.isGeneratingImage || false,
          weather_widget: msg.weatherWidget ? JSON.stringify(msg.weatherWidget) : null,
          forecast_widget: msg.forecastWidget ? JSON.stringify(msg.forecastWidget) : null,
        }))

        const { error: messagesError } = await supabase
          .from('messages')
          .insert(messagesData)

        if (messagesError) {
          console.error('Error syncing messages:', messagesError)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Sync error:', error)
      return false
    }
  }

  // Load all chats from Supabase for a user
  static async loadChatsFromSupabase(userId: string): Promise<Chat[]> {
    try {
      // Fetch chats
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (chatsError) {
        console.error('Error loading chats:', chatsError)
        return []
      }

      if (!chatsData || chatsData.length === 0) {
        return []
      }

      // Fetch all messages for these chats
      const chatIds = chatsData.map(chat => chat.id)
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .in('chat_id', chatIds)
        .order('timestamp', { ascending: true })

      if (messagesError) {
        console.error('Error loading messages:', messagesError)
        return []
      }

      // Group messages by chat_id
      const messagesByChat: Record<string, Message[]> = {}
      messagesData?.forEach(msg => {
        if (!messagesByChat[msg.chat_id]) {
          messagesByChat[msg.chat_id] = []
        }
        messagesByChat[msg.chat_id].push({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: msg.timestamp,
          imageUrl: msg.image_url,
          imageWidth: msg.image_width,
          imageHeight: msg.image_height,
          isGeneratingImage: msg.is_generating_image,
          weatherWidget: msg.weather_widget ? JSON.parse(msg.weather_widget) : undefined,
          forecastWidget: msg.forecast_widget ? JSON.parse(msg.forecast_widget) : undefined,
        })
      })

      // Combine chats with their messages
      const chats: Chat[] = chatsData.map(chat => ({
        id: chat.id,
        title: chat.title,
        messages: messagesByChat[chat.id] || [],
        createdAt: chat.created_at,
        updatedAt: chat.updated_at,
        isFavorite: chat.is_favorite,
        syncEnabled: true,
        lastSyncedAt: new Date(chat.synced_at).getTime(),
      }))

      return chats
    } catch (error) {
      console.error('Error loading chats:', error)
      return []
    }
  }

  // Delete a chat from Supabase
  static async deleteChat(chatId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)

      if (error) {
        console.error('Error deleting chat:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting chat:', error)
      return false
    }
  }

  // Merge local and remote chats (for initial sync)
  static mergeChats(localChats: Chat[], remoteChats: Chat[]): Chat[] {
    const merged = new Map<string, Chat>()

    // Add all local chats
    localChats.forEach(chat => {
      merged.set(chat.id, chat)
    })

    // Merge or add remote chats
    remoteChats.forEach(remoteChat => {
      const localChat = merged.get(remoteChat.id)
      
      if (!localChat) {
        // New chat from remote
        merged.set(remoteChat.id, remoteChat)
      } else {
        // Keep the one with the latest update
        if (remoteChat.updatedAt > localChat.updatedAt) {
          merged.set(remoteChat.id, remoteChat)
        }
      }
    })

    return Array.from(merged.values()).sort((a, b) => b.updatedAt - a.updatedAt)
  }
}
