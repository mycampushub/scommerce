import { NextResponse } from 'next/server';
import { Env } from '@/db/types';
import { shouldUsePrisma } from '@/db/unified-db';

/**
 * Check if environment/database is available
 * Returns an error response if not available, null otherwise
 * Note: In local development, we allow null env and use Prisma fallback
 */
export function checkEnv(env: Env | null): NextResponse | null {
  // In local development (no Cloudflare bindings), we use Prisma fallback
  // Only return error if we're in Cloudflare env but DB is missing
  if (!shouldUsePrisma(env) && (!env || !env.DB)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Database not available',
        message: 'The database service is temporarily unavailable. Please try again later.',
      },
      { status: 503 }
    );
  }
  return null;
}

/**
 * Check if R2 bucket is available
 * Returns an error response if not available, null otherwise
 * Note: In local development, R2 may not be available
 */
export function checkR2(env: Env | null): NextResponse | null {
  // In local development, we allow missing R2 bucket (uploads may fail with proper error)
  if (!shouldUsePrisma(env) && (!env || !env.BUCKET)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Storage service not available',
        message: 'The file storage service is temporarily unavailable. Please try again later.',
      },
      { status: 503 }
    );
  }
  return null;
}

/**
 * Check if KV namespace is available
 * Returns an error response if not available, null otherwise
 * Note: In local development, KV may not be available
 */
export function checkKV(env: Env | null): NextResponse | null {
  // In local development, we allow missing KV (will use in-memory cache)
  if (!shouldUsePrisma(env) && (!env || !env.KV)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Cache service not available',
        message: 'The cache service is temporarily unavailable. Please try again later.',
      },
      { status: 503 }
    );
  }
  return null;
}
