/**
 * Redis Caching Utility
 *
 * This module provides Redis caching functionality for the application.
 * If Redis is not configured, it falls back to in-memory caching.
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class RedisCache {
  private cache: Map<string, CacheItem<any>>
  private enabled: boolean
  private redisUrl: string | null
  private redisClient: any = null

  constructor() {
    this.cache = new Map()
    this.enabled = !!process.env.REDIS_URL
    this.redisUrl = process.env.REDIS_URL || null

    if (this.enabled && this.redisUrl) {
      this.initRedis()
    }
  }

  private async initRedis() {
    try {
      // Dynamically import ioredis to avoid dependency issues
      const Redis = (await import('ioredis')).default
      this.redisClient = new Redis(this.redisUrl, {
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
      })

      this.redisClient.on('error', (error: Error) => {
        console.error('Redis client error:', error)
        this.enabled = false
      })

      console.log('Redis caching initialized')
    } catch (error) {
      console.warn('Failed to initialize Redis, falling back to memory cache:', error)
      this.enabled = false
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.enabled && this.redisClient) {
        const value = await this.redisClient.get(key)
        return value ? JSON.parse(value) : null
      } else {
        // Fallback to in-memory cache
        const item = this.cache.get(key)
        if (!item) return null

        const now = Date.now()
        const age = now - item.timestamp

        if (age > item.ttl) {
          this.cache.delete(key)
          return null
        }

        return item.data as T
      }
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    try {
      if (this.enabled && this.redisClient) {
        await this.redisClient.setex(key, ttlSeconds, JSON.stringify(value))
      } else {
        // Fallback to in-memory cache
        this.cache.set(key, {
          data: value,
          timestamp: Date.now(),
          ttl: ttlSeconds * 1000,
        })
      }
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      if (this.enabled && this.redisClient) {
        await this.redisClient.del(key)
      } else {
        this.cache.delete(key)
      }
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  /**
   * Clear all cache values matching a pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      if (this.enabled && this.redisClient) {
        const keys = await this.redisClient.keys(pattern)
        if (keys.length > 0) {
          await this.redisClient.del(...keys)
        }
      } else {
        // For in-memory cache, delete keys that match pattern
        for (const key of this.cache.keys()) {
          const regex = new RegExp(pattern.replace('*', '.*'))
          if (regex.test(key)) {
            this.cache.delete(key)
          }
        }
      }
    } catch (error) {
      console.error('Cache clear pattern error:', error)
    }
  }

  /**
   * Get or set pattern - fetch from cache if exists, otherwise set cache
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await fetchFn()
    await this.set(key, value, ttlSeconds)
    return value
  }

  /**
   * Clean up expired items in memory cache
   */
  private cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      const age = now - item.timestamp
      if (age > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Create singleton instance
export const cache = new RedisCache()

// Run cleanup every 5 minutes for in-memory cache
if (typeof window === 'undefined') {
  setInterval(() => {
    cache['cleanup']?.()
  }, 5 * 60 * 1000)
}

// Cache key generators
export const cacheKeys = {
  products: (params?: string) => `products:${params || 'all'}`,
  product: (id: string) => `product:${id}`,
  categories: () => 'categories:all',
  category: (id: string) => `category:${id}`,
  banners: () => 'banners:all',
  stories: () => 'stories:all',
  reels: () => 'reels:all',
  promotions: () => 'promotions:all',
  user: (id: string) => `user:${id}`,
  cart: (userId: string) => `cart:${userId}`,
  wishlist: (userId: string) => `wishlist:${userId}`,
  reviews: (productId: string) => `reviews:${productId}`,
  autocomplete: (query: string) => `autocomplete:${query}`,
}
