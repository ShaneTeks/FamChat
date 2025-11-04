"use client"

import type { Chat } from "@/lib/types"
import { MessageSquare, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  chats: Chat[]
  currentChatId: string | null
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
  onDeleteChat: (chatId: string) => void
  isOpen: boolean
  onToggle: () => void
  isMobile?: boolean
}

export function ChatSidebar({ chats, currentChatId, onSelectChat, onNewChat, onDeleteChat, isOpen, onToggle, isMobile = false }: ChatSidebarProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <aside
      className={cn(
        "flex flex-col bg-(--color-surface) border-r border-(--color-border) transition-all duration-300 ease-in-out",
        isMobile 
          ? cn(
              "fixed inset-y-0 left-0 z-50 w-72 transform shadow-xl",
              isOpen ? "translate-x-0" : "-translate-x-full"
            )
          : cn(
              "relative",
              isOpen ? "w-64" : "w-0 overflow-hidden"
            )
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-(--color-border)">
        <h2 className="text-lg font-semibold text-(--color-text-primary)">Chats</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewChat}
            className="flex items-center justify-center p-2 rounded-lg bg-(--color-primary) hover:bg-(--color-primary-hover) text-(--color-primary-foreground) transition-colors"
            aria-label="New chat"
          >
            <Plus className="w-4 h-4" />
          </button>
          {isMobile && (
            <button
              onClick={onToggle}
              className="flex items-center justify-center p-2 rounded-lg hover:bg-(--color-surface-hover) transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4 text-(--color-text-secondary)" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={cn(
              "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-1",
              currentChatId === chat.id ? "bg-(--color-surface-hover)" : "hover:bg-(--color-surface-hover)",
              "active:scale-[0.98] touch-manipulation"
            )}
            onClick={() => {
              onSelectChat(chat.id)
              if (isMobile) {
                onToggle() // Auto close sidebar on mobile after selection
              }
            }}
          >
            <MessageSquare className="w-4 h-4 text-(--color-text-secondary) shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-(--color-text-primary) truncate">{chat.title}</p>
              <p className="text-xs text-(--color-text-tertiary)">{formatDate(chat.updatedAt)}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteChat(chat.id)
              }}
              className={cn(
                "flex items-center justify-center p-1 rounded hover:bg-red-500/20 transition-all",
                isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
              aria-label="Delete chat"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-(--color-border)">
        <div className="flex items-center gap-2 text-xs text-(--color-text-tertiary)">
          <div className="w-2 h-2 rounded-full bg-(--color-accent)" />
          <span>Saved locally</span>
        </div>
      </div>
    </aside>
  )
}
