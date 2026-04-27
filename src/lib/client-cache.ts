/**
 * Client-Side Caching
 * Provides localStorage and IndexedDB caching for better performance
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface ClientCacheOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Use localStorage (fast) or IndexedDB (large storage) */
  storage?: 'localStorage' | 'indexedDB';
}

/**
 * Simple in-memory cache for fastest access
 */
class MemoryCache {
  private static instance: MemoryCache;
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private maxSize = 100; // Max entries

  private constructor() {}

  static getInstance(): MemoryCache {
    if (!this.instance) {
      this.instance = new MemoryCache();
    }
    return this.instance;
  }

  set<T>(key: string, data: T, ttl: number): void {
    // Remove oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * LocalStorage-based caching
 */
export class LocalStorageCache {
  private prefix = 'scommerce_cache_';

  set<T>(key: string, data: T, ttl: number): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      console.error('LocalStorage set error:', error);
      // Might be quota exceeded, try to clear old entries
      this.cleanup();
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const entry = JSON.parse(item) as CacheEntry<T>;

      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return null;
    }
  }

  delete(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }

  private cleanup(): void {
    // Remove expired entries
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const entry = JSON.parse(item) as CacheEntry<unknown>;
            if (Date.now() - entry.timestamp > entry.ttl) {
              localStorage.removeItem(key);
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      });
  }
}

/**
 * IndexedDB-based caching for large data
 */
export class IndexedDBCache {
  private dbName = 'scommerce_cache';
  private storeName = 'cache';
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });

    await this.initPromise;
  }

  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      const entry: CacheEntry<T> & { key: string } = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
      };

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.put(entry);
    } catch (error) {
      console.error('IndexedDB set error:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      await this.init();
      if (!this.db) return null;

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const entry = request.result as (CacheEntry<T> & { key: string }) | undefined;

          if (!entry) {
            resolve(null);
            return;
          }

          // Check if expired
          if (Date.now() - entry.timestamp > entry.ttl) {
            this.delete(key);
            resolve(null);
            return;
          }

          resolve(entry.data);
        };

        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.delete(key);
    } catch (error) {
      console.error('IndexedDB delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.clear();
    } catch (error) {
      console.error('IndexedDB clear error:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.openCursor();

      const now = Date.now();

      return new Promise((resolve) => {
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;

          if (cursor) {
            const entry = cursor.value as CacheEntry<unknown>;

            if (now - entry.timestamp > entry.ttl) {
              cursor.delete();
            }

            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => resolve();
      });
    } catch (error) {
      console.error('IndexedDB cleanup error:', error);
    }
  }
}

/**
 * Unified client cache interface
 */
export class ClientCache {
  private memoryCache = MemoryCache.getInstance();
  private localStorageCache = new LocalStorageCache();
  private indexedDBCache = new IndexedDBCache();

  /**
   * Cache data with multi-tier strategy
   * Uses memory (fast) → localStorage (fast, persistent) → IndexedDB (slow, large)
   */
  async set<T>(
    key: string,
    data: T,
    options: ClientCacheOptions = {}
  ): Promise<void> {
    const { ttl = 300000, storage = 'localStorage' } = options; // Default 5 minutes

    // Always store in memory for fastest access
    this.memoryCache.set(key, data, Math.min(ttl, 60000)); // Max 1 minute in memory

    // Store in persistent storage
    if (storage === 'indexedDB') {
      await this.indexedDBCache.set(key, data, ttl);
    } else {
      this.localStorageCache.set(key, data, ttl);
    }
  }

  /**
   * Get cached data from fastest available tier
   */
  async get<T>(key: string): Promise<T | null> {
    // Try memory first
    const memoryData = this.memoryCache.get<T>(key);
    if (memoryData !== null) {
      return memoryData;
    }

    // Try localStorage
    const localStorageData = this.localStorageCache.get<T>(key);
    if (localStorageData !== null) {
      // Promote to memory cache
      this.memoryCache.set(key, localStorageData, 60000);
      return localStorageData;
    }

    // Try IndexedDB
    const indexedDBData = await this.indexedDBCache.get<T>(key);
    if (indexedDBData !== null) {
      // Promote to memory and localStorage
      this.memoryCache.set(key, indexedDBData, 60000);
      this.localStorageCache.set(key, indexedDBData, 300000);
      return indexedDBData;
    }

    return null;
  }

  /**
   * Delete cached data from all tiers
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    this.localStorageCache.delete(key);
    await this.indexedDBCache.delete(key);
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.localStorageCache.clear();
    await this.indexedDBCache.clear();
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<void> {
    await this.indexedDBCache.cleanup();
    this.localStorageCache.cleanup?.();
  }
}

/**
 * React hook for client-side caching (implementation below) */

const clientCache = new ClientCache();

export function useClientCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: ClientCacheOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get from cache first
      const cached = await clientCache.get<T>(key);

      if (cached !== null) {
        setData(cached);
        setLoading(false);
        return;
      }

      // Fetch fresh data
      const fresh = await fetchFn();
      await clientCache.set(key, fresh, options);
      setData(fresh);
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, [key, fetchFn, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const invalidate = useCallback(async () => {
    await clientCache.delete(key);
    await fetchData();
  }, [key, fetchData]);

  return { data, loading, error, invalidate, refetch: fetchData };
}

/**
 * Fetch with client-side caching
 */
export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: ClientCacheOptions = {}
): Promise<T> {
  const cache = new ClientCache();

  // Try cache first
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const fresh = await fetchFn();
  await cache.set(key, fresh, options);
  return fresh;
}

/**
 * Prefetch multiple resources in background
 */
export async function prefetchResources<T>(
  resources: Array<{
    key: string;
    fetchFn: () => Promise<T>;
    options?: ClientCacheOptions;
  }>
): Promise<void> {
  // Prefetch in background without blocking
  resources.forEach(({ key, fetchFn, options }) => {
    fetchWithCache(key, fetchFn, options).catch(console.error);
  });
}
