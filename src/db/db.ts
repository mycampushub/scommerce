import { Env } from './types';
import { secureRandomString, generateSecureId, secureRandomInt } from '@/lib/crypto-utils';

// Re-export generateSecureId for use in other files
export { generateSecureId } from '@/lib/crypto-utils';

/**
 * Execute a SQL query and return first result
 */
export async function queryFirst<T = Record<string, unknown>>(
  env: Env | null,
  sql: string,
  ...params: unknown[]
): Promise<T | null> {
  if (!env || !env.DB) {
    console.error('[db.ts] Database not available');
    return null;
  }
  const stmt = env.DB.prepare(sql);
  const result = await stmt.bind(...params).first() as T | null;

  return result;
}

/**
 * Execute a SQL query and return all results
 */
export async function queryAll<T = Record<string, unknown>>(
  env: Env | null,
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  if (!env || !env.DB) {
    console.error('[db.ts] Database not available');
    return [];
  }
  const stmt = env.DB.prepare(sql);
  const result = await stmt.bind(...params).all() as { results: T[] };

  return result?.results || [];
}

/**
 * Execute a SQL statement (no return value)
 */
export async function execute(
  env: Env | null,
  sql: string,
  ...params: unknown[]
): Promise<void> {
  if (!env || !env.DB) {
    console.error('[db.ts] Database not available');
    return;
  }
  const stmt = env.DB.prepare(sql);
  await stmt.bind(...params).run();
}

/**
 * Count rows in a table or execute a COUNT query
 * Supports two calling patterns:
 * 1. Full SELECT: count(env, 'SELECT COUNT(*) as count FROM table WHERE ...', ...params)
 * 2. Table+WHERE: count(env, 'table', 'WHERE condition', ...params)
 */
export async function count(
  env: Env | null,
  tableOrQuery: string,
  whereClauseOrFirstParam?: string | unknown,
  ...params: unknown[]
): Promise<number> {
  if (!env || !env.DB) {
    console.error('[db.ts] Database not available');
    return 0;
  }

  const isFullQuery = tableOrQuery.trim().toUpperCase().startsWith('SELECT');

  let sql: string;
  let queryParams: unknown[];

  if (isFullQuery) {
    // Mode 1: Full SELECT COUNT query - params are already part of the call
    sql = tableOrQuery;
    queryParams = [whereClauseOrFirstParam, ...params].filter(p => p !== undefined);
  } else {
    // Mode 2: Table name + WHERE clause
    sql = `SELECT COUNT(*) as count FROM ${tableOrQuery}`;
    if (whereClauseOrFirstParam) {
      sql += ` ${whereClauseOrFirstParam as string}`;
    }
    queryParams = params;
  }

  const result = await queryFirst<{ count: number }>(env, sql, ...queryParams);
  return result?.count || 0;
}

/**
 * Parse JSON safely
 */
export function parseJSON<T = unknown>(value: string | null | undefined, fallback?: T): T | null {
  if (!value) return fallback ?? null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback ?? null;
  }
}

/**
 * Generate a unique ID using timestamp and secure random string
 */
export function generateId(): string {
  return generateSecureId();
}

/**
 * Generate an order number
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = secureRandomInt(0, 99999999).toString().padStart(8, '0');
  return `ORD-${timestamp}-${random}`;
}

/**
 * Convert boolean to number (0 or 1)
 */
export function boolToNumber(value: boolean | number): number {
  return typeof value === 'boolean' ? (value ? 1 : 0) : (value ? 1 : 0);
}

/**
 * Convert number to boolean
 */
export function numberToBool(value: number | null | undefined): boolean {
  return value === 1;
}

/**
 * Get current timestamp in ISO format
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Stringify an object to JSON
 */
export function stringifyJSON(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Build pagination clause for SQL queries
 */
export function buildPaginationClause(options: { limit?: number; offset?: number } = {}): string {
  const { limit = 20, offset = 0 } = options;
  return `LIMIT ${limit} OFFSET ${offset}`;
}
