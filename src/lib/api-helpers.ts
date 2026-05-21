import { NextResponse } from 'next/server';
import { Env } from '@/db/types';

/**
 * Check if environment/database is available
 * Returns an error response if not available, null otherwise
 */
export function checkEnv(env: Env | null): NextResponse | null {
  if (!env || !env.DB) {
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
 */
export function checkR2(env: Env | null): NextResponse | null {
  if (!env || !env.BUCKET) {
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
 */
export function checkKV(env: Env | null): NextResponse | null {
  if (!env || !env.KV) {
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
