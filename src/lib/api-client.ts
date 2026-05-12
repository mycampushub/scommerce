/**
 * API Client - Simple fetch wrapper
 */

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, options)
}

/**
 * Fetch with api (alias for apiFetch)
 */
export const api = apiFetch
