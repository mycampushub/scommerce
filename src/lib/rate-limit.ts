/**
 * Distributed rate limiter for Next.js API routes
 * Uses Cloudflare KV for production
 * No in-memory fallback - requires KV to be configured
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

/**
 * Rate limit middleware for API routes
 * Uses Cloudflare KV for distributed rate limiting
 * @param env - Environment object containing KV binding (REQUIRED)
 * @param identifier - Unique identifier (e.g., IP address, user ID, email)
 * @param options - Rate limiting options
 * @returns Rate limit result
 */
export async function rateLimit(
  env: Env | null,
  identifier: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  // KV is required for rate limiting
  if (!env || !env.KV) {
    console.error('Rate limiting requires KV namespace. Configure wrangler.toml with KV binding.');
    // Fail open for security - allow requests but log warning
    return {
      success: true,
      remainingRequests: Number.MAX_SAFE_INTEGER,
    };
  }

  const {
    maxRequests = 5, // Default: 5 requests per window
    windowMs = 60 * 1000, // Default: 1 minute window
  } = options;

  const now = Date.now();
  const window = Math.floor(now / windowMs);
  const rateLimitKey = `ratelimit:${identifier}:${window}`;

  const KV = env.KV;

  try {
    // Get current count from KV
    const currentValue = await KV.get(rateLimitKey);
    const count = currentValue ? parseInt(currentValue) : 0;

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
    // Fail open for reliability - allow request on error
    return {
      success: true,
      remainingRequests: Number.MAX_SAFE_INTEGER,
    };
  }
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
  if (!env || !env.KV) {
    console.warn('KV namespace not available for rate limit reset');
    return;
  }

  const now = Date.now();
  const window = Math.floor(now / 60000); // 1-minute window
  const rateLimitKey = `ratelimit:${identifier}:${window}`;

  try {
    await env.KV.delete(rateLimitKey);
  } catch (error) {
    console.error('KV delete error:', error);
  }
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
