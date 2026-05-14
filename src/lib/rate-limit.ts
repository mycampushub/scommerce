/**
 * Distributed rate limiter for Next.js API routes
 * Uses Cloudflare KV for production with in-memory fallback for development
 */

import { Env } from '@/db/types';

interface RateLimitData {
  count: number;
  resetTime: number;
}

export interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
}

export interface RateLimitResult {
  success: boolean;
  remainingRequests?: number;
  resetTime?: number;
}

// In-memory rate limit storage (fallback when KV is not available)
interface InMemoryEntry {
  count: number;
  window: number;
  resetTime: number;
}

const inMemoryStore = new Map<string, InMemoryEntry>();
const IN_MEMORY_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clean up expired in-memory entries
 */
function cleanupInMemoryStore(): void {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (now > entry.resetTime) {
      inMemoryStore.delete(key);
    }
  }
}

/**
 * Get or create in-memory entry
 */
function getInMemoryEntry(identifier: string, window: number, maxRequests: number): InMemoryEntry {
  const now = Date.now();
  const entry = inMemoryStore.get(identifier);

  // If entry exists and is in current window, update it
  if (entry && entry.window === window && now < entry.resetTime) {
    return entry;
  }

  // Create new entry
  const newEntry: InMemoryEntry = {
    count: 0,
    window,
    resetTime: now + Math.ceil(now / 60000) * 60000, // End of current minute
  };
  inMemoryStore.set(identifier, newEntry);
  return newEntry;
}

/**
 * Rate limit middleware for API routes
 * Uses Cloudflare KV for distributed rate limiting with in-memory fallback
 * @param env - Environment object containing KV binding (optional)
 * @param identifier - Unique identifier (e.g., IP address, user ID, email)
 * @param options - Rate limiting options
 * @returns Rate limit result
 */
export async function rateLimit(
  env: Env | null,
  identifier: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const {
    maxRequests = 5, // Default: 5 requests per window
    windowMs = 60 * 1000, // Default: 1 minute window
  } = options;

  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const rateLimitKey = `ratelimit:${identifier}:${window}`;

  // Use KV if available
  if (env?.KV) {
    try {
      const KV = env.KV;

      // Get current count from KV
      const currentValue = await KV.get(rateLimitKey, 'text');
      const count = (currentValue && typeof currentValue === 'string') ? parseInt(currentValue) : 0;

      // Check if limit exceeded
      if (count >= maxRequests) {
        const nextWindow = Math.floor((now + windowMs) / windowMs) * windowMs;
        return {
          success: false,
          remainingRequests: 0,
          resetTime: nextWindow,
        };
      }

      // Increment count in KV with TTL
      const newCount = count + 1;
      const ttl = Math.ceil(windowMs / 1000); // Convert to seconds
      await KV.put(rateLimitKey, newCount.toString(), {
        expirationTtl: ttl,
      });

      return {
        success: true,
        remainingRequests: maxRequests - newCount,
        resetTime: now + windowMs,
      };
    } catch (error) {
      console.error('KV rate limit error:', error);

      // Fall back to in-memory storage on KV error
      console.warn('Falling back to in-memory rate limiting due to KV error');
    }
  }

  // In-memory fallback (development or when KV is not available)
  cleanupInMemoryStore();

  const entry = getInMemoryEntry(identifier, window, maxRequests);

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    return {
      success: false,
      remainingRequests: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count += 1;
  inMemoryStore.set(identifier, entry);

  return {
    success: true,
    remainingRequests: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Reset rate limit for a specific identifier
 * @param env - Environment object containing KV binding
 * @param identifier - Unique identifier to reset
 */
export async function resetRateLimit(
  env: Env | null,
  identifier: string
): Promise<void> {
  if (env?.KV) {
    const now = Date.now();
    const window = Math.floor(now / 60000); // 1-minute window
    const rateLimitKey = `ratelimit:${identifier}:${window}`;

    try {
      await env.KV.delete(rateLimitKey);
    } catch (error) {
      console.error('KV delete error:', error);
    }
  }

  // Also clear from in-memory store
  inMemoryStore.delete(identifier);
}

/**
 * Get IP address from request
 */
export function getClientIp(request: Request): string {
  // Try various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a hash of request (not ideal but prevents tracking)
  return 'anonymous-' + Date.now().toString(36);
}

/**
 * Rate limiting response helper
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      resetTime: result.resetTime,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': result.remainingRequests?.toString() || '0',
        'X-RateLimit-Reset': result.resetTime?.toString() || '0',
        'Retry-After': Math.ceil(((result.resetTime || 0) - Date.now()) / 1000).toString(),
      },
    }
  );
}

/**
 * Get rate limit statistics (for debugging/monitoring)
 */
export function getRateLimitStats(): { inMemoryEntries: number; keys: string[] } {
  cleanupInMemoryStore();
  return {
    inMemoryEntries: inMemoryStore.size,
    keys: Array.from(inMemoryStore.keys()),
  };
}
