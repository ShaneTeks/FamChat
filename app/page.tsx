"use client"

import { useState, useEffect } from "react"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatInterface } from "@/components/chat-interface"
import type { Chat } from "@/lib/types"
import { generateId } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const isMobile = useIsMobile()

  // Auto-close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  useEffect(() => {
    const savedChats = localStorage.getItem("ai-chats")
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats)
      setChats(parsedChats)
      if (parsedChats.length > 0) {
        setCurrentChatId(parsedChats[0].id)
      }
    } else {
      // Create initial chat
      const initialChat: Chat = {
        id: generateId(),
        title: "New Chat",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setChats([initialChat])
      setCurrentChatId(initialChat.id)
      localStorage.setItem("ai-chats", JSON.stringify([initialChat]))
    }
  }, [])

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("ai-chats", JSON.stringify(chats))
    }
  }, [chats])

  const currentChat = chats.find((chat) => chat.id === currentChatId)

  const createNewChat = () => {
    const newChat: Chat = {
      id: generateId(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setChats([newChat, ...chats])
    setCurrentChatId(newChat.id)
  }

  const deleteChat = (chatId: string) => {
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
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
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        isMobile={isMobile}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {currentChat ? (
          <ChatInterface
            chat={currentChat}
            onUpdateChat={updateChat}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
            isMobile={isMobile}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-(--color-text-secondary)">No chat selected</p>
          </div>
        )}
      </div>
    </div>
  )
}
