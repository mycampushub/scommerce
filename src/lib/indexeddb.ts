/**
 * IndexedDB Storage Manager
 * Provides client-side storage with larger capacity than localStorage
 * Used for offline support, caching, and data persistence
 */

const DB_NAME = 'scommerce-db';
const DB_VERSION = 1;

export enum IndexedDBStore {
  PRODUCTS = 'products',
  CATEGORIES = 'categories',
  CART = 'cart',
  WISHLIST = 'wishlist',
  ORDERS = 'orders',
  OFFLINE_MUTATIONS = 'offline-mutations',
  CACHE_METADATA = 'cache-metadata',
}

export interface CacheMetadata {
  key: string;
  timestamp: number;
  expiresAt?: number;
  size?: number;
}

export interface OfflineMutation {
  id: string;
  timestamp: number;
  method: 'POST' | 'PUT' | 'DELETE';
  url: string;
  body?: any;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(IndexedDBStore.PRODUCTS)) {
          db.createObjectStore(IndexedDBStore.PRODUCTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(IndexedDBStore.CATEGORIES)) {
          db.createObjectStore(IndexedDBStore.CATEGORIES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(IndexedDBStore.CART)) {
          db.createObjectStore(IndexedDBStore.CART, { keyPath: 'productId' });
        }
        if (!db.objectStoreNames.contains(IndexedDBStore.WISHLIST)) {
          db.createObjectStore(IndexedDBStore.WISHLIST, { keyPath: 'productId' });
        }
        if (!db.objectStoreNames.contains(IndexedDBStore.ORDERS)) {
          db.createObjectStore(IndexedDBStore.ORDERS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(IndexedDBStore.OFFLINE_MUTATIONS)) {
          db.createObjectStore(IndexedDBStore.OFFLINE_MUTATIONS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(IndexedDBStore.CACHE_METADATA)) {
          db.createObjectStore(IndexedDBStore.CACHE_METADATA, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Get database instance
   */
  private async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  /**
   * Add item to store
   */
  async add<T>(storeName: IndexedDBStore, item: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update item in store
   */
  async update<T>(storeName: IndexedDBStore, item: T & { id?: string; productId?: string }): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const key = item.id || item.productId;

      if (!key) {
        reject(new Error('Item must have an id or productId'));
        return;
      }

      const request = store.put(item, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get item by key
   */
  async get<T>(storeName: IndexedDBStore, key: string): Promise<T | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all items from store
   */
  async getAll<T>(storeName: IndexedDBStore): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete item from store
   */
  async delete(storeName: IndexedDBStore, key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all items from store
   */
  async clear(storeName: IndexedDBStore): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get store size (approximate)
   */
  async getStoreSize(storeName: IndexedDBStore): Promise<number> {
    const items = await this.getAll(storeName);
    return JSON.stringify(items).length * 2; // Approximate size in bytes (UTF-16 = 2 bytes per char)
  }

  /**
   * Get all store sizes
   */
  async getAllStoreSizes(): Promise<Record<IndexedDBStore, number>> {
    const sizes: Record<IndexedDBStore, number> = {} as any;

    for (const storeName of Object.values(IndexedDBStore)) {
      try {
        sizes[storeName] = await this.getStoreSize(storeName);
      } catch (error) {
        console.error(`Failed to get size for ${storeName}:`, error);
        sizes[storeName] = 0;
      }
    }

    return sizes;
  }

  /**
   * Cache data with metadata
   */
  async cache<T>(
    key: string,
    data: T,
    storeName: IndexedDBStore,
    ttl?: number
  ): Promise<void> {
    const metadata: CacheMetadata = {
      key,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
      size: JSON.stringify(data).length * 2,
    };

    await this.add(IndexedDBStore.CACHE_METADATA, metadata);
    await this.add(storeName, data);
  }

  /**
   * Get cached data
   */
  async getCached<T>(
    key: string,
    storeName: IndexedDBStore
  ): Promise<{ data?: T; expired: boolean } | null> {
    const metadata = await this.get<CacheMetadata>(IndexedDBStore.CACHE_METADATA, key);

    if (!metadata) {
      return null;
    }

    const expired = metadata.expiresAt ? Date.now() > metadata.expiresAt : false;

    if (expired) {
      return { expired: true };
    }

    const data = await this.get<T>(storeName, key);
    return data ? { data, expired } : null;
  }

  /**
   * Delete cached data
   */
  async deleteCached(key: string, storeName: IndexedDBStore): Promise<void> {
    await this.delete(IndexedDBStore.CACHE_METADATA, key);
    await this.delete(storeName, key);
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(storeName: IndexedDBStore): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IndexedDBStore.CACHE_METADATA, storeName], 'readwrite');
      const metadataStore = transaction.objectStore(IndexedDBStore.CACHE_METADATA);
      const dataStore = transaction.objectStore(storeName);

      let clearedCount = 0;

      const request = metadataStore.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const metadata: CacheMetadata = cursor.value;

          if (metadata.expiresAt && Date.now() > metadata.expiresAt) {
            dataStore.delete(metadata.key);
            metadataStore.delete(metadata.key);
            clearedCount++;
          }

          cursor.continue();
        } else {
          resolve(clearedCount);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store offline mutation
   */
  async storeOfflineMutation(mutation: Omit<OfflineMutation, 'timestamp'>): Promise<void> {
    const fullMutation: OfflineMutation = {
      ...mutation,
      timestamp: Date.now(),
    };
    await this.add(IndexedDBStore.OFFLINE_MUTATIONS, fullMutation);
  }

  /**
   * Get offline mutations
   */
  async getOfflineMutations(): Promise<OfflineMutation[]> {
    return await this.getAll<OfflineMutation>(IndexedDBStore.OFFLINE_MUTATIONS);
  }

  /**
   * Update mutation status
   */
  async updateMutationStatus(id: string, status: OfflineMutation['status']): Promise<void> {
    const mutation = await this.get<OfflineMutation>(IndexedDBStore.OFFLINE_MUTATIONS, id);
    if (mutation) {
      await this.update(IndexedDBStore.OFFLINE_MUTATIONS, {
        ...mutation,
        status,
      });
    }
  }

  /**
   * Delete mutation
   */
  async deleteMutation(id: string): Promise<void> {
    await this.delete(IndexedDBStore.OFFLINE_MUTATIONS, id);
  }

  /**
   * Clear all mutations
   */
  async clearMutations(): Promise<void> {
    await this.clear(IndexedDBStore.OFFLINE_MUTATIONS);
  }

  /**
   * Batch operations
   */
  async batchAdd<T>(storeName: IndexedDBStore, items: T[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      items.forEach((item) => {
        store.add(item);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Search items by index (if exists)
   */
  async search<T>(
    storeName: IndexedDBStore,
    query: string,
    indexName?: string
  ): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = indexName ? store.index(indexName) : null;

      if (index) {
        const request = index.getAll(query);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } else {
        const request = store.getAll();
        request.onsuccess = () => {
          const allItems = request.result as T[];
          // Simple text search
          const filtered = allItems.filter((item: any) => {
            const itemString = JSON.stringify(item).toLowerCase();
            return itemString.includes(query.toLowerCase());
          });
          resolve(filtered);
        };
        request.onerror = () => reject(request.error);
      }
    });
  }
}

// Export singleton instance
export const indexedDB = new IndexedDBManager();

/**
 * Convenience functions for common operations
 */
export async function cacheProducts(products: any[], ttl: number = 3600000): Promise<void> {
  await indexedDB.cache('all', products, IndexedDBStore.PRODUCTS, ttl);
}

export async function getCachedProducts(): Promise<any[] | null> {
  const result = await indexedDB.getCached('all', IndexedDBStore.PRODUCTS);
  return result && !result.expired ? (result.data as any[]) : null;
}

export async function cacheCategories(categories: any[], ttl: number = 7200000): Promise<void> {
  await indexedDB.cache('all', categories, IndexedDBStore.CATEGORIES, ttl);
}

export async function getCachedCategories(): Promise<any[] | null> {
  const result = await indexedDB.getCached('all', IndexedDBStore.CATEGORIES);
  return result && !result.expired ? (result.data as any[]) : null;
}

export async function getCacheSize(): Promise<number> {
  const sizes = await indexedDB.getAllStoreSizes();
  return Object.values(sizes).reduce((total, size) => total + size, 0);
}
