'use client'

import { QueryClient, QueryCache } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CACHE_VERSION } from '@/lib/cache-version'

// Store cache version in localStorage for comparison
const CACHE_VERSION_KEY = 'scommerce_cache_version'

/**
 * Check if cache version has changed
 * Returns true if version changed, indicating cache should be cleared
 */
function hasCacheVersionChanged(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY)
    if (!storedVersion) {
      // First time, store current version
      localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION)
      return false
    }

    const hasChanged = storedVersion !== CACHE_VERSION
    if (hasChanged) {
      console.log(`[Query] Cache version changed: ${storedVersion} -> ${CACHE_VERSION}`)
      localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION)
    }
    return hasChanged
  } catch (error) {
    console.error('[Query] Error checking cache version:', error)
    return false
  }
}

// Create a QueryClient instance with optimized configuration
export function makeQueryClient() {
  const versionChanged = hasCacheVersionChanged()

  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache time - how long data stays fresh in cache
        // Clear cache on version change
        staleTime: versionChanged ? 0 : 1000 * 60 * 5, // 5 minutes (or 0 if version changed)
        // Cache time - how long inactive cache entries are kept
        gcTime: 1000 * 60 * 30, // 30 minutes
        // Retry failed requests with exponential backoff
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (client errors)
          if (error instanceof Error && 'status' in error) {
            const status = (error as any).status
            if (status >= 400 && status < 500) {
              return false
            }
          }
          // Retry up to 3 times for other errors
          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff with 30s max
        // Refetch on window focus
        refetchOnWindowFocus: true,
        // Refetch on reconnect
        refetchOnReconnect: true,
        // Don't refetch on mount if data is fresh
        refetchOnMount: false,
      },
      mutations: {
        // Retry failed mutations with exponential backoff
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Show toast notification on query errors
        if (query.meta?.errorMessage) {
          toast.error(query.meta.errorMessage as string)
        } else if (error instanceof Error) {
          console.error('Query error:', error)
        }
      },
    }),
  })
}

// Singleton query client for the browser
let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient()
    }
    return browserQueryClient
  }
}
