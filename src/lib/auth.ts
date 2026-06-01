/**
 * JWT Authentication Utilities (Edge Runtime compatible)
 *
 * Note: Password hashing functions (hashPassword, verifyPassword) are available
 * in @/lib/bcrypt-wrapper which uses Web Crypto API and is Edge Runtime compatible
 */

import { SignJWT, jwtVerify } from 'jose';
import { logger } from '@/lib/logger';

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
    logger.warn(
      'SECURITY WARNING: Using insecure JWT_SECRET fallback. ' +
      'This is only for development. Set JWT_SECRET environment variable!'
    );
    return new TextEncoder().encode('dev-only-secret-min-32-chars-do-not-use-in-production');
  }

  // Validate secret length in production
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error(
      'SECURITY: JWT_SECRET must be at least 32 characters long for production use. ' +
      `Current length: ${secret.length}. Please set a longer JWT_SECRET.`
    );
  }

  logger.debug('JWT_SECRET configured', { length: secret.length, isProduction: process.env.NODE_ENV === 'production' });
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

  logger.authAction('Token generated', payload.userId, { email: payload.email, role: payload.role });
  return token;
}

// Alias for backward compatibility
export const createToken = generateToken;

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const JWT_SECRET = getJWTSecret();
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Explicitly check token expiration (jose does this, but we want to be explicit)
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      logger.warn('Token has expired');
      return null;
    }

    logger.authAction('Token verified', (payload as any).userId, { email: (payload as any).email });
    return payload as JWTPayload;
  } catch (error: any) {
    // Distinguish between expired tokens and other verification errors
    if (error?.code === 'ERR_JWT_EXPIRED' || error?.message?.includes('expired')) {
      logger.warn('Token has expired');
    } else {
      logger.error('Token verification failed', { error: error?.message || error });
    }
    return null;
  }
}

/**
 * Check if a token is expired without throwing errors
 * Returns true if token is expired or invalid, false if valid
 */
export async function isTokenExpired(token: string): Promise<boolean> {
  try {
    const JWT_SECRET = getJWTSecret();
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return true;
    }

    return false;
  } catch (error: any) {
    // Any verification error means token is invalid or expired
    return true;
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

    // Use TextDecoder for Edge Runtime compatibility
    const binaryString = atob(paddedBase64);
    return JSON.parse(binaryString);
  } catch (error) {
    logger.error('Token decode failed', { error });
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}