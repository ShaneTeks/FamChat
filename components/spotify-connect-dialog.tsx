"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Music } from 'lucide-react'

interface SpotifyConnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SpotifyConnectDialog({ open, onOpenChange }: SpotifyConnectDialogProps) {
  const handleConnect = () => {
    // Redirect to Spotify login
    window.location.href = '/api/spotify/login'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-green-500" />
            Connect Spotify
          </DialogTitle>
          <DialogDescription>
            To control Spotify playback, you need to connect your Spotify account.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-(--color-text-secondary)">
            This will allow the AI to:
          </p>
          <ul className="text-sm text-(--color-text-secondary) space-y-2 ml-4">
            <li>• See what's currently playing</li>
            <li>• List your available devices</li>
            <li>• Control playback (play, pause, skip)</li>
          </ul>
          <Button onClick={handleConnect} className="w-full gap-2">
            <Music className="w-4 h-4" />
            Connect with Spotify
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
