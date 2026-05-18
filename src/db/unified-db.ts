/**
 * Unified Database Interface
 * Provides a D1-compatible API that works with both Cloudflare D1 and Prisma
 */

import { Env } from './types';
import { PrismaClient } from '@prisma/client';

// Get Prisma client
let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return prisma;
}

export interface Database {
  prepare(sql: string): PreparedStatement;
}

export interface PreparedStatement {
  bind(...params: unknown[]): BoundStatement;
}

export interface BoundStatement {
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number }, error?: Error }>;
}

/**
 * Prisma-based database wrapper that mimics D1 API
 */
class PrismaDatabase implements Database {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  prepare(sql: string): PreparedStatement {
    return new PrismaPreparedStatement(this.prisma, sql);
  }
}

class PrismaPreparedStatement implements PreparedStatement {
  private prisma: PrismaClient;
  private sql: string;
  private params: unknown[] = [];

  constructor(prisma: PrismaClient, sql: string) {
    this.prisma = prisma;
    this.sql = sql;
  }

  bind(...params: unknown[]): BoundStatement {
    this.params = params;
    return this as unknown as BoundStatement;
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    try {
      const result = await (this.prisma.$queryRawUnsafe as any)(this.sql, ...this.params) as any[];
      return result.length > 0 ? (result[0] as T) : null;
    } catch (error) {
      console.error('[PrismaPreparedStatement] first() error:', error);
      return null;
    }
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
    try {
      const result = await (this.prisma.$queryRawUnsafe as any)(this.sql, ...this.params) as any[];
      return { results: result as T[] };
    } catch (error) {
      console.error('[PrismaPreparedStatement] all() error:', error);
      return { results: [] };
    }
  }

  async run(): Promise<{ meta: { changes: number }, error?: Error }> {
    try {
      const result = await this.prisma.$executeRawUnsafe(this.sql, ...this.params);
      return { meta: { changes: result as number } };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[PrismaPreparedStatement] run() error:', err);
      return { meta: { changes: 0 }, error: err };
    }
  }
}

/**
 * Get database instance - works with both D1 and Prisma
 */
export function getDatabase(env: Env | null): Database | null {
  // Try Cloudflare D1 first
  if (env && env.DB) {
    return env.DB;
  }

  // Fallback to Prisma for local development
  try {
    const prismaClient = getPrismaClient();
    return new PrismaDatabase(prismaClient);
  } catch (error) {
    console.error('[unified-db] Error getting Prisma database:', error);
    return null;
  }
}

/**
 * Check if we should use Prisma (local development)
 */
export function shouldUsePrisma(env: Env | null): boolean {
  return !env || !env.DB;
}

/**
 * Get Prisma client directly
 */
export function getPrisma(): PrismaClient {
  return getPrismaClient();
}
