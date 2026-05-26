/**
 * API Client - Type-safe fetch wrapper with authentication support
 */

import {
  ApiResponse,
  parseApiResponse,
  validateApiResponse,
  handleApiError
} from '@/lib/api-response-utils'

/**
 * Type-safe API fetch with authentication
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // Only set Content-Type for methods that have a body
    const hasBody = options.method === 'POST' ||
                    options.method === 'PUT' ||
                    options.method === 'PATCH';

    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Send cookies with requests for authentication
      headers: {
        ...(hasBody && { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    })

    const apiResponse = await parseApiResponse<T>(response)

    if (!apiResponse.success) {
      throw handleApiError(apiResponse.error)
    }

    return validateApiResponse(apiResponse)
  } catch (error) {
    throw handleApiError(error)
  }
}

/**
 * Fetch with api (alias for apiFetch)
 */
export const api = apiFetch

/**
 * Type-safe POST request
 */
export async function apiPost<T = unknown, D = unknown>(
  url: string,
  data: D
): Promise<T> {
  return apiFetch<T>(url, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * Type-safe PUT request
 */
export async function apiPut<T = unknown, D = unknown>(
  url: string,
  data: D
): Promise<T> {
  return apiFetch<T>(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

/**
 * Type-safe DELETE request
 */
export async function apiDelete<T = unknown>(url: string): Promise<T> {
  return apiFetch<T>(url, {
    method: 'DELETE'
  })
}
