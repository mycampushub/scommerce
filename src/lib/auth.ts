/**
 * JWT Authentication Utilities (Edge Runtime compatible)
 */

import {
  createToken as createTokenEdge,
  verifyToken as verifyTokenEdge,
  decodeToken,
  extractTokenFromHeader,
  type JWTPayload
} from '@/lib/jwt-edge';
import bcrypt from 'bcryptjs';

function getJWTExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '7d';
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

export async function createToken(payload: JWTPayload): Promise<string> {
  // Add expiration time
  const payloadWithExp: JWTPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  };

  return createTokenEdge(payloadWithExp);
}

export async function generateToken(payload: JWTPayload): Promise<string> {
  // Alias for backward compatibility
  return createToken(payload);
}

// Re-export verifyToken from jwt-edge
export const verifyToken = verifyTokenEdge;

// Re-export decodeToken and extractTokenFromHeader from jwt-edge
export { decodeToken, extractTokenFromHeader, type JWTPayload };
