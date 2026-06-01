import { SignJWT, jwtVerify } from 'jose'

export interface JWTPayload {
  userId: string
  email: string
  name: string | null
  role: string
  [key: string]: unknown
}

/**
 * Get JWT_SECRET (only when needed at runtime)
 * SECURITY: In production, JWT_SECRET MUST be set or throws error
 */
function getJWTSecret(): Uint8Array {
  const JWT_SECRET_STRING = process.env.JWT_SECRET;
  
  if (!JWT_SECRET_STRING) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL SECURITY: JWT_SECRET environment variable is required in production. '
        + 'Set JWT_SECRET to a secure, random string with at least 32 characters.'
      );
    }
    // Only use fallback in development with clear warning
    console.warn(
      'SECURITY WARNING: Using insecure JWT_SECRET fallback. '
      + 'This is only for development. Set JWT_SECRET environment variable!'
    );
    return new TextEncoder().encode('dev-only-secret-min-32-chars-do-not-use-in-production');
  }
  
  // Validate secret length in production
  if (process.env.NODE_ENV === 'production' && JWT_SECRET_STRING.length < 32) {
    throw new Error(
      'SECURITY: JWT_SECRET must be at least 32 characters long for production use.'
    );
  }
  
  return new TextEncoder().encode(JWT_SECRET_STRING);
}

/**
 * Create a JWT token
 */
export async function createToken(payload: JWTPayload): Promise<string> {
  const JWT_SECRET = getJWTSecret();
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days expiration
    .sign(JWT_SECRET)

  return token
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const JWT_SECRET = getJWTSecret();
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Decode token without verification (for debugging only)
 * WARNING: Do not use this for authentication decisions!
 */
export function decodeToken(token: string): any {
  try {
    // Split the token and decode the payload (base64url)
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = parts[1]
    // Replace base64url characters with base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    // Add padding if needed
    const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4)

    return JSON.parse(Buffer.from(paddedBase64, 'base64').toString())
  } catch (error) {
    console.error('Token decode failed:', error)
    return null
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token or null if not found
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}
