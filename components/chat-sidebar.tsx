"use client"

import type { Chat } from "@/lib/types"
import { MessageSquare, Plus, Trash2, X, Star, Settings, LogOut, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { User } from '@supabase/supabase-js'

interface ChatSidebarProps {
  chats: Chat[]
  currentChatId: string | null
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
  onDeleteChat: (chatId: string) => void
  onToggleFavorite: (chatId: string) => void
  isOpen: boolean
  onToggle: () => void
  isMobile?: boolean
  onOpenSettings?: () => void
  user?: User | null
  onSignOut?: () => void
}

export function ChatSidebar({ chats, currentChatId, onSelectChat, onNewChat, onDeleteChat, onToggleFavorite, isOpen, onToggle, isMobile = false, onOpenSettings, user, onSignOut }: ChatSidebarProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString()
  }

  // Separate favorite and regular chats
  const favoriteChats = chats.filter(chat => chat.isFavorite)
  const regularChats = chats.filter(chat => !chat.isFavorite)

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
        {/* Favorites Section */}
        {favoriteChats.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <h3 className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wide">
                Favorites
              </h3>
            </div>
            {favoriteChats.map((chat) => (
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
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFavorite(chat.id)
                    }}
                    className={cn(
                      "flex items-center justify-center p-1 rounded transition-all",
                      isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    aria-label="Remove from favorites"
                  >
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  </button>
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
              </div>
            ))}
          </div>
        )}

        {/* Regular Chats Section */}
        {regularChats.length > 0 && (
          <div>
            {favoriteChats.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <div className="w-4 h-4 border border-(--color-border) rounded" />
                <h3 className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wide">
                  All Chats
                </h3>
              </div>
            )}
            {regularChats.map((chat) => (
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
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFavorite(chat.id)
                    }}
                    className={cn(
                      "flex items-center justify-center p-1 rounded hover:bg-yellow-500/10 transition-all",
                      isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    aria-label="Add to favorites"
                  >
                    <Star className="w-4 h-4 text-(--color-text-tertiary)" />
                  </button>
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
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {chats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-(--color-text-tertiary)">
            <MessageSquare className="w-8 h-8 mb-2" />
            <p className="text-sm">No chats yet</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-(--color-border) space-y-3">
        {/* User Status */}
        {user && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-(--color-surface-hover)">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-(--color-accent)" />
                <p className="text-xs font-medium text-(--color-text-primary) truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center justify-center p-1.5 rounded hover:bg-(--color-surface-hover) transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4 text-(--color-text-secondary)" />
            </button>
          </div>
        )}
        
        {/* Settings Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-(--color-text-tertiary)">
            <div className="w-2 h-2 rounded-full bg-(--color-accent)" />
            <span>{user ? 'Syncing enabled' : 'Saved locally'}</span>
          </div>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center justify-center p-2 rounded-lg hover:bg-(--color-surface-hover) transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-(--color-text-secondary)" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
