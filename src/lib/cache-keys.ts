/**
 * Cache Key Optimization
 * Generate consistent and optimized cache keys for better hit rates
 */

export interface CacheKeyOptions {
  version?: string;
  namespace?: string;
  includeParams?: boolean;
  excludeParams?: string[];
  includeUser?: boolean;
  includeRole?: boolean;
  includeLocale?: boolean;
  ttl?: number;
}

/**
 * Cache Key Generator
 */
class CacheKeyGenerator {
  private defaultOptions: CacheKeyOptions = {
    version: 'v1',
    includeParams: false,
    excludeParams: [],
    includeUser: false,
    includeRole: false,
    includeLocale: false,
  };

  /**
   * Generate cache key for API route
   */
  forRoute(path: string, options: CacheKeyOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options };

    // Start with namespace if provided
    let keyParts: string[] = [];

    if (opts.namespace) {
      keyParts.push(opts.namespace);
    }

    // Add version
    if (opts.version) {
      keyParts.push(opts.version);
    }

    // Add path (normalized)
    const normalizedPath = this.normalizePath(path);
    keyParts.push(normalizedPath);

    // Add user ID if needed
    if (opts.includeUser && typeof window !== 'undefined') {
      const userId = this.getUserId();
      if (userId) {
        keyParts.push(`user:${userId}`);
      }
    }

    // Add role if needed
    if (opts.includeRole && typeof window !== 'undefined') {
      const role = this.getUserRole();
      if (role) {
        keyParts.push(`role:${role}`);
      }
    }

    // Add locale if needed
    if (opts.includeLocale && typeof window !== 'undefined') {
      const locale = this.getLocale();
      if (locale) {
        keyParts.push(`locale:${locale}`);
      }
    }

    // Join parts
    const key = keyParts.join(':');

    return key;
  }

  /**
   * Generate cache key with query parameters
   */
  forRouteWithParams(
    path: string,
    params: Record<string, string | number | boolean>,
    options: CacheKeyOptions = {}
  ): string {
    const opts = { ...this.defaultOptions, ...options };
    let keyParts: string[] = [];

    // Add base key
    const baseKey = this.forRoute(path, opts);
    keyParts.push(baseKey);

    // Add sorted query parameters
    const sortedParams = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));

    // Filter out excluded params
    const filteredParams = sortedParams.filter(
      ([key]) => !opts.excludeParams || !opts.excludeParams.includes(key)
    );

    // Add parameters to key
    if (filteredParams.length > 0) {
      const paramString = filteredParams
        .map(([key, value]) => `${key}=${this.normalizeValue(value)}`)
        .join('&');
      keyParts.push(`params:${paramString}`);
    }

    return keyParts.join(':');
  }

  /**
   * Generate cache key for entity
   */
  forEntity(entityType: string, entityId: string, options: CacheKeyOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options };

    let keyParts: string[] = [];

    if (opts.namespace) {
      keyParts.push(opts.namespace);
    }

    if (opts.version) {
      keyParts.push(opts.version);
    }

    keyParts.push(entityType);
    keyParts.push(entityId);

    return keyParts.join(':');
  }

  /**
   * Generate cache key for search results
   */
  forSearch(query: string, filters?: Record<string, any>, options: CacheKeyOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options };

    let keyParts: string[] = [];

    if (opts.namespace) {
      keyParts.push(opts.namespace);
    }

    if (opts.version) {
      keyParts.push(opts.version);
    }

    keyParts.push('search');

    // Add normalized query
    keyParts.push(this.normalizeValue(query.trim()));

    // Add filters
    if (filters && Object.keys(filters).length > 0) {
      const sortedFilters = Object.entries(filters).sort(([a], [b]) => a.localeCompare(b));
      const filterString = sortedFilters
        .map(([key, value]) => `${key}:${this.normalizeValue(value)}`)
        .join(',');
      keyParts.push(`filters:${filterString}`);
    }

    return keyParts.join(':');
  }

  /**
   * Generate cache key for list
   */
  forList(listType: string, options: CacheKeyOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options };

    let keyParts: string[] = [];

    if (opts.namespace) {
      keyParts.push(opts.namespace);
    }

    if (opts.version) {
      keyParts.push(opts.version);
    }

    keyParts.push('list');
    keyParts.push(listType);

    return keyParts.join(':');
  }

  /**
   * Parse cache key to extract components
   */
  parseKey(key: string): {
    version?: string;
    namespace?: string;
    path?: string;
    entityType?: string;
    entityId?: string;
    params?: string;
    user?: string;
    role?: string;
    locale?: string;
  } {
    const parts = key.split(':');
    const result: any = {};

    parts.forEach((part, index) => {
      if (part.startsWith('v') && /^\d+$/.test(part.replace('v', ''))) {
        result.version = part;
      } else if (part.startsWith('user:')) {
        result.user = part.replace('user:', '');
      } else if (part.startsWith('role:')) {
        result.role = part.replace('role:', '');
      } else if (part.startsWith('locale:')) {
        result.locale = part.replace('locale:', '');
      } else if (part.startsWith('params:')) {
        result.params = part.replace('params:', '');
      } else if (part === 'search' || part === 'list') {
        // Skip, these are markers
      } else if (result.path === undefined) {
        result.path = part;
      } else if (result.entityId === undefined) {
        result.entityId = part;
      }
    });

    return result;
  }

  /**
   * Generate cache key hash (for very long keys)
   */
  hashKey(key: string): string {
    // Simple hash function for very long keys
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `hash:${hash.toString(36)}`;
  }

  /**
   * Normalize URL path
   */
  private normalizePath(path: string): string {
    return path
      .replace(/^\/+/, '') // Remove leading slashes
      .replace(/\/+/g, '/') // Replace multiple slashes with single
      .replace(/\/$/, '') // Remove trailing slash
      .toLowerCase();
  }

  /**
   * Normalize value (string, number, boolean)
   */
  private normalizeValue(value: any): string {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return String(value);
  }

  /**
   * Get user ID from localStorage/session
   */
  private getUserId(): string | null {
    try {
      const session = localStorage.getItem('session');
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.user?.id || null;
      }
    } catch (error) {
      console.error('Failed to get user ID:', error);
    }
    return null;
  }

  /**
   * Get user role from localStorage/session
   */
  private getUserRole(): string | null {
    try {
      const session = localStorage.getItem('session');
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.user?.role || null;
      }
    } catch (error) {
      console.error('Failed to get user role:', error);
    }
    return null;
  }

  /**
   * Get locale from localStorage
   */
  private getLocale(): string | null {
    try {
      return localStorage.getItem('locale') || 'en';
    } catch (error) {
      console.error('Failed to get locale:', error);
    }
    return null;
  }

  /**
   * Invalidate cache keys by pattern
   */
  getInvalidationPattern(
    path?: string,
    entity?: string,
    options: CacheKeyOptions = {}
  ): string[] {
    const patterns: string[] = [];
    const opts = { ...this.defaultOptions, ...options };

    if (path) {
      const normalizedPath = this.normalizePath(path);
      patterns.push(`.*:${normalizedPath}.*`);
    }

    if (entity) {
      patterns.push(`.*:${entity}:.*`);
    }

    if (opts.namespace) {
      patterns.push(`${opts.namespace}:.*`);
    }

    if (opts.version) {
      patterns.push(`.*:${opts.version}:.*`);
    }

    return patterns;
  }
}

