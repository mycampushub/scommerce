/**
 * API Client - Simple fetch wrapper with authentication support
 */

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include', // Send cookies with requests for authentication
    headers: {
      ...options.headers,
    },
  })
}

/**
 * Fetch with api (alias for apiFetch)
 */
export const api = apiFetch
