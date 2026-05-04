'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      let updateAvailable = false

      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope)

          // Listen for new service worker waiting to be activated
          if (registration.waiting) {
            updateAvailable = true
            console.log('New service worker waiting to activate')
            showUpdatePrompt()
          }

          // Listen for new service worker installing
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            console.log('New service worker found')

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                updateAvailable = true
                console.log('New service worker installed, waiting to activate')
                showUpdatePrompt()
              }
            })
          })

          // Listen for waiting service worker (when it's waiting to activate)
          registration.addEventListener('waiting', () => {
            updateAvailable = true
            console.log('Service worker waiting to activate')
            showUpdatePrompt()
          })

          // Listen for controller change (when new SW becomes active)
          registration.addEventListener('controllerchange', () => {
            console.log('Service worker controller changed')
            if (updateAvailable) {
              // Page will reload automatically due to skipWaiting: true
              console.log('Reloading page with new version')
            } else {
              // First-time install or background update
              console.log('Service worker activated')
            }
          })
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return null
}

// Show a subtle update notification
function showUpdatePrompt() {
  // Only show if user is actively browsing (not reloading)
  if (typeof window === 'undefined') return

  // Create or update update notification
  const existingNotification = document.getElementById('sw-update-notification')
  if (existingNotification) {
    existingNotification.remove()
  }

  const notification = document.createElement('div')
  notification.id = 'sw-update-notification'
  notification.innerHTML = `
    <div class="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 z-[9999] bg-gradient-to-r from-pink-600 to-pink-700 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center justify-between gap-3 max-w-sm animate-slide-up">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
          <path d="M21 12a9 9 0 0 1-9-9 9.42 9.42 0 0 1-9.42 9.42-0 0 1-9.42 9.42 0 0 1 9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9.42 9.42 0 0 1-9. SW is ready. Click to update" class="text-sm font-medium">
        <button
          onclick="window.location.reload()"
          class="bg-white text-pink-700 px-3 py-1.5 rounded-md font-semibold text-sm hover:bg-gray-100 transition-colors min-h-[36px] min-w-[80px]"
        >
          Update Now
        </button>
      </div>
      <button
        onclick="document.getElementById('sw-update-notification')?.remove()"
        class="text-white/80 hover:text-white p-1.5 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
        aria-label="Dismiss update notification"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `

  // Add animation styles
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-slide-up {
      animation: slideUp 0.3s ease-out;
    }
  `

  document.head.appendChild(style)
  document.body.appendChild(notification)

  // Auto-dismiss after 30 seconds
  setTimeout(() => {
    notification?.remove()
  }, 30000)
}
