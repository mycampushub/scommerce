'use client'

import { useState, useEffect, useCallback } from 'react'

interface UsePWAInstallResult {
  canInstall: boolean
  isIOS: boolean
  isInstalling: boolean
  installPWA: () => Promise<void>
  dismissInstall: () => void
}

export function usePWAInstall(): UsePWAInstallResult {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // Check if running on iOS Safari
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(navigator as any).standalone
    setIsIOS(isIOSDevice)

    // Listen for beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if app can be installed
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        (navigator as any).standalone) {
      setCanInstall(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const installPWA = useCallback(async () => {
    if (!deferredPrompt) return

    setIsInstalling(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setCanInstall(false)
      }
    } catch (error) {
      console.error('PWA installation failed:', error)
    } finally {
      setIsInstalling(false)
      setDeferredPrompt(null)
    }
  }, [deferredPrompt])

  const dismissInstall = useCallback(() => {
    setDeferredPrompt(null)
    setCanInstall(false)
  }, [])

  return {
    canInstall,
    isIOS,
    isInstalling,
    installPWA,
    dismissInstall,
  }
}
