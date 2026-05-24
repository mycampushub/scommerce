/**
 * API Response Utilities
 * Type-safe utilities for handling API responses
 */

import type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiError
} from '@/types/api.types'

import {
  isApiError,
  isApiSuccessResponse
} from '@/types/api.types'

export type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiError
}

export {
  isApiError,
  isApiSuccessResponse
}

/**
 * Safely parse JSON response with type safety
 */
export async function parseApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    const data = await response.json()
    return data as ApiResponse<T>
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse response',
      statusCode: response.status
    }
  }
}

/**
 * Create an API error from a response
 */
export function createApiError(
  message: string,
  statusCode?: number,
  details?: Record<string, unknown>
): ApiError {
  const error = new Error(message) as ApiError
  error.statusCode = statusCode
  error.details = details
  return error
}

/**
 * Handle API errors with proper typing
 */
export function handleApiError(error: unknown): ApiErrorResponse {
  if (isApiError(error)) {
    return {
      success: false,
      error: error.message,
      details: error.details,
      statusCode: error.statusCode
    }
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message
    }
  }

  if (typeof error === 'string') {
    return {
      success: false,
      error
    }
  }

  return {
    success: false,
    error: 'An unknown error occurred'
  }
}

/**
 * Check if response is successful and extract data
 */
export function extractApiData<T>(response: ApiResponse<T>): T | null {
  if (isApiSuccessResponse<T>(response)) {
    return response.data
  }
  return null
}

/**
 * Validate that a response was successful, throw error if not
 */
export function validateApiResponse<T>(response: ApiResponse<T>): T {
  if (isApiSuccessResponse<T>(response)) {
    return response.data
  }
  throw createApiError(
    response.error,
    response.statusCode,
    response.details
  )
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(data: T, message?: string): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message
  }
}

/**
 * Create an error response
 */
export function createErrorResponse(
  error: string,
  statusCode?: number,
  details?: Record<string, unknown>
): ApiErrorResponse {
  return {
    success: false,
    error,
    statusCode,
    details
  }
}
