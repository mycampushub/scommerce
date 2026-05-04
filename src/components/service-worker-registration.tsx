'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // next-pwa automatically handles service worker registration
    // The service worker is registered through the built-in workbox integration
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Service worker is auto-registered by next-pwa
      // Additional handling can be added here if needed
      navigator.serviceWorker.ready.then(() => {
        console.log('Service Worker is ready and active')
      }).catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
    }
  }, [])

  return null
}
