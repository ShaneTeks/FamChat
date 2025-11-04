"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, Mic, Waves } from "lucide-react"

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="border-t border-(--color-border) bg-(--color-surface) p-3 sm:p-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 bg-(--color-background) border border-(--color-border) rounded-2xl p-2 focus-within:border-(--color-primary) transition-colors">
          {/* Attachment button */}
          <button
            type="button"
            className="flex items-center justify-center p-2 rounded-xl hover:bg-(--color-surface-hover) transition-colors shrink-0 touch-manipulation active:scale-[0.95]"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5 text-(--color-text-secondary)" />
          </button>
          
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-(--color-text-primary) placeholder:text-(--color-text-tertiary) resize-none outline-none px-3 py-2 max-h-32 text-sm leading-relaxed touch-manipulation"
          />
          
          {/* Voice chat / Send button area */}
          <div className="flex items-center gap-1">
            {input.trim() ? (
              <>
                {/* Mic button for speech-to-text (when text exists) */}
                <button
                  type="button"
                  className="flex items-center justify-center p-2 rounded-xl hover:bg-(--color-surface-hover) transition-colors shrink-0 touch-manipulation active:scale-[0.95]"
                  aria-label="Voice input"
                >
                  <Mic className="w-5 h-5 text-(--color-text-secondary)" />
                </button>
                
                {/* Send button (when text exists) */}
                <button
                  type="submit"
                  disabled={!input.trim() || disabled}
                  className="flex items-center justify-center p-2 rounded-xl bg-(--color-primary) hover:bg-(--color-primary-hover) disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 touch-manipulation active:scale-[0.95]"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5 text-(--color-primary-foreground)" />
                </button>
              </>
            ) : (
              /* Voice chat button (when no text) */
              <button
                type="button"
                className="flex items-center justify-center p-2 rounded-xl bg-(--color-primary) hover:bg-(--color-primary-hover) text-(--color-primary-foreground) transition-all shrink-0 touch-manipulation active:scale-[0.95]"
                aria-label="Voice chat"
              >
                <Waves className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-(--color-text-tertiary) text-center mt-2 hidden sm:block">
          Press Enter to send, Shift + Enter for new line
        </p>
      </form>
    </div>
  )
}
