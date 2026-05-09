/**
 * JWT Authentication Utilities (Edge Runtime compatible)
 */

import { SignJWT, jwtVerify } from 'jose';

// Note: Password hashing functions (hashPassword, verifyPassword) are in bcrypt-wrapper.ts
// Import them directly when needed, not here to keep this file Edge Runtime compatible

function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    // Only use fallback in development with clear warning
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL SECURITY: JWT_SECRET environment variable is required in production. '
        + 'Set JWT_SECRET in Cloudflare Dashboard or wrangler.toml with a secure, random string (at least 32 characters).'
      );
    }
    console.warn(
      'SECURITY WARNING: Using insecure JWT_SECRET fallback. '
      + 'This is only for development. Set JWT_SECRET environment variable!'
    );
    return new TextEncoder().encode('dev-only-secret-min-32-chars-do-not-use-in-production');
  }

  // Validate secret length in production
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    console.error(
      'SECURITY: JWT_SECRET must be at least 32 characters long for production use.'
    );
    // Return the secret anyway but log error
  }

  console.log('[auth.ts] JWT_SECRET configured, length:', secret.length, 'is production:', process.env.NODE_ENV === 'production');
  return new TextEncoder().encode(secret);
}

function getJWTExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '7d';
}

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
  [key: string]: unknown;
}

export async function generateToken(payload: JWTPayload): Promise<string> {
  const JWT_SECRET = getJWTSecret();
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(getJWTExpiresIn())
    .sign(JWT_SECRET);

  console.log('[auth.ts] Token generated successfully for user:', payload.userId, payload.email, 'role:', payload.role);
  return token;
}

// Alias for backward compatibility
export const createToken = generateToken;

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const JWT_SECRET = getJWTSecret();
    const { payload } = await jwtVerify(token, JWT_SECRET);
    console.log('[auth.ts] Token verified successfully, userId:', (payload as any).userId, 'email:', (payload as any).email);
    return payload as JWTPayload;
  } catch (error) {
    console.error('[auth.ts] Token verification failed:', error);
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    // Split token and decode payload (base64url)
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Replace base64url characters with base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);

    return JSON.parse(Buffer.from(paddedBase64, 'base64').toString());
  } catch (error) {
    console.error('Token decode failed:', error);
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
