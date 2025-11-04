"use client"

import type { Message } from "@/lib/types"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ImagePreviewCard } from "@/components/image-preview-card"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex mb-4 sm:mb-6", isUser && "justify-end")}>
      <div
        className={cn(
          "px-4 py-3 sm:px-5 sm:py-4 rounded-2xl max-w-[95%]",
          isUser
            ? "bg-(--color-user-message) text-white"
            : "bg-(--color-ai-message) text-(--color-text-primary) border border-(--color-border)",
        )}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">{message.content}</p>
        ) : (
          <>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
            {message.imageUrl && (
              <div className="mt-4">
                <ImagePreviewCard
                  src={message.imageUrl}
                  alt="AI Generated Image"
                  fileName={`ai-generated-${Date.now()}.jpg`}
                  width={message.imageWidth}
                  height={message.imageHeight}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
