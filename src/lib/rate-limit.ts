/**
 * In-memory rate limiter for Next.js API routes
 * Prevents brute force attacks by limiting requests per IP address
 */

interface RateLimitData {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitData>();

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
 * @param identifier - Unique identifier (e.g., IP address, user ID, email)
 * @param options - Rate limiting options
 * @returns Rate limit result
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const {
    maxRequests = 5, // Default: 5 requests per window
    windowMs = 60 * 1000, // Default: 1 minute window
  } = options;

  const now = Date.now();
  const data = rateLimitMap.get(identifier);

  // Reset if window has expired
  if (data && now > data.resetTime) {
    rateLimitMap.delete(identifier);
  }

  // Get or create rate limit data
  let limitData = rateLimitMap.get(identifier);

  if (!limitData) {
    limitData = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitMap.set(identifier, limitData);
  }

  // Check if limit exceeded
  if (limitData.count >= maxRequests) {
    return {
      success: false,
      remainingRequests: 0,
      resetTime: limitData.resetTime,
    };
  }

  // Increment count
  limitData.count++;
  rateLimitMap.set(identifier, limitData);

  return {
    success: true,
    remainingRequests: maxRequests - limitData.count,
    resetTime: limitData.resetTime,
  };
}

/**
 * Reset rate limit for a specific identifier
 * @param identifier - Unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier);
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// Auto cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimit, 5 * 60 * 1000);
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

  // Fallback to a hash of the request (not ideal but prevents tracking)
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
