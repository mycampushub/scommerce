/**
 * React Query Cache Configuration
 * Centralized cache configuration for React Query
 */

import { QueryClient } from '@tanstack/react-query'

// Cache configuration
export const CACHE_CONFIG = {
  // Stale time: Time after which data becomes stale (in milliseconds)
  STALE_TIME: {
    SHORT: 30 * 1000, // 30 seconds
    MEDIUM: 5 * 60 * 1000, // 5 minutes
    LONG: 30 * 60 * 1000, // 30 minutes
    VERY_LONG: 60 * 60 * 1000, // 1 hour
  },

  // Cache time: Time to keep data in cache (in milliseconds)
  CACHE_TIME: {
    SHORT: 5 * 60 * 1000, // 5 minutes
    MEDIUM: 30 * 60 * 1000, // 30 minutes
    LONG: 60 * 60 * 1000, // 1 hour
    VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Refetch intervals
  REFRESH_INTERVAL: {
    NEVER: false,
    FREQUENT: 10 * 1000, // 10 seconds
    NORMAL: 30 * 1000, // 30 seconds
    SLOW: 60 * 1000, // 1 minute
    VERY_SLOW: 5 * 60 * 1000, // 5 minutes
  }
} as const

// Create and configure React Query client
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Time after which data is considered stale
        staleTime: CACHE_CONFIG.STALE_TIME.MEDIUM,

        // Time to keep unused data in cache
        gcTime: CACHE_CONFIG.CACHE_TIME.LONG,

        // Retry failed requests
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (except 429 - rate limit)
          if (error?.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
            return error.statusCode === 429 && failureCount < 2
          }
          // Retry up to 3 times for other errors
          return failureCount < 3
        },

        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch on window focus
        refetchOnWindowFocus: false,

        // Refetch on reconnect
        refetchOnReconnect: true,

        // Refetch on mount
        refetchOnMount: true,
      },
      mutations: {
        // Retry failed mutations
        retry: 1,
      },
    },
  })
}

// Cache keys factory
export const CACHE_KEYS = {
  // Products
  products: () => ['products'] as const,
  product: (id: string) => ['products', id] as const,
  productBySlug: (slug: string) => ['products', 'slug', slug] as const,
  productVariants: (productId: string) => ['products', productId, 'variants'] as const,

  // Categories
  categories: () => ['categories'] as const,
  category: (id: string) => ['categories', id] as const,

  // Cart
  cart: () => ['cart'] as const,

  // Wishlist
  wishlist: () => ['wishlist'] as const,

  // Orders
  orders: () => ['orders'] as const,
  order: (id: string) => ['orders', id] as const,

  // Inventory
  inventory: () => ['inventory'] as const,
  inventoryAlerts: () => ['inventory', 'alerts'] as const,
  inventoryMovements: () => ['inventory', 'movements'] as const,

  // Settings
  settings: () => ['settings'] as const,

  // Search
  search: (query: string) => ['search', query] as const,

  // Admin
  adminProducts: () => ['admin', 'products'] as const,
  adminCategories: () => ['admin', 'categories'] as const,
  adminOrders: () => ['admin', 'orders'] as const,
  adminUsers: () => ['admin', 'users'] as const,
  adminCoupons: () => ['admin', 'coupons'] as const,
} as const

// Invalidate related cache keys
export function invalidateRelatedCaches(queryClient: QueryClient, key: string[]): void {
  // Invalidate caches based on the key pattern
  queryClient.invalidateQueries({
    predicate: (query) => {
      const queryKey = query.queryKey
      return key.some(k => queryKey.includes(k))
    }
  })
}
