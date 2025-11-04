"use client"

import { Download, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImagePreviewCardProps {
  src: string
  alt: string
  fileName: string
  width?: number
  height?: number
}

export function ImagePreviewCard({ src, alt, fileName, width, height }: ImagePreviewCardProps) {
  const formatMeta = () => {
    if (width && height) {
      return `JPEG • ${width}×${height} • AI Generated`
    }
    return "JPEG • AI Generated"
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: fileName,
          text: "Check out this AI-generated image!",
          url: src,
        })
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(src)
        alert("Image URL copied to clipboard!")
      }
    } catch (error) {
      console.error("Share failed:", error)
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden border border-(--color-border)",
        "backdrop-blur-sm shadow-sm",
      )}
      style={{
        background: "var(--color-ai-message, rgba(255, 255, 255, 0.55))",
      }}
    >
      <div className="flex flex-col gap-3 p-3">
        {/* Image */}
        <div className="relative w-full overflow-hidden rounded-xl border border-(--color-border)">
          <img
            src={src}
            alt={alt}
            className="w-full h-auto object-cover"
            style={{ aspectRatio: "16 / 9" }}
          />
        </div>

        {/* Info and Actions */}
        <div className="flex items-center gap-3">
          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-(--color-text-primary) truncate">{fileName}</p>
            <p className="text-xs text-(--color-text-secondary)">{formatMeta()}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-(--color-primary) text-(--color-primary-foreground) hover:opacity-90 transition-opacity"
              aria-label="Download image"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-(--color-border) text-(--color-text-primary) hover:bg-(--color-surface-hover) transition-colors"
              aria-label="Share image"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