// Export singleton instance
export const cacheKeys = new CacheKeyGenerator();

/**
 * Convenience functions for common cache key scenarios
 */

export function generateCacheKey(
  path: string,
  params?: Record<string, string | number | boolean>,
  options?: CacheKeyOptions
): string {
  if (params) {
    return cacheKeys.forRouteWithParams(path, params, options);
  }
  return cacheKeys.forRoute(path, options);
}

export function generateEntityCacheKey(
  entityType: string,
  entityId: string,
  options?: CacheKeyOptions
): string {
  return cacheKeys.forEntity(entityType, entityId, options);
}

export function generateSearchCacheKey(
  query: string,
  filters?: Record<string, any>,
  options?: CacheKeyOptions
): string {
  return cacheKeys.forSearch(query, filters, options);
}

export function generateListCacheKey(
  listType: string,
  options?: CacheKeyOptions
): string {
  return cacheKeys.forList(listType, options);
}

/**
 * Cache key options for different scenarios
 */
export const CACHE_KEY_OPTIONS = {
  // Products
  products: {
    version: 'v1',
    namespace: 'products',
    ttl: 600000, // 10 minutes
  },

  // Categories
  categories: {
    version: 'v1',
    namespace: 'categories',
    ttl: 7200000, // 2 hours
  },

  // User-specific data
  userCart: {
    version: 'v1',
    namespace: 'cart',
    includeUser: true,
    ttl: 1800000, // 30 minutes
  },

  userWishlist: {
    version: 'v1',
    namespace: 'wishlist',
    includeUser: true,
    ttl: 3600000, // 1 hour
  },

  userOrders: {
    version: 'v1',
    namespace: 'orders',
    includeUser: true,
    ttl: 600000, // 10 minutes
  },

  // Search results
  search: {
    version: 'v1',
    namespace: 'search',
    ttl: 300000, // 5 minutes
  },

  // Admin data (shorter TTL for real-time updates)
  adminProducts: {
    version: 'v1',
    namespace: 'admin-products',
    includeRole: true,
    ttl: 60000, // 1 minute
  },

  adminOrders: {
    version: 'v1',
    namespace: 'admin-orders',
    includeRole: true,
    ttl: 60000, // 1 minute
  },
} as const;
