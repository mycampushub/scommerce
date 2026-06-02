'use client'

import { useEffect, useState, useCallback } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already prompted
    const hasPrompted = localStorage.getItem('pwa_install_prompted')
    const promptCount = parseInt(localStorage.getItem('pwa_install_prompt_count') || '0', 10)
    const lastPromptTime = parseInt(localStorage.getItem('pwa_install_last_prompt') || '0', 10)

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(isIOSDevice)

    // Don't show if already installed (in standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone

    if (isStandalone) {
      // App is already running in standalone mode
      return
    }

    // Show prompt logic:
    // 1. Never prompted before, show after 5 seconds
    // 2. Prompted once, show again after 30 days and 3 page views
    // 3. Max 3 prompts total
    const shouldShowPrompt = () => {
      if (promptCount >= 3) return false
      if (!hasPrompted) return true // First time visitor

      const daysSinceLastPrompt = (Date.now() - lastPromptTime) / (1000 * 60 * 60 * 24)
      const pageViewsSince = parseInt(localStorage.getItem('pwa_install_page_views') || '0', 10)

      return daysSinceLastPrompt >= 30 && pageViewsSince >= 3
    }

    if (!shouldShowPrompt()) {
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show prompt after a delay
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
    }

    // Track page views
    const pageViews = parseInt(localStorage.getItem('pwa_install_page_views') || '0', 10)
    localStorage.setItem('pwa_install_page_views', (pageViews + 1).toString())

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, we show a different prompt (manual install instructions)
    if (isIOSDevice && shouldShowPrompt()) {
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const incrementPromptCount = useCallback(() => {
    const promptCount = parseInt(localStorage.getItem('pwa_install_prompt_count') || '0', 10)
    localStorage.setItem('pwa_install_prompt_count', (promptCount + 1).toString())
    localStorage.setItem('pwa_install_last_prompt', Date.now().toString())
    localStorage.setItem('pwa_install_prompted', 'true')
  }, [])

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      // For iOS, show instructions instead
      return
    }

    if (!deferredPrompt) {
      return
    }

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      // User accepted the install prompt
      console.log('User accepted the install prompt')
      localStorage.setItem('pwa_install_prompted', 'true')
    } else {
      // User dismissed the install prompt
      console.log('User dismissed the install prompt')
      incrementPromptCount()
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }, [deferredPrompt, isIOS, incrementPromptCount])

  const handleDismiss = useCallback(() => {
    setShowPrompt(false)
    incrementPromptCount()
  }, [incrementPromptCount])

  if (!showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-r from-pink-600 to-purple-600 text-white p-4 md:p-6 shadow-2xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4 flex-1">
          <div className="hidden sm:flex w-12 h-12 bg-white/20 rounded-lg items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base md:text-lg mb-1">
              {isIOS ? 'Add to Home Screen' : 'Install Our App'}
            </h3>
            <p className="text-sm md:text-base text-white/90 line-clamp-1 md:line-clamp-2">
              {isIOS
                ? 'Get the best experience! Tap Share, then "Add to Home Screen"'
                : 'Install our app for faster access and offline support'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <Button
            onClick={handleInstall}
            size="sm"
            className="bg-white text-pink-600 hover:bg-white/90 font-semibold text-xs md:text-sm px-3 md:px-4 py-2 md:py-2 h-9 md:h-10"
          >
            <Download className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
            <span className="hidden sm:inline">
              {isIOS ? 'Learn How' : 'Install'}
            </span>
            <span className="sm:hidden">
              {isIOS ? 'How?' : 'Install'}
            </span>
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 h-9 w-9"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* For iOS - Show detailed instructions when tapped */}
      {isIOS && (
        <div className="mt-4 bg-white/10 rounded-lg p-4 text-sm">
          <p className="font-semibold mb-2">How to add to home screen:</p>
          <ol className="list-decimal list-inside space-y-1 text-white/90">
            <li>Tap the Share button</li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" in the top right corner</li>
          </ol>
        </div>
      )}
    </div>
  )
}
