/**
 * Prisma-based database utilities for local development
 * Provides D1-compatible API using Prisma
 */

import { prisma } from './database';

/**
 * D1-compatible queryFirst using Prisma
 */
export async function queryFirst<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): Promise<T | null> {
  try {
    // For now, this is a placeholder
    // In a full implementation, we'd convert SQL queries to Prisma queries
    // For development, we'll use raw queries through Prisma
    const result = await prisma.$queryRawUnsafe<T[]>(sql, ...params);
    return result && result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('[db-prisma.ts] queryFirst error:', error);
    return null;
  }
}

/**
 * D1-compatible queryAll using Prisma
 */
export async function queryAll<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  try {
    const result = await prisma.$queryRawUnsafe<T[]>(sql, ...params);
    return result || [];
  } catch (error) {
    console.error('[db-prisma.ts] queryAll error:', error);
    return [];
  }
}

/**
 * D1-compatible execute using Prisma
 */
export async function execute(
  sql: string,
  ...params: unknown[]
): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(sql, ...params);
  } catch (error) {
    console.error('[db-prisma.ts] execute error:', error);
    throw error;
  }
}

/**
 * Count rows using Prisma
 */
export async function count(sql: string, ...params: unknown[]): Promise<number> {
  try {
    const result = await queryFirst<{ count: number }>(sql, ...params);
    return result?.count || 0;
  } catch (error) {
    console.error('[db-prisma.ts] count error:', error);
    return 0;
  }
}
