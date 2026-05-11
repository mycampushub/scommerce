'use client'

import { useEffect } from 'react'
import { initializeGlobalFetch, startTokenRefresh, refreshCSRFToken } from '@/lib/global-fetch'

/**
 * Global Fetch Initializer Component
 * Initializes CSRF protection for ALL fetch calls in the app
 * Include this once in root layout to protect all requests
 */
export function GlobalFetchInitializer() {
  useEffect(() => {
    // Initialize global fetch interceptor
    initializeGlobalFetch()

    // Get initial token if not exists
    const existingToken = localStorage.getItem('csrf_token')
    if (!existingToken) {
      refreshCSRFToken()
    }

    // Start automatic token refresh
    startTokenRefresh()

    // Cleanup on unmount
    return () => {
      // Cleanup if needed
    }
  }, [])

  return null // This component doesn't render anything
}
