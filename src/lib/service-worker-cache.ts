/**
 * Service Worker Cache Management Utilities
 *
 * Provides client-side utilities for:
 * - Invalidating service worker caches
 * - Syncing offline mutations
 * - Listening to service worker events
 * - Managing cache invalidation after mutations
 */

import { SW_CACHE_NAMES, getVersionedKey, isCurrentVersion } from '@/lib/cache-version';

/**
 * Invalidate service worker caches
 * @param options - Cache invalidation options
 */
export interface CacheInvalidationOptions {
  /** URL pattern to invalidate (e.g., '/api/products') */
  url?: string;
  /** Regex pattern to invalidate (e.g., '/api/products/.*') */
  pattern?: string;
  /** Invalidate all caches if true */
  invalidateAll?: boolean;
}

/**
 * Service worker event data
 */
export interface SWEventData {
  type: string;
  eventType: string;
  data?: any;
}

/**
 * Event types that can be received from service worker
 */
export type SWEventType =
  | 'cache-invalidated'
  | 'mutation-queued'
  | 'mutations-synced'
  | 'online'
  | 'offline';

/**
 * Callback for service worker events
 */
export type SWEventCallback = (eventType: SWEventType, data?: any) => void;

/**
 * Check if service worker is registered and ready
 */
export function isServiceWorkerReady(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    navigator.serviceWorker.controller !== null
  );
}

/**
 * Get the active service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration || null;
  } catch (error) {
    console.error('[SW Cache] Error getting service worker registration:', error);
    return null;
  }
}

/**
 * Send message to service worker
 * @param type - Message type
 * @param data - Message data
 */
export async function sendMessageToSW(
  type: string,
  data?: any
): Promise<void> {
  if (!isServiceWorkerReady()) {
    console.warn('[SW Cache] Service worker not ready');
    return;
  }

  try {
    const registration = await getServiceWorkerRegistration();
    if (registration?.active) {
      registration.active.postMessage({ type, data });
    }
  } catch (error) {
    console.error('[SW Cache] Error sending message to service worker:', error);
  }
}

/**
 * Invalidate service worker cache
 * @param options - Cache invalidation options
 *
 * @example
 * // Invalidate specific API endpoint
 * invalidateCache({ url: '/api/cart' });
 *
 * // Invalidate by pattern
 * invalidateCache({ pattern: '/api/products/.*' });
 *
 * // Invalidate all caches
 * invalidateCache({ invalidateAll: true });
 */
export async function invalidateCache(
  options: CacheInvalidationOptions = {}
): Promise<void> {
  const { url, pattern, invalidateAll } = options;

  if (invalidateAll) {
    await sendMessageToSW('CACHE_INVALIDATE', {});
    console.log('[SW Cache] All caches invalidated');
    return;
  }

  if (pattern || url) {
    await sendMessageToSW('CACHE_INVALIDATE', { url, pattern });
    console.log('[SW Cache] Cache invalidated:', { url, pattern });
  }
}

/**
 * Invalidate product-related caches
 * Call this after any product mutation (create, update, delete)
 *
 * @example
 * await invalidateProductCache(productId);
 */
export async function invalidateProductCache(productId?: string): Promise<void> {
  if (productId) {
    await invalidateCache({ pattern: `/api/products/${productId}` });
  }
  await invalidateCache({ pattern: '/api/products/.*' });
}

/**
 * Invalidate category-related caches
 * Call this after any category mutation
 *
 * @example
 * await invalidateCategoryCache();
 */
export async function invalidateCategoryCache(): Promise<void> {
  await invalidateCache({ pattern: '/api/categories/.*' });
}

/**
 * Invalidate cart cache
 * Call this after any cart mutation (add, update, remove)
 *
 * @example
 * await invalidateCartCache();
 */
export async function invalidateCartCache(): Promise<void> {
  await invalidateCache({ url: '/api/cart' });
}

/**
 * Invalidate wishlist cache
 * Call this after any wishlist mutation (add, remove)
 *
 * @example
 * await invalidateWishlistCache();
 */
export async function invalidateWishlistCache(): Promise<void> {
  await invalidateCache({ url: '/api/wishlist' });
}

/**
 * Invalidate orders cache
 * Call this after any order mutation (create, cancel, refund)
 *
 * @example
 * await invalidateOrdersCache();
 */
export async function invalidateOrdersCache(): Promise<void> {
  await invalidateCache({ pattern: '/api/orders/.*' });
}

/**
 * Invalidate static content caches (banners, stories, promotions)
 * Call this after any static content mutation
 *
 * @example
 * await invalidateStaticCache();
 */
export async function invalidateStaticCache(): Promise<void> {
  await invalidateCache({ pattern: '/api/(banners|stories|promotions|reels)/.*' });
}

/**
 * Sync offline mutations
 * Manually trigger sync of queued mutations
 *
 * @example
 * await syncOfflineMutations();
 */
export async function syncOfflineMutations(): Promise<void> {
  await sendMessageToSW('SYNC_MUTATIONS');
  console.log('[SW Cache] Sync requested');
}

/**
 * Skip waiting and activate new service worker
 * Useful when you want to immediately activate an updated service worker
 *
 * @example
 * await skipWaiting();
 */
