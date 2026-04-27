/**
 * Cloudflare KV-based caching library
 * Provides caching for API responses and frequently accessed data
 */

import { Env } from '@/db/types';

export interface CacheOptions {
  /** Cache duration in seconds (default: 60) */
  ttl?: number;
  /** Custom cache key prefix (default: 'api') */
  prefix?: string;
  /** Whether to ignore cache and always fetch fresh data */
  skipCache?: boolean;
}

export interface CacheResult<T> {
  /** Cached data */
  data: T;
  /** Whether the data was retrieved from cache */
  fromCache: boolean;
}

/**
 * Fetch data with caching
 * @param env - Environment object containing KV binding
 * @param key - Cache key (will be prefixed)
 * @param fetchFn - Function to fetch fresh data
 * @param options - Cache options
 * @returns Cached or fresh data
 */
export async function withCache<T>(
  env: Env | null,
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<CacheResult<T>> {
  const {
    ttl = 60, // Default 1 minute cache
    prefix = 'api',
    skipCache = false,
  } = options;

  // If KV not available or skipCache is true, fetch fresh data
  if (!env?.KV || skipCache) {
    const data = await fetchFn();
    return { data, fromCache: false };
  }

  const cacheKey = `${prefix}:${key}`;

  try {
    // Try to get from cache
    const cached = await env.KV.get(cacheKey, 'text');
    if (cached) {
      try {
        const data = JSON.parse(cached) as T;
        return { data, fromCache: true };
      } catch (parseError) {
        console.warn(`Cache parse error for key ${cacheKey}:`, parseError);
        // Continue to fetch fresh data
      }
    }
  } catch (error) {
    console.error(`Cache get error for key ${cacheKey}:`, error);
    // Continue to fetch fresh data
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Try to cache the result (non-blocking)
  try {
    const serialized = JSON.stringify(data);
    await env.KV.put(cacheKey, serialized, {
      expirationTtl: ttl,
    });
  } catch (error) {
    console.error(`Cache set error for key ${cacheKey}:`, error);
    // Don't fail the request if caching fails
  }

  return { data, fromCache: false };
}

/**
 * Get cached data without fallback
 * @param env - Environment object containing KV binding
 * @param key - Cache key
 * @param options - Cache options
 * @returns Cached data or null if not found
 */
export async function getCache<T>(
  env: Env | null,
  key: string,
  options: CacheOptions = {}
): Promise<T | null> {
  if (!env?.KV) {
    return null;
  }

  const { prefix = 'api' } = options;
  const cacheKey = `${prefix}:${key}`;

  try {
    const cached = await env.KV.get(cacheKey, 'text');
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch (parseError) {
        console.warn(`Cache parse error for key ${cacheKey}:`, parseError);
        return null;
      }
    }
  } catch (error) {
    console.error(`Cache get error for key ${cacheKey}:`, error);
  }

  return null;
}

/**
 * Set cached data
 * @param env - Environment object containing KV binding
 * @param key - Cache key
 * @param data - Data to cache
 * @param options - Cache options
 */
export async function setCache<T>(
  env: Env | null,
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<void> {
  if (!env?.KV) {
    return;
  }

  const { ttl = 60, prefix = 'api' } = options;
  const cacheKey = `${prefix}:${key}`;

  try {
    const serialized = JSON.stringify(data);
    await env.KV.put(cacheKey, serialized, {
      expirationTtl: ttl,
    });
  } catch (error) {
    console.error(`Cache set error for key ${cacheKey}:`, error);
  }
}

/**
 * Delete cached data
 * @param env - Environment object containing KV binding
 * @param key - Cache key
 * @param options - Cache options
 */
export async function deleteCache(
  env: Env | null,
  key: string,
  options: CacheOptions = {}
): Promise<void> {
  if (!env?.KV) {
    return;
  }

  const { prefix = 'api' } = options;
  const cacheKey = `${prefix}:${key}`;

  try {
    await env.KV.delete(cacheKey);
  } catch (error) {
    console.error(`Cache delete error for key ${cacheKey}:`, error);
  }
}

/**
 * Delete multiple cache entries by prefix
 * @param env - Environment object containing KV binding
 * @param prefix - Cache key prefix to delete
 */
export async function deleteCacheByPrefix(
  env: Env | null,
  prefix: string
): Promise<void> {
  if (!env?.KV) {
    return;
  }

  try {
    // KV doesn't support prefix deletion directly
    // This would require listing keys, which is limited
    // For now, we'll use a separate key pattern to track prefixes
    const trackingKey = `cache:prefix:${prefix}`;
    await env.KV.delete(trackingKey);
  } catch (error) {
    console.error(`Cache delete prefix error for ${prefix}:`, error);
  }
}

/**
 * Invalidate cache for a specific resource type
 * @param env - Environment object containing KV binding
 * @param resourceType - Type of resource (e.g., 'products', 'categories')
 * @param resourceId - Optional specific resource ID
 */
export async function invalidateCache(
  env: Env | null,
  resourceType: string,
  resourceId?: string
): Promise<void> {
  if (!env?.KV) {
    return;
  }

  const key = resourceId ? `${resourceType}:${resourceId}` : `${resourceType}:list`;
  await deleteCache(env, key);
}

/**
 * Add Cache-Control headers to Response
 * @param response - Response object
 * @param maxAge - Max age in seconds
 * @param isPublic - Whether response can be cached by CDNs
 */
export function addCacheHeaders(
  response: Response,
  maxAge: number = 60,
  isPublic: boolean = true
): Response {
  const directives = isPublic ? 'public' : 'private';
  const cacheControl = `${directives}, max-age=${maxAge}, must-revalidate`;

  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Cache-Control', cacheControl);
  newResponse.headers.set('X-Cache', maxAge > 0 ? 'HIT' : 'MISS');

  return newResponse;
}

/**
 * Cache configuration for different resource types
 */
export const CacheConfig = {
  /** Short-lived cache for real-time data */
  SHORT: 30, // 30 seconds
  /** Medium cache for semi-dynamic data */
  MEDIUM: 60, // 1 minute
  /** Long cache for mostly static data */
  LONG: 300, // 5 minutes
  /** Very long cache for static data */
  VERY_LONG: 600, // 10 minutes
} as const;

/**
 * Helper to invalidate multiple related caches
 * Useful when a related resource changes
 */
export async function invalidateRelatedCaches(
  env: Env | null,
  patterns: string[]
): Promise<void> {
  if (!env?.KV) {
    return;
  }

  // Invalidate all provided cache patterns
  await Promise.all(
    patterns.map(pattern => deleteCacheByPrefix(env, pattern))
  );
}
