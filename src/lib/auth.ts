/**
 * JWT Authentication Utilities (Edge Runtime compatible)
 */

import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production-min-32-chars';
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

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function generateToken(payload: JWTPayload): Promise<string> {
  const JWT_SECRET = getJWTSecret();
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(getJWTExpiresIn())
    .sign(JWT_SECRET);

  return token;
}

// Alias for backward compatibility
export const createToken = generateToken;

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const JWT_SECRET = getJWTSecret();
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
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
