/**
 * Cache Versioning System
 *
 * Provides centralized cache version management for all caching layers:
 * - CDN cache (Cloudflare)
 * - Service Worker cache
 * - API response cache
 * - React Query cache
 *
 * This enables easy cache busting by incrementing the version number.
 */

/**
 * Current cache version
 * Format: major.minor.patch (e.g., 1.0.0, 1.0.1, 1.1.0, 2.0.0)
 *
 * When to bump:
 * - Major (X.0.0): Breaking changes to API or data structure
 * - Minor (0.X.0): New features or cache strategy changes
 * - Patch (0.0.X): Bug fixes or minor cache adjustments
 *
 * To bust all caches, simply increment the version number.
 * All cache keys will automatically include the new version.
 */
export const CACHE_VERSION = process.env.NEXT_PUBLIC_CACHE_VERSION || '1.0.0';

/**
 * Cache version for API responses
 * Used in X-Cache-Version header
 */
export const API_CACHE_VERSION = CACHE_VERSION;

/**
 * Generate versioned cache key
 * Prefixes cache keys with version number for easy busting
 *
 * @param baseKey - Base cache key (e.g., 'products:all', 'cart:user:123')
 * @returns Versioned cache key (e.g., 'v100:products:all')
 *
 * @example
 * const cacheKey = getVersionedKey('products:all');
 * // Returns: 'v100:products:all' (for version 1.0.0)
 */
export function getVersionedKey(baseKey: string): string {
  // Remove dots from version for cache key (e.g., 1.0.0 -> 100)
  const versionNumber = CACHE_VERSION.replace(/\./g, '');
  return `v${versionNumber}:${baseKey}`;
}

/**
 * Parse cache version from cache key
 * Extracts version number from versioned cache key
 *
 * @param versionedKey - Versioned cache key (e.g., 'v100:products:all')
 * @returns { version: string, baseKey: string } or null if invalid
 *
 * @example
 * const parsed = parseCacheKey('v100:products:all');
 * // Returns: { version: '100', baseKey: 'products:all' }
 */
export function parseCacheKey(versionedKey: string): { version: string; baseKey: string } | null {
  const match = versionedKey.match(/^v(\d+):(.+)$/);
  if (!match) {
    return null;
  }
  return {
    version: match[1],
    baseKey: match[2],
  };
}

/**
 * Generate versioned cache name for service worker
 * Creates cache names with version for automatic cleanup
 *
 * @param cacheType - Type of cache (api, static, images, etc.)
 * @returns Versioned cache name (e.g., 'api-v100')
 *
 * @example
 * const cacheName = getVersionedCacheName('api');
 * // Returns: 'api-v100' (for version 1.0.0)
 */
export function getVersionedCacheName(cacheType: string): string {
  const versionNumber = CACHE_VERSION.replace(/\./g, '');
  return `${cacheType}-v${versionNumber}`;
}

/**
 * Service worker cache names with versioning
 * These will automatically create new caches when version changes
 */
export const SW_CACHE_NAMES = {
  /** API responses cache */
  API: getVersionedCacheName('api'),

  /** Static resources (JS, CSS, HTML) */
  STATIC: getVersionedCacheName('static'),

  /** Images cache */
  IMAGES: getVersionedCacheName('images'),

  /** Network-first cache */
  NETWORK_FIRST: getVersionedCacheName('network-first'),

  /** Offline mutation queue */
  OFFLINE_QUEUE: getVersionedCacheName('offline-queue'),
} as const;

/**
 * CDN cache busting URL parameter
 * Append this to URLs to bust CDN cache
 *
 * @param url - Base URL
 * @returns URL with version parameter (e.g., '/api/products?v=100')
 *
 * @example
 * const url = bustCDNCache('/api/products');
 * // Returns: '/api/products?v=100'
 */
export function bustCDNCache(url: string): string {
  const versionNumber = CACHE_VERSION.replace(/\./g, '');
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${versionNumber}`;
}

/**
 * Get cache version from request headers
 * Extracts X-Cache-Version header from API request
 *
 * @param headers - Request headers
 * @returns Cache version from header or default version
 */
export function getCacheVersionFromHeaders(headers: Headers): string {
  const cacheVersion = headers.get('X-Cache-Version');
  return cacheVersion || CACHE_VERSION;
}

/**
 * Check if cache version matches current version
 * Used to detect version mismatches and trigger cache invalidation
 *
 * @param version - Version to check
 * @returns true if version matches current, false otherwise
 */
export function isCurrentVersion(version: string): boolean {
  return version === CACHE_VERSION;
}

/**
 * Extract version parts for comparison
 *
 * @param version - Version string (e.g., '1.0.0')
 * @returns [major, minor, patch] as numbers
 */
function parseVersion(version: string): [number, number, number] {
  const parts = version.split('.').map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

/**
 * Compare two version numbers
 *
 * @param version1 - First version
 * @param version2 - Second version
 * @returns 1 if version1 > version2, -1 if version1 < version2, 0 if equal
 */
export function compareVersions(version1: string, version2: string): number {
  const [major1, minor1, patch1] = parseVersion(version1);
  const [major2, minor2, patch2] = parseVersion(version2);

  if (major1 !== major2) return major1 > major2 ? 1 : -1;
  if (minor1 !== minor2) return minor1 > minor2 ? 1 : -1;
  if (patch1 !== patch2) return patch1 > patch2 ? 1 : -1;
  return 0;
}

/**
 * Check if provided version is newer than current
 *
 * @param version - Version to check
 * @returns true if provided version is newer
 */
export function isNewerVersion(version: string): boolean {
  return compareVersions(version, CACHE_VERSION) > 0;
}

/**
 * Check if provided version is older than current
 *
 * @param version - Version to check
 * @returns true if provided version is older
 */
export function isOlderVersion(version: string): boolean {
  return compareVersions(version, CACHE_VERSION) < 0;
}

/**
 * Cache version metadata
 * Provides information about current cache version
 */
export const CacheVersionInfo = {
  /** Current version string */
  version: CACHE_VERSION,

  /** Version as number (without dots) */
  versionNumber: CACHE_VERSION.replace(/\./g, ''),

  /** Version parts */
  parts: parseVersion(CACHE_VERSION),

  /** All cache names with version */
  cacheNames: SW_CACHE_NAMES,

  /** Check if version is current */
  isCurrent: (version: string) => isCurrentVersion(version),

  /** Compare versions */
  compare: (v1: string, v2: string) => compareVersions(v1, v2),
} as const;

/**
 * Export default for easy importing
 */
const CacheVersionDefault = {
  CACHE_VERSION,
  API_CACHE_VERSION,
  getVersionedKey,
  parseCacheKey,
  getVersionedCacheName,
  SW_CACHE_NAMES,
  bustCDNCache,
  getCacheVersionFromHeaders,
  isCurrentVersion,
  compareVersions,
  isNewerVersion,
  isOlderVersion,
  CacheVersionInfo,
};

export default CacheVersionDefault;
