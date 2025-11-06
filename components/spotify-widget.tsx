"use client"

import type { SpotifyWidget as SpotifyWidgetType } from "@/lib/types"

interface SpotifyWidgetProps {
  data: SpotifyWidgetType
}

export function SpotifyWidget({ data }: SpotifyWidgetProps) {
  const { playlistId, theme = '0', title } = data

  return (
    <div className="rounded-2xl overflow-hidden max-w-md mx-auto mt-4 animate-scale-in">
      {title && (
        <div className="px-4 py-2 bg-(--color-surface) border-b border-(--color-border)">
          <h3 className="text-sm font-semibold text-(--color-text-primary)">
            {title}
          </h3>
        </div>
      )}
      <iframe
        title={`Spotify Embed: ${title || 'Playlist'}`}
        src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=${theme}`}
        width="100%"
        height="380"
        style={{ minHeight: '380px' }}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="border-0"
      />
    </div>
  )
}
