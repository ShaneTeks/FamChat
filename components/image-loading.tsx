"use client"

export function ImageLoading() {
  return (
    <div className="rounded-2xl overflow-hidden border border-(--color-border) backdrop-blur-sm shadow-sm animate-scale-in" style={{ background: "var(--color-ai-message, rgba(255, 255, 255, 0.55))" }}>
      <div className="flex flex-col gap-3 p-3">
        {/* Loading Image Container */}
        <div className="relative w-full overflow-hidden rounded-xl border border-(--color-border)">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-linear-to-br from-purple-400 via-pink-400 to-blue-400 animate-gradient-shift" />
            <div className="absolute inset-0 bg-linear-to-tl from-orange-400 via-red-400 to-yellow-400 animate-gradient-shift-reverse opacity-70" />
            
            {/* Frosted glass overlay */}
            <div className="absolute inset-0 backdrop-blur-2xl bg-white/30 dark:bg-black/30" />
            
            {/* Loading text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm font-medium text-(--color-text-secondary) opacity-70 bg-white/50 dark:bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                Generating Image...
              </p>
            </div>
          </div>
        </div>

        {/* Info and Actions Placeholder */}
        <div className="flex items-center gap-3">
          {/* File Info Placeholder */}
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse w-24 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-32" />
          </div>

          {/* Action Buttons Placeholder */}
          <div className="flex gap-2 shrink-0">
            <div className="h-9 w-20 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="h-9 w-20 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
