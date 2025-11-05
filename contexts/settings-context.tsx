"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type TTSProvider = 'groq' | 'cartesia'
export type CartesiaMode = 'http' | 'websocket'

interface Settings {
  ttsProvider: TTSProvider
  cartesiaMode: CartesiaMode
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    ttsProvider: 'groq',
    cartesiaMode: 'http'
  })

  useEffect(() => {
    const saved = localStorage.getItem('app-settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSettings(parsed)
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
