"use client"

import { useState, useRef, useEffect } from "react"
import type { Chat, Message } from "@/lib/types"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { ThemeToggle } from "@/components/theme-toggle"
import { SyncButton } from "@/components/sync-button"
import { Menu, Sparkles } from "lucide-react"
import { generateId } from "@/lib/utils"
import { useSettings } from "@/contexts/settings-context"
import { supabase } from "@/lib/supabase"

interface ChatInterfaceProps {
  chat: Chat
  onUpdateChat: (chatId: string, updates: Partial<Chat>) => void
  onToggleSidebar: () => void
  sidebarOpen: boolean
  isMobile?: boolean
  onToggleSync?: () => void
  isSyncing?: boolean
}

export function ChatInterface({ chat, onUpdateChat, onToggleSidebar, sidebarOpen, isMobile = false, onToggleSync, isSyncing }: ChatInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { settings } = useSettings()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chat.messages])

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: Date.now(),
    }

    const updatedMessages = [...chat.messages, userMessage]

    // Update chat title if it's the first message
    const isFirstMessage = chat.messages.length === 0

    setIsLoading(true)

    // If this is the first message, generate a chat name first, then update everything
    if (isFirstMessage) {
      try {
        console.log("Starting chat name generation for:", content)
        const nameResponse = await fetch("/api/name-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content }),
        })

        let finalTitle = chat.title // fallback to current title

        if (nameResponse.ok) {
          const reader = nameResponse.body?.getReader()
          const decoder = new TextDecoder()
          let chatName = ""
          let buffer = ""

          if (reader) {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split("\n")
              
              buffer = lines.pop() || ""

              for (const line of lines) {
                if (!line.trim()) continue
                
                if (line.startsWith("0:")) {
                  try {
                    const jsonStr = line.slice(2)
                    const data = JSON.parse(jsonStr)
                    if (data.type === "text-delta" && data.textDelta) {
                      chatName += data.textDelta
                    }
                  } catch (e) {
                    console.error("Failed to parse naming line:", line, e)
                  }
                } else if (line.startsWith("data: ")) {
                  const dataStr = line.slice(6)
                  
                  if (dataStr === "[DONE]") {
                    break
                  }
                  
                  try {
                    const data = JSON.parse(dataStr)
                    
                    if (data.type === "text-delta" && data.delta) {
                      chatName += data.delta
                    } else if (data.choices?.[0]?.delta?.content) {
                      chatName += data.choices[0].delta.content
                    }
                  } catch (e) {
                    console.error("Failed to parse naming SSE line:", line, e)
                  }
                }
              }
            }
          }

          // Update the chat title with the generated name
          if (chatName.trim()) {
            finalTitle = chatName.trim().slice(0, 50) + (chatName.trim().length > 50 ? "..." : "")
            console.log("Generated final title:", finalTitle)
          }
        }

        // Now update the chat with both messages AND the final title in one call
        console.log("Single update call with messages and title:", finalTitle)
        onUpdateChat(chat.id, { messages: updatedMessages, title: finalTitle })

      } catch (error) {
        console.error("Error generating chat name:", error)
        // Fallback: update with messages only
        onUpdateChat(chat.id, { messages: updatedMessages, title: chat.title })
      }
    } else {
      // For subsequent messages, just update messages and preserve existing title
      onUpdateChat(chat.id, { messages: updatedMessages, title: chat.title })
    }

    try {
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 
        "Content-Type": "application/json" 
      }
      
      // Add auth header if user is logged in
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: updatedMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          systemInstruction: settings.systemInstruction,
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let aiContent = ""
      let buffer = ""

      const aiMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      }
      
      let isImageRequest = false
      let isWeatherRequest = false
      let isForecastRequest = false
      let isSpotifyRequest = false

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.trim()) continue
            
            console.log("Stream line:", line)
            
            // Handle different stream formats
            if (line.startsWith("0:")) {
              try {
                const jsonStr = line.slice(2)
                const data = JSON.parse(jsonStr)
                console.log("Parsed 0: format:", data)
                if (data.type === "text-delta" && data.textDelta) {
                  aiContent += data.textDelta
                  
                  // Check if this looks like a special request JSON
                  const trimmed = aiContent.trim()
                  if (trimmed.startsWith("{")) {
                    try {
                      // Try to parse as JSON to detect special requests early
                      if (trimmed.includes('"type"')) {
                        if (trimmed.includes('"image"')) {
                          isImageRequest = true
                          continue
                        } else if (trimmed.includes('"weather"')) {
                          isWeatherRequest = true
                          continue
                        } else if (trimmed.includes('"forecast"')) {
                          isForecastRequest = true
                          continue
                        } else if (trimmed.includes('"spotify"')) {
                          isSpotifyRequest = true
                          continue
                        }
                      }
                    } catch {
                      // Not valid JSON yet, continue normally
                    }
                  }
                  
                  // Only update if not a special request
                  if (!isImageRequest && !isWeatherRequest && !isForecastRequest && !isSpotifyRequest) {
                    aiMessage.content = aiContent
                    onUpdateChat(chat.id, {
                      messages: [...updatedMessages, aiMessage],
                    })
                  }
                }
              } catch (e) {
                console.error("Failed to parse line:", line, e)
              }
            } else if (line.startsWith("data: ")) {
              // Handle SSE format
              const dataStr = line.slice(6)
              
              // Handle [DONE] signal
              if (dataStr === "[DONE]") {
                console.log("Stream completed")
                break
              }
              
              try {
                const data = JSON.parse(dataStr)
                console.log("Parsed SSE format:", data)
                
                // Handle text-delta format (Groq/Vercel AI SDK format)
                if (data.type === "text-delta" && data.delta) {
                  aiContent += data.delta
                  
                  // Check if this looks like a special request JSON
                  const trimmed = aiContent.trim()
                  if (trimmed.startsWith("{")) {
                    try {
                      // Try to parse as JSON to detect special requests early
                      if (trimmed.includes('"type"')) {
                        if (trimmed.includes('"image"')) {
                          isImageRequest = true
                          continue
                        } else if (trimmed.includes('"weather"')) {
                          isWeatherRequest = true
                          continue
                        } else if (trimmed.includes('"forecast"')) {
                          isForecastRequest = true
                          continue
                        } else if (trimmed.includes('"spotify"')) {
                          isSpotifyRequest = true
                          continue
                        }
                      }
                    } catch {
                      // Not valid JSON yet, continue normally
                    }
                  }
                  
                  // Only update if not a special request
                  if (!isImageRequest && !isWeatherRequest && !isForecastRequest && !isSpotifyRequest) {
                    aiMessage.content = aiContent
                    onUpdateChat(chat.id, {
                      messages: [...updatedMessages, aiMessage],
                    })
                  }
                }
                // Handle OpenAI format
                else if (data.choices?.[0]?.delta?.content) {
                  aiContent += data.choices[0].delta.content
                  
                  // Check if this looks like a special request JSON
                  const trimmed = aiContent.trim()
                  if (trimmed.startsWith("{")) {
                    try {
                      // Try to parse as JSON to detect special requests early
                      if (trimmed.includes('"type"')) {
                        if (trimmed.includes('"image"')) {
                          isImageRequest = true
                          continue
                        } else if (trimmed.includes('"weather"')) {
                          isWeatherRequest = true
                          continue
                        } else if (trimmed.includes('"forecast"')) {
                          isForecastRequest = true
                          continue
                        } else if (trimmed.includes('"spotify"')) {
                          isSpotifyRequest = true
                          continue
                        }
                      }
                    } catch {
                      // Not valid JSON yet, continue normally
                    }
                  }
                  
                  // Only update if not a special request
                  if (!isImageRequest && !isWeatherRequest && !isForecastRequest && !isSpotifyRequest) {
                    aiMessage.content = aiContent
                    onUpdateChat(chat.id, {
                      messages: [...updatedMessages, aiMessage],
                    })
                  }
                }
              } catch (e) {
                console.error("Failed to parse SSE line:", line, e)
              }
            }
          }
        }
      }

      // Note: Spotify connection is now handled through Settings page

      // After streaming completes, check if the AI requested a special action
      try {
        const trimmedContent = aiContent.trim()
        let jsonResponse = null
        
        // Try to extract JSON from content
        // 1. Check if entire content is JSON
        if (trimmedContent.startsWith("{") && trimmedContent.endsWith("}")) {
          try {
            jsonResponse = JSON.parse(trimmedContent)
          } catch {}
        }
        
        // 2. Look for JSON in code blocks (```json ... ``` or ``` ... ```)
        if (!jsonResponse) {
          const codeBlockMatch = trimmedContent.match(/```(?:json)?\s*\n?(\{[\s\S]*?\})\s*\n?```/)
          if (codeBlockMatch) {
            try {
              jsonResponse = JSON.parse(codeBlockMatch[1])
            } catch {}
          }
        }
        
        // 3. Look for JSON anywhere in the content (between first { and last })
        if (!jsonResponse) {
          const firstBrace = trimmedContent.indexOf("{")
          const lastBrace = trimmedContent.lastIndexOf("}")
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try {
              jsonResponse = JSON.parse(trimmedContent.substring(firstBrace, lastBrace + 1))
            } catch {}
          }
        }
        
        if (jsonResponse) {
          if (jsonResponse.type === "image" && jsonResponse.prompt) {
            console.log("Detected image generation request:", jsonResponse.prompt)
            
            // Update message to show loading state
            aiMessage.content = jsonResponse.message || "Here's your generated image:"
            aiMessage.isGeneratingImage = true
            onUpdateChat(chat.id, {
              messages: [...updatedMessages, aiMessage],
            })
            
            // Generate the image
            const imageResponse = await fetch("/api/generate-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: jsonResponse.prompt }),
            })

            if (imageResponse.ok) {
              const imageData = await imageResponse.json()
              
              // Update the message with the generated image
              aiMessage.imageUrl = imageData.imageUrl
              aiMessage.imageWidth = imageData.width
              aiMessage.imageHeight = imageData.height
              aiMessage.isGeneratingImage = false
              
              onUpdateChat(chat.id, {
                messages: [...updatedMessages, aiMessage],
              })
            } else {
              // Remove loading state if image generation failed
              aiMessage.isGeneratingImage = false
              aiMessage.content = "Sorry, I couldn't generate the image. Please try again."
              onUpdateChat(chat.id, {
                messages: [...updatedMessages, aiMessage],
              })
            }
          } else if (jsonResponse.type === "weather" && jsonResponse.weatherData) {
            console.log("Detected weather widget request:", jsonResponse.weatherData)
            
            // Extract the text content without the JSON code block
            let cleanContent = trimmedContent
            
            // Remove JSON code blocks
            cleanContent = cleanContent.replace(/```(?:json)?\s*\n?\{[\s\S]*?\}\s*\n?```/g, '').trim()
            
            // Remove standalone JSON objects
            const firstBrace = cleanContent.indexOf("{")
            const lastBrace = cleanContent.lastIndexOf("}")
            if (firstBrace !== -1 && lastBrace !== -1) {
              // Check if this looks like a JSON object (has "type": "weather")
              const potentialJson = cleanContent.substring(firstBrace, lastBrace + 1)
              if (potentialJson.includes('"type"') && potentialJson.includes('"weather"')) {
                cleanContent = cleanContent.substring(0, firstBrace).trim()
              }
            }
            
            // Use cleaned content or fallback to message from JSON
            aiMessage.content = cleanContent || jsonResponse.message || "Here's the current weather:"
            aiMessage.weatherWidget = jsonResponse.weatherData
            
            onUpdateChat(chat.id, {
              messages: [...updatedMessages, aiMessage],
            })
          } else if (jsonResponse.type === "forecast" && jsonResponse.forecastData) {
            console.log("Detected forecast widget request:", jsonResponse.forecastData)
            
            // Extract the text content without the JSON code block
            let cleanContent = trimmedContent
            
            // Remove JSON code blocks
            cleanContent = cleanContent.replace(/```(?:json)?\s*\n?\{[\s\S]*?\}\s*\n?```/g, '').trim()
            
            // Remove standalone JSON objects
            const firstBrace = cleanContent.indexOf("{")
            const lastBrace = cleanContent.lastIndexOf("}")
            if (firstBrace !== -1 && lastBrace !== -1) {
              // Check if this looks like a JSON object (has "type": "forecast")
              const potentialJson = cleanContent.substring(firstBrace, lastBrace + 1)
              if (potentialJson.includes('"type"') && potentialJson.includes('"forecast"')) {
                cleanContent = cleanContent.substring(0, firstBrace).trim()
              }
            }
            
            // Use cleaned content or fallback to message from JSON
            aiMessage.content = cleanContent || jsonResponse.message || "Here's the 5-day forecast:"
            aiMessage.forecastWidget = jsonResponse.forecastData
            
            onUpdateChat(chat.id, {
              messages: [...updatedMessages, aiMessage],
            })
          } else if (jsonResponse.type === "spotify" && jsonResponse.playlistId) {
            console.log("Detected Spotify widget request:", jsonResponse.playlistId)
            
            // Extract the text content without the JSON code block
            let cleanContent = trimmedContent
            
            // Remove JSON code blocks
            cleanContent = cleanContent.replace(/```(?:json)?\s*\n?\{[\s\S]*?\}\s*\n?```/g, '').trim()
            
            // Remove standalone JSON objects
            const firstBrace = cleanContent.indexOf("{")
            const lastBrace = cleanContent.lastIndexOf("}")
            if (firstBrace !== -1 && lastBrace !== -1) {
              // Check if this looks like a JSON object (has "type": "spotify")
              const potentialJson = cleanContent.substring(firstBrace, lastBrace + 1)
              if (potentialJson.includes('"type"') && potentialJson.includes('"spotify"')) {
                cleanContent = cleanContent.substring(0, firstBrace).trim()
              }
            }
            
            // Use cleaned content or fallback to message from JSON
            aiMessage.content = cleanContent || jsonResponse.message || "Here's the Spotify playlist:"
            aiMessage.spotifyWidget = {
              playlistId: jsonResponse.playlistId,
              theme: jsonResponse.theme,
              title: jsonResponse.title,
            }
            
            onUpdateChat(chat.id, {
              messages: [...updatedMessages, aiMessage],
            })
          }
        }
      } catch (e) {
        // Not a JSON response or special request, just display the text
        console.log("Not a special request")
      }
    } catch (error: any) {
      console.error("Error:", error)
      
      // Check if error is from Spotify auth requirement
      if (error?.message?.includes('SPOTIFY_NOT_CONNECTED') || 
          error?.response?.error === 'SPOTIFY_NOT_CONNECTED') {
        const errorMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: "To control Spotify playback, you need to connect your Spotify account first. Please open Settings (⚙️ gear icon in the sidebar) and click 'Connect Spotify' under Spotify Integration.",
          timestamp: Date.now(),
        }
        onUpdateChat(chat.id, {
          messages: [...updatedMessages, errorMessage],
        })
      } else {
        const errorMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: Date.now(),
        }
        onUpdateChat(chat.id, {
          messages: [...updatedMessages, errorMessage],
        })
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  // Check for Spotify connection success on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('spotify_connected') === 'true') {
      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-(--color-border) bg-(--color-surface)">
        <button
          onClick={onToggleSidebar}
          className="flex items-center justify-center p-2 rounded-lg hover:bg-(--color-surface-hover) transition-colors touch-manipulation active:scale-[0.95]"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-(--color-text-secondary)" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Sparkles className="w-5 h-5 text-(--color-accent) shrink-0" />
          <h1 className="text-lg font-semibold text-(--color-text-primary) truncate">{chat.title}</h1>
        </div>
        {onToggleSync && (
          <SyncButton
            syncEnabled={chat.syncEnabled || false}
            onToggle={onToggleSync}
            isSyncing={isSyncing}
          />
        )}
        <ThemeToggle />
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {chat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 py-8">
            <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-(--color-accent) mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-(--color-text-primary) mb-2 text-balance text-center">
              How can I help you today?
            </h2>
            <p className="text-(--color-text-secondary) text-center max-w-md text-pretty text-sm sm:text-base">
              Start a conversation by typing a message below. I'm powered by Groq for lightning-fast responses.
            </p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
            {chat.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-(--color-accent) text-(--color-accent-foreground) flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 rounded-full bg-(--color-text-tertiary) animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-(--color-text-tertiary) animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-(--color-text-tertiary) animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  )
}
