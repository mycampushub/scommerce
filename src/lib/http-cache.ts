/**
 * HTTP Caching Middleware
 * Provides CDN and browser caching strategies for API responses
 */

import { NextRequest, NextResponse } from 'next/server';

export interface CacheConfig {
  /** Cache duration in seconds */
  maxAge?: number;
  /** Shared cache (CDN) duration in seconds */
  sMaxAge?: number;
  /** Cache in private (browser) or public (CDN) */
  isPublic?: boolean;
  /** Must revalidate before using stale cache */
  mustRevalidate?: boolean;
  /** Allow stale content while revalidating */
  staleWhileRevalidate?: number;
  /** Allow stale content on error */
  staleIfError?: number;
  /** ETag for entity validation */
  etag?: string;
  /** Last-Modified timestamp */
  lastModified?: Date;
}

/**
 * Add caching headers to NextResponse
 */
export function addCacheHeaders(
  response: NextResponse,
  config: CacheConfig
): NextResponse {
  const {
    maxAge = 0,
    sMaxAge = maxAge,
    isPublic = true,
    mustRevalidate = false,
    staleWhileRevalidate,
    staleIfError,
    etag,
    lastModified,
  } = config;

  const directives: string[] = [];

  if (isPublic) {
    directives.push('public');
  } else {
    directives.push('private');
  }

  if (maxAge > 0) {
    directives.push(`max-age=${maxAge}`);
  }

  if (sMaxAge > 0 && isPublic) {
    directives.push(`s-maxage=${sMaxAge}`);
  }

  if (mustRevalidate) {
    directives.push('must-revalidate');
  }

  if (staleWhileRevalidate) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  if (staleIfError) {
    directives.push(`stale-if-error=${staleIfError}`);
  }

  response.headers.set('Cache-Control', directives.join(', '));

  // Add ETag if provided
  if (etag) {
    response.headers.set('ETag', etag);
  }

  // Add Last-Modified if provided
  if (lastModified) {
    response.headers.set('Last-Modified', lastModified.toUTCString());
  }

  return response;
}

/**
 * Check if request can be served from cache
 */
export function canServeFromCache(request: NextRequest): boolean {
  const method = request.method;

  // Only GET and HEAD requests can be cached
  if (!['GET', 'HEAD'].includes(method)) {
    return false;
  }

  // Check cache-control headers from client
  const cacheControl = request.headers.get('Cache-Control');
  if (cacheControl) {
    // If client explicitly asks for fresh content, bypass cache
    if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
      return false;
    }
  }

  // Check if client has conditional request (ETag or If-Modified-Since)
  const ifNoneMatch = request.headers.get('If-None-Match');
  const ifModifiedSince = request.headers.get('If-Modified-Since');

  return !!(ifNoneMatch || ifModifiedSince);
}

/**
 * Generate ETag from data
 */
export function generateETag(data: string | unknown): string {
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);

  // Simple hash-based ETag
  let hash = 0;
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `"${hash.toString(16)}"`;
}

/**
 * Create 304 Not Modified response for conditional requests
 */
export function createNotModifiedResponse(lastModified?: Date): NextResponse {
  const response = new NextResponse(null, { status: 304 });

  if (lastModified) {
    response.headers.set('Last-Modified', lastModified.toUTCString());
  }

  response.headers.set('Cache-Control', 'public, max-age=60');
  return response;
}

/**
 * Handle conditional request and return 304 if not modified
 */
export function handleConditionalRequest(
  request: NextRequest,
  etag: string,
  lastModified?: Date,
  data: string | unknown
): NextResponse | null {
  const ifNoneMatch = request.headers.get('If-None-Match');
  const ifModifiedSince = request.headers.get('If-Modified-Since');

  // Check ETag
  if (ifNoneMatch && ifNoneMatch === etag) {
    return createNotModifiedResponse(lastModified);
  }

  // Check Last-Modified
  if (ifModifiedSince && lastModified) {
    const modifiedSince = new Date(ifModifiedSince);
    if (modifiedSince >= lastModified) {
      return createNotModifiedResponse(lastModified);
    }
  }

  return null;
}

/**
 * Cache configuration presets for different resource types
 */
export const CachePresets = {
  /** Static content - cache for long time */
  STATIC: {
    maxAge: 86400, // 24 hours
    sMaxAge: 86400,
    isPublic: true,
    mustRevalidate: false,
  },

  /** Semi-static content - cache for moderate time */
  SEMI_STATIC: {
    maxAge: 3600, // 1 hour
    sMaxAge: 3600,
    isPublic: true,
    mustRevalidate: true,
  },

  /** Dynamic content - short cache with stale support */
  DYNAMIC: {
    maxAge: 60, // 1 minute
    sMaxAge: 60,
    isPublic: true,
    mustRevalidate: true,
    staleWhileRevalidate: 300, // 5 minutes
    staleIfError: 60,
  },

  /** User-specific content - private cache */
  PRIVATE: {
    maxAge: 300, // 5 minutes
    isPublic: false,
    mustRevalidate: true,
  },

  /** Real-time content - minimal cache */
  REALTIME: {
    maxAge: 10, // 10 seconds
    sMaxAge: 10,
    isPublic: true,
    mustRevalidate: true,
  },

  /** No cache - always fresh */
  NO_CACHE: {
    maxAge: 0,
    isPublic: true,
    mustRevalidate: true,
  },
} as const;

/**
 * Middleware wrapper for API routes with caching
 */
export function withHttpCache(
  handler: (request: NextRequest) => Promise<NextResponse>,
  cacheConfig: CacheConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check if we can serve from cache
    if (canServeFromCache(request)) {
      // Let the handler check for conditional requests
      const response = await handler(request);

      // If handler returned null, it means we should have served from cache
      if (response.status === 304) {
        return response;
      }

      return response;
    }

    // Execute handler normally
    const response = await handler(request);

    // Add cache headers
    return addCacheHeaders(response, cacheConfig);
  };
}

/**
 * API Response with built-in caching
 */
export class CachedResponse {
  static json(
    data: unknown,
    config: CacheConfig = {}
  ): NextResponse {
    const response = NextResponse.json(data);
    return addCacheHeaders(response, config);
  }

  static withETag(
    data: unknown,
    config: Omit<CacheConfig, 'etag'> = {}
  ): NextResponse {
    const etag = generateETag(data);
    const response = NextResponse.json(data);
    return addCacheHeaders(response, { ...config, etag });
  }
}

/**
 * Compression hint for Cloudflare
 */
export function enableCompression(response: NextResponse): NextResponse {
  // Cloudflare automatically compresses, but we can add hints
  response.headers.set('Vary', 'Accept-Encoding');
  return response;
}
