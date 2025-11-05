"use client"

import { Settings, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSettings, TTSProvider, CartesiaMode } from "@/contexts/settings-context"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, updateSettings } = useSettings()

  const handleTTSChange = (value: string) => {
    updateSettings({ ttsProvider: value as TTSProvider })
  }

  const handleCartesiaModeChange = (value: string) => {
    updateSettings({ cartesiaMode: value as CartesiaMode })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your chat preferences
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="tts-provider" className="text-sm font-medium">
              Speech Provider
            </label>
            <Select value={settings.ttsProvider} onValueChange={handleTTSChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select TTS provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="groq">Groq TTS</SelectItem>
                <SelectItem value="cartesia">Cartesia Sonic 3</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose which TTS service to use for voice playback
            </p>
          </div>
          {settings.ttsProvider === 'cartesia' && (
            <div className="grid gap-2">
              <label htmlFor="cartesia-mode" className="text-sm font-medium">
                Cartesia Mode
              </label>
              <Select value={settings.cartesiaMode} onValueChange={handleCartesiaModeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Cartesia mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="websocket">WebSocket (Live)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                HTTP for full audio generation, WebSocket for live streaming
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
