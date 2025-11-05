"use client"

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/pwa'

export function PWAInstaller() {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return null
}
