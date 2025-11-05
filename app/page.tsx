"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { SettingsDialog } from "@/components/settings-dialog"
import { useAuth } from "@/contexts/auth-context"
import { SyncService } from "@/lib/sync-service"
import type { Chat } from "@/lib/types"
import { generateId } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sparkles, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const isMobile = useIsMobile()
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [authLoading, user, router])

  // Auto-close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  // Initial load: merge local and remote chats
  useEffect(() => {
    if (authLoading) return
    if (!user) return // Don't load if no user

    const loadChats = async () => {
      // Load from localStorage
      const savedChats = localStorage.getItem("ai-chats")
      let localChats: Chat[] = []
      
      if (savedChats) {
        try {
          localChats = JSON.parse(savedChats)
        } catch (e) {
          console.error('Failed to parse local chats:', e)
        }
      }

      // If user is logged in, load from Supabase and merge
      if (user) {
        try {
          const remoteChats = await SyncService.loadChatsFromSupabase(user.id)
          const mergedChats = SyncService.mergeChats(localChats, remoteChats)
          
          if (mergedChats.length > 0) {
            setChats(mergedChats)
            setCurrentChatId(mergedChats[0].id)
            localStorage.setItem("ai-chats", JSON.stringify(mergedChats))
          } else {
            createInitialChat()
          }
        } catch (error) {
          console.error('Error loading remote chats:', error)
          // Fall back to local chats
          if (localChats.length > 0) {
            setChats(localChats)
            setCurrentChatId(localChats[0].id)
          } else {
            createInitialChat()
          }
        }
      } else {
        // Not logged in, use local chats only
        if (localChats.length > 0) {
          setChats(localChats)
          setCurrentChatId(localChats[0].id)
        } else {
          createInitialChat()
        }
      }

      setInitialLoadComplete(true)
    }

    loadChats()
  }, [user, authLoading])

  const createInitialChat = () => {
    const initialChat: Chat = {
      id: generateId(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncEnabled: false,
    }
    setChats([initialChat])
    setCurrentChatId(initialChat.id)
    localStorage.setItem("ai-chats", JSON.stringify([initialChat]))
  }

  // Save to localStorage whenever chats change
  useEffect(() => {
    if (chats.length > 0 && initialLoadComplete) {
      localStorage.setItem("ai-chats", JSON.stringify(chats))
    }
  }, [chats, initialLoadComplete])

  // Auto-sync when chat updates if sync is enabled
  useEffect(() => {
    if (!user || !initialLoadComplete) return

    const syncEnabledChats = chats.filter(chat => chat.syncEnabled)
    
    if (syncEnabledChats.length > 0) {
      const syncChats = async () => {
        for (const chat of syncEnabledChats) {
          await SyncService.syncChat(chat, user.id)
        }
      }
      
      // Debounce sync
      const timer = setTimeout(() => {
        syncChats()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [chats, user, initialLoadComplete])

  const currentChat = chats.find((chat) => chat.id === currentChatId)

  const createNewChat = () => {
    const newChat: Chat = {
      id: generateId(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncEnabled: false,
    }
    setChats([newChat, ...chats])
    setCurrentChatId(newChat.id)
  }

  const deleteChat = async (chatId: string) => {
    const chatToDelete = chats.find(c => c.id === chatId)
    
    // Delete from Supabase if synced
    if (user && chatToDelete?.syncEnabled) {
      await SyncService.deleteChat(chatId)
    }

    const updatedChats = chats.filter((chat) => chat.id !== chatId)
    setChats(updatedChats)

    if (chatId === currentChatId) {
      setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null)
    }

    if (updatedChats.length === 0) {
      createNewChat()
    }
  }

  const updateChat = (chatId: string, updates: Partial<Chat>) => {
    console.log("updateChat called with:", chatId, updates)
    setChats(prevChats => prevChats.map((chat) => (chat.id === chatId ? { ...chat, ...updates, updatedAt: Date.now() } : chat)))
  }

  const toggleFavorite = (chatId: string) => {
    setChats(prevChats => 
      prevChats.map((chat) => 
        chat.id === chatId 
          ? { ...chat, isFavorite: !chat.isFavorite, updatedAt: Date.now() }
          : chat
      )
    )
  }

  const toggleSync = async () => {
    if (!user) {
      toast.error('Please sign in to enable sync')
      router.push('/auth')
      return
    }

    if (!currentChat) return

    const newSyncState = !currentChat.syncEnabled
    
    setIsSyncing(true)
    updateChat(currentChat.id, { syncEnabled: newSyncState })

    if (newSyncState) {
      // Sync to Supabase
      const success = await SyncService.syncChat(
        { ...currentChat, syncEnabled: true },
        user.id
      )
      
      if (success) {
        updateChat(currentChat.id, { lastSyncedAt: Date.now() })
        toast.success('Chat synced to cloud')
      } else {
        toast.error('Failed to sync chat')
        updateChat(currentChat.id, { syncEnabled: false })
      }
    } else {
      toast.info('Chat will be stored locally only')
    }

    setIsSyncing(false)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    // Keep local chats but disable sync
    setChats(prevChats => prevChats.map(chat => ({ ...chat, syncEnabled: false })))
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-(--color-background)">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-12 h-12 text-(--color-accent) animate-pulse" />
          <p className="text-(--color-text-secondary)">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-(--color-background)">
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        onToggleFavorite={toggleFavorite}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        isMobile={isMobile}
        onOpenSettings={() => setSettingsOpen(true)}
        user={user}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {currentChat ? (
          <ChatInterface
            chat={currentChat}
            onUpdateChat={updateChat}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
            isMobile={isMobile}
            onToggleSync={user ? toggleSync : undefined}
            isSyncing={isSyncing}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-(--color-text-secondary)">No chat selected</p>
          </div>
        )}
      </div>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
