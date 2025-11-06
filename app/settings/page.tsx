"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Music, CheckCircle2, XCircle, ArrowLeft, Settings, MessageSquare, Plus, Trash2, Edit2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSettings, TTSProvider, CartesiaMode, SystemInstructionPreset } from '@/contexts/settings-context'
import { useToast } from '@/hooks/use-toast'

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { settings, updateSettings } = useSettings()
  const { toast } = useToast()
  const [spotifyConnected, setSpotifyConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isEditingPreset, setIsEditingPreset] = useState(false)
  const [editingPresetName, setEditingPresetName] = useState('')
  const [isCreatingPreset, setIsCreatingPreset] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')

  useEffect(() => {
    checkSpotifyConnection()
  }, [user])

  const checkSpotifyConnection = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('spotify_tokens')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      setSpotifyConnected(!error && !!data)
    } catch (error) {
      console.error('Error checking Spotify connection:', error)
      setSpotifyConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectSpotify = () => {
    window.location.href = '/api/spotify/login'
  }

  const handleDisconnectSpotify = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('spotify_tokens')
        .delete()
        .eq('user_id', user.id)

      if (!error) {
        setSpotifyConnected(false)
      }
    } catch (error) {
      console.error('Error disconnecting Spotify:', error)
    }
  }

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
    <div className="min-h-screen bg-(--color-background)">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Button>
          <h1 className="text-3xl font-bold text-(--color-text)">Settings</h1>
          <p className="text-(--color-text-secondary) mt-2">
            Manage your integrations and preferences
          </p>
        </div>

        {/* Speech Settings */}
        <div className="space-y-6 mb-8">
          <h2 className="text-xl font-semibold text-(--color-text)">Speech</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Text-to-Speech Provider</CardTitle>
              <CardDescription>Choose which service to use for voice playback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={settings.ttsProvider} onValueChange={handleTTSChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select TTS provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="groq">Groq TTS</SelectItem>
                  <SelectItem value="cartesia">Cartesia Sonic 3</SelectItem>
                </SelectContent>
              </Select>

              {settings.ttsProvider === 'cartesia' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cartesia Mode</label>
                  <Select value={settings.cartesiaMode} onValueChange={handleCartesiaModeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Cartesia mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="http">HTTP</SelectItem>
                      <SelectItem value="websocket">WebSocket (Live)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-(--color-text-secondary)">
                    HTTP for full audio generation, WebSocket for live streaming
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Instruction */}
        <div className="space-y-6 mb-8">
          <h2 className="text-xl font-semibold text-(--color-text)">System Instruction</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>AI Behavior</CardTitle>
              <CardDescription>Define how the AI should behave and respond</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              
              {isEditingPreset && settings.activePresetId && (
                <div className="flex gap-2 items-center p-3 bg-(--color-surface) rounded-lg">
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
                <div className="flex gap-2 items-center p-3 bg-(--color-surface) rounded-lg">
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Manage Custom Presets</label>
                  <div className="space-y-2">
                    {settings.systemInstructionPresets
                      .filter(p => !['default', 'creative', 'technical', 'casual'].includes(p.id))
                      .map(preset => (
                        <div key={preset.id} className="flex items-center justify-between p-2 bg-(--color-surface) rounded">
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
            </CardContent>
          </Card>
        </div>

        {/* Integrations Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-(--color-text)">Integrations</h2>

          {/* Spotify Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Spotify</CardTitle>
                    <CardDescription>
                      Control music playback and access your Spotify devices
                    </CardDescription>
                  </div>
                </div>
                {!loading && (
                  <div className="flex items-center gap-2">
                    {spotifyConnected ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-(--color-text-secondary)">
                        <XCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Not connected</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-(--color-text-secondary)">
                  {spotifyConnected ? (
                    <div>
                      <p className="mb-3">Your Spotify account is connected. The AI can now:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>See what's currently playing</li>
                        <li>List your available devices</li>
                        <li>Control playback (play, pause, skip)</li>
                        <li>Play specific tracks, albums, or playlists</li>
                      </ul>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-3">Connect your Spotify account to enable:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Music playback control via AI</li>
                        <li>Device selection</li>
                        <li>Currently playing track info</li>
                        <li>Playlist and track playback</li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {spotifyConnected ? (
                    <Button
                      variant="outline"
                      onClick={handleDisconnectSpotify}
                      className="w-full sm:w-auto"
                    >
                      Disconnect Spotify
                    </Button>
                  ) : (
                    <Button
                      onClick={handleConnectSpotify}
                      className="w-full sm:w-auto gap-2"
                    >
                      <Music className="w-4 h-4" />
                      Connect Spotify
                    </Button>
                  )}
                </div>

                {!spotifyConnected && (
                  <div className="bg-(--color-surface) p-4 rounded-lg text-sm text-(--color-text-secondary)">
                    <p className="font-medium mb-2">📝 Note:</p>
                    <p>
                      You'll be redirected to Spotify to authorize access. Make sure you have a 
                      Spotify account (Free or Premium). Some features require Spotify Premium.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
