/**
 * GLOBAL FETCH INTERCEPTOR
 * Automatically adds CSRF tokens to ALL fetch requests globally
 * Initialize once in app and ALL fetch calls will be protected
 */

let isInitialized = false

/**
 * Initialize global fetch interceptor
 * Call this once in your app (e.g., in root layout or _app.tsx)
 * All subsequent fetch() calls will automatically include CSRF tokens
 */
export function initializeGlobalFetch() {
  if (isInitialized || typeof window === 'undefined') {
    return
  }

  isInitialized = true

  // Store original fetch
  const originalFetch = window.fetch

  // Override window.fetch with our CSRF-enabled version
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.toString()
    const method = init.method?.toUpperCase() || 'GET'

    // Only add CSRF to state-changing methods
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      // Get CSRF token from localStorage
      const csrfToken = localStorage.getItem('csrf_token')

      if (csrfToken) {
        // Add to headers
        const headers = new Headers(init.headers || {})
        headers.set('X-CSRF-Token', csrfToken)
        headers.set('X-XSRF-Token', csrfToken)
        init.headers = headers

        // If it's FormData, also add to body
        if (init.body instanceof FormData && !init.body.has('_csrf')) {
          init.body.append('_csrf', csrfToken)
        }
      }
    }

    // Call original fetch with modified init
    return originalFetch.call(window, input, init)
  }

  console.log('[Global Fetch] CSRF interceptor initialized - ALL fetch calls now protected')
}

/**
 * Get current CSRF token
 */
export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('csrf_token')
}

/**
 * Refresh CSRF token
 */
export async function refreshCSRFToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/csrf')
    if (!response.ok) return null

    const data = await response.json() as any
    const token = data.token

    if (token && typeof window !== 'undefined') {
      localStorage.setItem('csrf_token', token)
      localStorage.setItem('csrf_token_expires', String(Date.now() + (data.expiresIn * 1000)))
    }

    return token
  } catch (error) {
    console.error('[Global Fetch] Failed to refresh CSRF token:', error)
    return null
  }
}

/**
 * Auto-refresh token periodically (every 30 minutes)
 */
let refreshInterval: NodeJS.Timeout | null = null

export function startTokenRefresh() {
  if (typeof window === 'undefined') return

  // Clear existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }

  // Start new interval
  refreshInterval = setInterval(() => {
    refreshCSRFToken()
  }, 30 * 60 * 1000) // 30 minutes
}

export function stopTokenRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}
