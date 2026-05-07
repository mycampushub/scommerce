'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect if the app is running in PWA mode
 *
 * Detection methods:
 * 1. CSS display-mode media query (standalone, minimal-ui, fullscreen)
 * 2. iOS navigator.standalone flag
 * 3. Check if running in standalone browser window
 *
 * Returns true if the app is running as an installed PWA, false otherwise
 */
export function usePWADetection() {
  const [isPWA, setIsPWA] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    const checkPWA = () => {
      // Method 1: Check display-mode media query (most reliable)
      const standaloneQuery = window.matchMedia('(display-mode: standalone)')
      const minimalUiQuery = window.matchMedia('(display-mode: minimal-ui)')
      const fullscreenQuery = window.matchMedia('(display-mode: fullscreen)')

      // Method 2: Check iOS standalone flag (for older iOS versions)
      const isIOSStandalone = 'standalone' in window.navigator && (window.navigator as any).standalone

      // Method 3: Check if running in standalone window (additional check)
      const isStandaloneWindow = !!(standaloneQuery.matches || minimalUiQuery.matches || fullscreenQuery.matches)

      // Consider it PWA if any of the conditions are true
      const detectedAsPWA = isStandaloneWindow || isIOSStandalone

      setIsPWA(detectedAsPWA)

      // Log detection result for debugging
      console.log('[PWA Detection]', {
        isPWA: detectedAsPWA,
        standaloneDisplayMode: standaloneQuery.matches,
        minimalUiDisplayMode: minimalUiQuery.matches,
        fullscreenDisplayMode: fullscreenQuery.matches,
        iosStandalone: isIOSStandalone
      })
    }

    // Initial check
    checkPWA()

    // Listen for display mode changes (e.g., when app transitions between modes)
    const mediaQueryLists = [
      window.matchMedia('(display-mode: standalone)'),
      window.matchMedia('(display-mode: minimal-ui)'),
      window.matchMedia('(display-mode: fullscreen)')
    ]

    mediaQueryLists.forEach(mql => {
      mql.addEventListener('change', checkPWA)
    })

    // Cleanup event listeners
    return () => {
      mediaQueryLists.forEach(mql => {
        mql.removeEventListener('change', checkPWA)
      })
    }
  }, [])

  // Return false during SSR to avoid hydration mismatch
  return { isPWA: isClient ? isPWA : false, isMounted: isClient }
}
