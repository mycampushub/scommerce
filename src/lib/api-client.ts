/**
 * API Client with CSRF protection
 * Automatically injects CSRF token into state-changing requests
 */

function getCSRFToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('csrf_token')
}

/**
 * Fetch wrapper that auto-includes CSRF token for state-changing methods.
 * For multipart/form-data, also appends _csrf to the form body.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase()
  const isStateChanging = !['GET', 'HEAD', 'OPTIONS'].includes(method)
  const csrfToken = getCSRFToken()
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) }

  if (isStateChanging && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken

    // For FormData, also append _csrf field for multipart support
    if (options.body instanceof FormData) {
      if (!options.body.has('_csrf')) {
        options.body.append('_csrf', csrfToken)
      }
    }
  }

  return fetch(url, { ...options, headers })
}

/**
 * Fetch with CSRF (alias for apiFetch)
 */
export const api = apiFetch
