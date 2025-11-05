"use client"

import { Cloud, CloudOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SyncButtonProps {
  syncEnabled: boolean
  onToggle: () => void
  isSyncing?: boolean
}

export function SyncButton({ syncEnabled, onToggle, isSyncing }: SyncButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={`relative transition-all ${
              syncEnabled
                ? 'text-green-500 hover:text-green-600'
                : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
            }`}
          >
            {syncEnabled ? (
              <Cloud
                className={`w-5 h-5 ${
                  isSyncing ? 'animate-pulse' : ''
                }`}
              />
            ) : (
              <CloudOff className="w-5 h-5" />
            )}
            {syncEnabled && (
              <span className="absolute inset-0 rounded-lg bg-green-500/20 blur-md animate-pulse" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{syncEnabled ? 'Syncing to cloud' : 'Local storage only'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
