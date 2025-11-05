"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type TTSProvider = 'groq' | 'cartesia'
export type CartesiaMode = 'http' | 'websocket'

export interface SystemInstructionPreset {
  id: string
  name: string
  instruction: string
}

interface Settings {
  ttsProvider: TTSProvider
  cartesiaMode: CartesiaMode
  systemInstruction: string
  systemInstructionPresets: SystemInstructionPreset[]
  activePresetId: string | null
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    ttsProvider: 'groq',
    cartesiaMode: 'http',
    systemInstruction: 'You are a helpful AI assistant.',
    systemInstructionPresets: [
      {
        id: 'default',
        name: 'Default Assistant',
        instruction: 'You are a helpful AI assistant.'
      },
      {
        id: 'creative',
        name: 'Creative Writer',
        instruction: 'You are a creative writing assistant. Help users with storytelling, poetry, and creative content. Be imaginative and expressive.'
      },
      {
        id: 'technical',
        name: 'Technical Expert',
        instruction: 'You are a technical expert assistant. Provide detailed, accurate technical information. Focus on precision and best practices.'
      },
      {
        id: 'casual',
        name: 'Casual Friend',
        instruction: 'You are a friendly, casual conversational partner. Keep responses relaxed and personable while still being helpful.'
      }
    ],
    activePresetId: 'default'
  })

  useEffect(() => {
    const saved = localStorage.getItem('app-settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Migrate old settings to include new fields
        const migratedSettings: Settings = {
          ttsProvider: parsed.ttsProvider || 'groq',
          cartesiaMode: parsed.cartesiaMode || 'http',
          systemInstruction: parsed.systemInstruction || 'You are a helpful AI assistant.',
          systemInstructionPresets: parsed.systemInstructionPresets || [
            {
              id: 'default',
              name: 'Default Assistant',
              instruction: 'You are a helpful AI assistant.'
            },
            {
              id: 'creative',
              name: 'Creative Writer',
              instruction: 'You are a creative writing assistant. Help users with storytelling, poetry, and creative content. Be imaginative and expressive.'
            },
            {
              id: 'technical',
              name: 'Technical Expert',
              instruction: 'You are a technical expert assistant. Provide detailed, accurate technical information. Focus on precision and best practices.'
            },
            {
              id: 'casual',
              name: 'Casual Friend',
              instruction: 'You are a friendly, casual conversational partner. Keep responses relaxed and personable while still being helpful.'
            }
          ],
          activePresetId: parsed.activePresetId || 'default'
        }
        setSettings(migratedSettings)
        // Save migrated settings back to localStorage
        localStorage.setItem('app-settings', JSON.stringify(migratedSettings))
      } catch (e) {
        console.error('Failed to parse settings', e)
      }
    }
  }, [])

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    localStorage.setItem('app-settings', JSON.stringify(updated))
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}