export async function skipWaiting(): Promise<void> {
  await sendMessageToSW('SKIP_WAITING');
  console.log('[SW Cache] Skip waiting requested');
}

/**
 * Listen to service worker events
 * @param callback - Event callback function
 * @returns Cleanup function
 *
 * @example
 * const cleanup = listenToServiceWorkerEvents((event, data) => {
 *   if (event === 'cache-invalidated') {
 *     console.log('Cache invalidated:', data);
 *   } else if (event === 'mutations-synced') {
 *     console.log('Mutations synced:', data);
 *   }
 * });
 *
 * // Cleanup when done
 * cleanup();
 */
export function listenToServiceWorkerEvents(
  callback: SWEventCallback
): (() => void) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {};
  }

  const handler = (event: MessageEvent) => {
    const { type, eventType, data } = event.data;

    if (type === 'SW_EVENT' && typeof eventType === 'string') {
      callback(eventType as SWEventType, data);
    }
  };

  navigator.serviceWorker.addEventListener('message', handler);

  // Return cleanup function
  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
}

/**
 * Invalidate cache after mutation with automatic retry
 * @param invalidator - Cache invalidation function
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param delay - Delay between retries in ms (default: 1000)
 *
 * @example
 * await invalidateWithRetry(() => invalidateCartCache(), 3, 1000);
 */
export async function invalidateWithRetry(
  invalidator: () => Promise<void>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<void> {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await invalidator();
      return; // Success
    } catch (error) {
      retries++;
      console.error(`[SW Cache] Invalidation attempt ${retries} failed:`, error);

      if (retries >= maxRetries) {
        console.error('[SW Cache] Max retries reached, giving up');
        throw error;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Batch invalidate multiple caches
 * @param invalidators - Array of cache invalidation functions
 *
 * @example
 * await batchInvalidate([
 *   () => invalidateCartCache(),
 *   () => invalidateOrdersCache(),
 * ]);
 */
export async function batchInvalidate(
  invalidators: Array<() => Promise<void>>
): Promise<void> {
  await Promise.all(invalidators.map(invalidator => invalidator()));
}

/**
 * Helper to automatically invalidate cache after API mutation
 * @param mutationFn - Mutation function to execute
 * @param invalidator - Cache invalidation function
 *
 * @example
 * const result = await mutateWithCacheInvalidation(
 *   () => fetch('/api/cart', { method: 'POST', body: JSON.stringify(item) }),
 *   () => invalidateCartCache()
 * );
 */
export async function mutateWithCacheInvalidation<T>(
  mutationFn: () => Promise<T>,
  invalidator: () => Promise<void>
): Promise<T> {
  try {
    const result = await mutationFn();
    await invalidator();
    return result;
  } catch (error) {
    // Invalidate cache even on error to ensure consistency
    await invalidator().catch(err => {
      console.error('[SW Cache] Error during error invalidation:', err);
    });
    throw error;
  }
}

/**
 * Clear all old version caches
 * Removes caches from previous cache versions, keeping only current version
 * Call this on app initialization or when version mismatch is detected
 *
 * @example
 * await clearOldVersionCaches();
 */
export async function clearOldVersionCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    const currentVersionNames = Object.values(SW_CACHE_NAMES);

    // Delete all caches that don't match current version
    const oldCaches = cacheNames.filter(name => !currentVersionNames.includes(name));

    await Promise.all(
      oldCaches.map(name => {
        console.log(`[SW Cache] Clearing old cache: ${name}`);
        return caches.delete(name);
      })
    );

    if (oldCaches.length > 0) {
      console.log(`[SW Cache] Cleared ${oldCaches.length} old version caches`);
    }
  } catch (error) {
    console.error('[SW Cache] Error clearing old version caches:', error);
  }
}

/**
 * Check if cache version mismatch exists
 * Compares version from service worker with current version
 *
 * @returns true if version mismatch detected
 */
export async function hasVersionMismatch(): Promise<boolean> {
  const registration = await getServiceWorkerRegistration();
  if (!registration?.active) {
    return false;
  }

  try {
    // Send version check message to service worker
    registration.active.postMessage({ type: 'VERSION_CHECK' });

    // Wait for response
    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000);

      const handler = (event: MessageEvent) => {
        if (event.data.type === 'VERSION_RESPONSE') {
          clearTimeout(timeout);
          navigator.serviceWorker.removeEventListener('message', handler);
          const { version } = event.data;
          resolve(!isCurrentVersion(version));
        }
      };

      navigator.serviceWorker.addEventListener('message', handler);
    });
  } catch (error) {
    console.error('[SW Cache] Error checking version mismatch:', error);
    return false;
  }
}

// Export all utilities
export const ServiceWorkerCache = {
  invalidateCache,
  invalidateProductCache,
  invalidateCategoryCache,
  invalidateCartCache,
  invalidateWishlistCache,
  invalidateOrdersCache,
  invalidateStaticCache,
  syncOfflineMutations,
  skipWaiting,
  listenToServiceWorkerEvents,
  mutateWithCacheInvalidation,
  batchInvalidate,
  invalidateWithRetry,
  isServiceWorkerReady,
  getServiceWorkerRegistration,
  clearOldVersionCaches,
  hasVersionMismatch,
};
