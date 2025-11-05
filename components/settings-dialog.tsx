"use client"

import { Settings, X, Plus, Trash2, Edit2, Save } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useSettings, TTSProvider, CartesiaMode, SystemInstructionPreset } from "@/contexts/settings-context"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, updateSettings } = useSettings()
  const { toast } = useToast()
  const [isEditingPreset, setIsEditingPreset] = useState(false)
  const [editingPresetName, setEditingPresetName] = useState('')
  const [isCreatingPreset, setIsCreatingPreset] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')

  const handleTTSChange = (value: string) => {
    updateSettings({ ttsProvider: value as TTSProvider })
  }

  const handleCartesiaModeChange = (value: string) => {
    updateSettings({ cartesiaMode: value as CartesiaMode })
  }

  const handleSystemInstructionChange = (value: string) => {
    updateSettings({ systemInstruction: value, activePresetId: null })
  }

  const handlePresetChange = (presetId: string) => {
    const preset = settings.systemInstructionPresets.find(p => p.id === presetId)
    if (preset) {
      updateSettings({ 
        systemInstruction: preset.instruction,
        activePresetId: presetId 
      })
      toast({ title: `Preset "${preset.name}" loaded` })
    }
  }

  const handleCreatePreset = () => {
    if (!newPresetName.trim()) {
      toast({ title: "Please enter a preset name", variant: "destructive" })
      return
    }
    const newPreset: SystemInstructionPreset = {
      id: `custom_${Date.now()}`,
      name: newPresetName.trim(),
      instruction: settings.systemInstruction
    }
    updateSettings({
      systemInstructionPresets: [...settings.systemInstructionPresets, newPreset],
      activePresetId: newPreset.id
    })
    setNewPresetName('')
    setIsCreatingPreset(false)
    toast({ title: `Preset "${newPreset.name}" created` })
  }

  const handleUpdatePreset = () => {
    if (!settings.activePresetId) return
    if (!editingPresetName.trim()) {
      toast({ title: "Please enter a preset name", variant: "destructive" })
      return
    }
    const updatedPresets = settings.systemInstructionPresets.map(p => 
      p.id === settings.activePresetId 
        ? { ...p, name: editingPresetName.trim(), instruction: settings.systemInstruction }
        : p
    )
    updateSettings({ systemInstructionPresets: updatedPresets })
    setIsEditingPreset(false)
    toast({ title: "Preset updated" })
  }

  const handleDeletePreset = (presetId: string) => {
    const preset = settings.systemInstructionPresets.find(p => p.id === presetId)
    if (preset && ['default', 'creative', 'technical', 'casual'].includes(preset.id)) {
      toast({ title: "Cannot delete default presets", variant: "destructive" })
      return
    }
    const updatedPresets = settings.systemInstructionPresets.filter(p => p.id !== presetId)
    const updates: any = { systemInstructionPresets: updatedPresets }
    if (settings.activePresetId === presetId) {
      updates.activePresetId = 'default'
      updates.systemInstruction = updatedPresets.find(p => p.id === 'default')?.instruction || ''
    }
    updateSettings(updates)
    toast({ title: "Preset deleted" })
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
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
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

          <div className="border-t pt-4 mt-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                System Instruction
              </label>
              <div className="flex gap-2">
                <Select 
                  value={settings.activePresetId || 'custom'} 
                  onValueChange={handlePresetChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.systemInstructionPresets.map(preset => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {settings.activePresetId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const preset = settings.systemInstructionPresets.find(p => p.id === settings.activePresetId)
                      if (preset) {
                        setEditingPresetName(preset.name)
                        setIsEditingPreset(true)
                      }
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Textarea
                value={settings.systemInstruction}
                onChange={(e) => handleSystemInstructionChange(e.target.value)}
                placeholder="Enter system instruction for the AI model..."
                className="min-h-[120px] resize-y"
              />
              <p className="text-xs text-muted-foreground">
                Define how the AI should behave and respond
              </p>
              
              {isEditingPreset && settings.activePresetId && (
                <div className="flex gap-2 items-center p-3 bg-muted rounded-lg">
                  <Input
                    value={editingPresetName}
                    onChange={(e) => setEditingPresetName(e.target.value)}
                    placeholder="Preset name"
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleUpdatePreset}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingPreset(false)}>
                    Cancel
                  </Button>
                </div>
              )}

              {isCreatingPreset ? (
                <div className="flex gap-2 items-center p-3 bg-muted rounded-lg">
                  <Input
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="New preset name"
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleCreatePreset}>
                    <Save className="h-4 w-4 mr-1" />
                    Create
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setIsCreatingPreset(false)
                    setNewPresetName('')
                  }}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatingPreset(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Save as New Preset
                </Button>
              )}

              {settings.systemInstructionPresets.length > 4 && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Manage Custom Presets
                  </label>
                  <div className="space-y-2">
                    {settings.systemInstructionPresets
                      .filter(p => !['default', 'creative', 'technical', 'casual'].includes(p.id))
                      .map(preset => (
                        <div key={preset.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{preset.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePreset(preset.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
