import { Env } from './types';

/**
 * Execute a SQL query and return the first result
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
 * Count rows in a table
 */
export async function count(env: Env | null, sql: string, ...params: unknown[]): Promise<number> {
  if (!env || !env.DB) {
    console.error('[db.ts] Database not available');
    return 0;
  }
  const result = await queryFirst<{ count: number }>(env, sql, ...params);
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
 * Generate a unique ID using timestamp and random string
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate an order number
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
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
