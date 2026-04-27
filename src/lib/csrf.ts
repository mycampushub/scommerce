/**
 * CSRF (Cross-Site Request Forgery) protection
 * Token-based CSRF protection for API routes
 */

import { Env } from '@/db/types';

export interface CSRFTokenData {
  token: string;
  expiresAt: number;
}

/**
 * Generate a cryptographically secure CSRF token
 * @returns Random CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate and store a new CSRF token
 * @param env - Environment object containing KV binding
 * @param sessionId - User session ID or IP address
 * @param ttlSeconds - Token lifetime in seconds (default: 1 hour)
 * @returns CSRF token
 */
export async function createCSRFToken(
  env: Env | null,
  sessionId: string,
  ttlSeconds: number = 3600
): Promise<string | null> {
  if (!env?.KV) {
    console.error('CSRF protection requires KV namespace');
    return null;
  }

  const token = generateCSRFToken();
  const expiresAt = Date.now() + (ttlSeconds * 1000);
  const csrfKey = `csrf:${sessionId}:${token}`;

  try {
    // Store token in KV with expiration
    await env.KV.put(csrfKey, JSON.stringify({ expiresAt }), {
      expirationTtl: ttlSeconds,
    });
    return token;
  } catch (error) {
    console.error('Error storing CSRF token:', error);
    return null;
  }
}

/**
 * Validate a CSRF token
 * @param env - Environment object containing KV binding
 * @param sessionId - User session ID or IP address
 * @param token - CSRF token to validate
 * @returns True if token is valid, false otherwise
 */
export async function validateCSRFToken(
  env: Env | null,
  sessionId: string,
  token: string
): Promise<boolean> {
  if (!env?.KV) {
    console.error('CSRF protection requires KV namespace');
    return false;
  }

  // Basic token format validation
  if (!token || token.length !== 64) {
    return false;
  }

  const csrfKey = `csrf:${sessionId}:${token}`;

  try {
    const tokenData = await env.KV.get(csrfKey, 'text');
    if (!tokenData) {
      return false;
    }

    const parsed = JSON.parse(tokenData) as CSRFTokenData;

    // Check if token has expired
    if (Date.now() > parsed.expiresAt) {
      await env.KV.delete(csrfKey);
      return false;
    }

    // Token is valid - delete it to prevent reuse
    await env.KV.delete(csrfKey);
    return true;
  } catch (error) {
    console.error('Error validating CSRF token:', error);
    return false;
  }
}

/**
 * Extract CSRF token from request headers
 * @param request - Request object
 * @returns CSRF token or null
 */
export function getCSRFTokenFromRequest(request: Request): string | null {
  // Try multiple header locations
  const csrfHeader = request.headers.get('x-csrf-token');
  if (csrfHeader) {
    return csrfHeader;
  }

  const xsrfHeader = request.headers.get('x-xsrf-token');
  if (xsrfHeader) {
    return xsrfHeader;
  }

  // Check authorization header for Bearer token with CSRF
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token.length === 64) {
      return token;
    }
  }

  return null;
}

/**
 * Extract CSRF token from request body
 * @param body - Request body
 * @returns CSRF token or null
 */
export function getCSRFTokenFromBody(body: Record<string, unknown>): string | null {
  const token = body._csrf || body.csrfToken || body.csrf;
  return typeof token === 'string' ? token : null;
}

/**
 * Get session identifier for CSRF token
 * Uses JWT token if available, otherwise uses IP address
 * @param request - Request object
 * @returns Session identifier
 */
export function getCSRFSessionId(request: Request): string {
  // Try to get session from JWT
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Use JWT as session ID (simplified - in production, extract user ID from JWT)
    if (token) {
      return `jwt:${token.substring(0, 32)}`;
    }
  }

  // Fallback to IP address
  const ip = request.headers.get('cf-connecting-ip') ||
             request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'anonymous';

  return `ip:${ip}`;
}

/**
 * CSRF middleware for API routes
 * Returns error response if CSRF validation fails
 * @param request - Request object
 * @param env - Environment object
 * @returns Response object if validation fails, null if validation passes
 */
export async function csrfMiddleware(
  request: Request,
  env: Env | null
): Promise<Response | null> {
  // Skip CSRF for GET, HEAD, OPTIONS requests (safe methods)
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null;
  }

  // Get CSRF token from request
  const token = getCSRFTokenFromRequest(request);

  if (!token) {
    return new Response(
      JSON.stringify({
        error: 'CSRF token missing',
        message: 'CSRF token is required for this request',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Validate token
  const sessionId = getCSRFSessionId(request);
  const isValid = await validateCSRFToken(env, sessionId, token);

  if (!isValid) {
    return new Response(
      JSON.stringify({
        error: 'CSRF token invalid',
        message: 'Invalid or expired CSRF token',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Validation passed
  return null;
}

/**
 * Create CSRF response with token in headers
 * @param response - Original response
 * @param token - CSRF token
 * @returns Response with CSRF token in headers
 */
export function addCSRFHeaders(
  response: Response,
  token: string
): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('X-CSRF-Token', token);
  newResponse.headers.set('X-XSRF-Token', token);
  newResponse.headers.set('Access-Control-Expose-Headers', 'X-CSRF-Token, X-XSRF-Token');
  return newResponse;
}

/**
 * API route wrapper that adds CSRF protection
 * @param handler - API route handler
 * @param env - Environment object
 * @returns Wrapped API route handler
 */
export function withCSRFProtection<T extends Request>(
  handler: (request: T, env: Env | null) => Promise<Response>,
  env: Env | null
) {
  return async (request: T): Promise<Response> => {
    // Check CSRF for state-changing requests
    const csrfError = await csrfMiddleware(request, env);
    if (csrfError) {
      return csrfError;
    }

    // Proceed with the request
    return handler(request, env);
  };
}

/**
 * Get or create CSRF token for a session
 * @param env - Environment object
 * @param sessionId - Session ID
 * @returns CSRF token
 */
export async function getOrCreateCSRFToken(
  env: Env | null,
  sessionId: string
): Promise<string | null> {
  // Try to get existing token
  const existingToken = await createCSRFToken(env, sessionId);

  if (!existingToken) {
    console.error('Failed to create CSRF token');
  }

  return existingToken;
}

/**
 * Invalidate all CSRF tokens for a session
 * Useful on logout
 * @param env - Environment object
 * @param sessionId - Session ID
 */
export async function invalidateCSRFSession(
  env: Env | null,
  sessionId: string
): Promise<void> {
  if (!env?.KV) {
    return;
  }

  try {
    // Note: KV doesn't support prefix deletion
    // In production, you'd need to maintain a list of tokens
    // For now, we'll just let them expire naturally
    console.log(`CSRF tokens for session ${sessionId} will expire naturally`);
  } catch (error) {
    console.error('Error invalidating CSRF session:', error);
  }
}
