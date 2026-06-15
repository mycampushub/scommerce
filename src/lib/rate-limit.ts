import { logger } from './logger';

// Simple in-memory rate limiter for development
// In production, this should be replaced with Redis-based solutions like @upstash/ratelimit

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  windowStart: number;
}

class InMemoryRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly maxEntries = 10000; // Prevent memory leak

  constructor() {
    // Cleanup old entries every minute (using setTimeout recursively for Cloudflare Workers compatibility)
    this.scheduleCleanup();
  }

  private scheduleCleanup() {
    // Use setTimeout instead of setInterval for Cloudflare Workers compatibility
    this.cleanupTimer = setTimeout(() => {
      this.cleanup();
      this.scheduleCleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }

    // Prevent unbounded growth
    if (this.store.size > this.maxEntries) {
      const keys = Array.from(this.store.keys());
      const keysToDelete = keys.slice(0, keys.length - this.maxEntries);
      for (const key of keysToDelete) {
        this.store.delete(key);
      }
    }
  }

  async limit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // Reset window if expired
    if (!entry || entry.resetTime < now) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs,
        windowStart: now
      };
      this.store.set(identifier, newEntry);

      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        reset: newEntry.resetTime
      };
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      logger.warn('Rate limit exceeded', {
        identifier,
        limit: config.maxRequests,
        windowMs: config.windowMs
      });

      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: entry.resetTime
      };
    }

    // Increment counter
    entry.count++;
    this.store.set(identifier, entry);

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - entry.count,
      reset: entry.resetTime
    };
  }

  async reset(identifier: string): Promise<void> {
    this.store.delete(identifier);
  }

  destroy() {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.store.clear();
  }
}

// Create singleton instance
const rateLimiter = new InMemoryRateLimiter();

// Rate limit configurations
export const rateLimitConfigs = {
  // Public API: 100 requests per minute
  public: { maxRequests: 100, windowMs: 60 * 1000 },

  // Auth endpoints: 5 requests per minute
  auth: { maxRequests: 5, windowMs: 60 * 1000 },

  // Contact form: 5 per hour
  contact: { maxRequests: 5, windowMs: 60 * 60 * 1000 },

  // Password reset: 3 per hour
  passwordReset: { maxRequests: 3, windowMs: 60 * 60 * 1000 },

  // Admin APIs: 1000 per minute per user
  admin: { maxRequests: 1000, windowMs: 60 * 1000 }
} as const;

export type RateLimitType = keyof typeof rateLimitConfigs;

/**
 * Check rate limit for an identifier
 * @param identifier Unique identifier (IP address, user ID, etc.)
 * @param type Type of rate limit to check
 * @returns Rate limit status
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'public'
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
  const config = rateLimitConfigs[type];
  const result = await rateLimiter.limit(identifier, config);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset
  };
}

/**
 * Get rate limit headers for the response
 * @param identifier Unique identifier
 * @param type Type of rate limit
 * @returns Object with rate limit headers
 */
export async function getRateLimitHeaders(
  identifier: string,
  type: RateLimitType = 'public'
): Promise<Record<string, string>> {
  const result = await rateLimiter.limit(identifier, rateLimitConfigs[type]);

  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString()
  };
}

/**
 * Extract IP address from request headers
 */
export function getClientIp(request: Request): string {
  // Check Cloudflare headers first
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  // Check for forwarded headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Fallback (this might not work in all environments)
  return 'unknown';
}

/**
 * Rate limit middleware for API routes
 * Returns null if rate limit is not exceeded, or a Response object if it is
 */
export async function rateLimitMiddleware(
  request: Request,
  type: RateLimitType = 'public',
  userId?: string
): Promise<Response | null> {
  // Use user ID for rate limiting if available, otherwise use IP
  const identifier = userId || getClientIp(request);

  const result = await checkRateLimit(identifier, type);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again after ${new Date(result.reset!).toLocaleString()}`
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit?.toString() || '0',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(result.reset!).toISOString(),
          'Retry-After': Math.ceil((result.reset! - Date.now()) / 1000).toString()
        }
      }
    );
  }

  return null;
}

// Export the limiter instance for testing purposes
export const _rateLimiter = rateLimiter;

/**
 * Legacy rate limit function for backward compatibility
 * @deprecated Use checkRateLimit or rateLimitMiddleware instead
 */
export async function rateLimit(
  env: any,
  key: string,
  config: RateLimitConfig
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  return await rateLimiter.limit(key, config);
}

/**
 * Create a rate limit response for exceeded limits
 * @param result Rate limit result from checkRateLimit or rateLimit
 */
export function createRateLimitResponse(
  result: { success: boolean; limit: number; remaining: number; reset: number }
): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again after ${new Date(result.reset).toLocaleString()}`
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.reset).toISOString(),
        'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString()
      }
    }
  );
}
