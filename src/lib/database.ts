/**
 * Unified Database Access Layer
 * Supports both Cloudflare D1 (production) and Prisma (development)
 */

import { PrismaClient } from '@prisma/client';
import { Env } from '@/db/types';

// Prisma client for local development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Get the appropriate database for the current environment
 * - Production/Cloudflare: Returns D1 database from env
 * - Development: Returns Prisma client as a D1-compatible interface
 */
export function getDatabase(env: Env | null): any | PrismaClient {
  // In production or when Cloudflare bindings are available, use D1
  if (env && env.DB) {
    return env.DB;
  }

  // For local development, we need to use Prisma
  // Note: This requires migrating D1 queries to Prisma queries
  // For now, we'll return Prisma and handle the conversion in repositories
  console.warn('[database.ts] Using Prisma client for local development');
  return prisma as any;
}

/**
 * Check if we're running in a Cloudflare environment
 */
export function isCloudflareEnv(): boolean {
  try {
    return typeof process !== 'undefined' && process.env.CLOUDFLARE_ENV === 'true';
  } catch {
    return false;
  }
}

/**
 * Initialize Prisma database connection
 * Call this in development mode to ensure database is ready
 */
export async function initDatabase(): Promise<void> {
  if (!isCloudflareEnv()) {
    try {
      await prisma.$connect();
      console.log('[database.ts] Prisma database connected');
    } catch (error) {
      console.error('[database.ts] Prisma connection failed:', error);
      throw error;
    }
  }
}

export default prisma;
