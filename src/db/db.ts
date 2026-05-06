import { Env, D1Result } from './types';
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
 * Execute multiple SQL statements in a transaction (Cloudflare D1)
 * All statements succeed or all fail - atomic operation
 *
 * @param env - Cloudflare environment with DB binding
 * @param statements - Array of SQL statements with their parameters
 * @returns Promise<D1Result[]> - Array of results from each statement
 *
 * @example
 * ```typescript
 * await transaction(env, [
 *   { sql: 'INSERT INTO orders (...) VALUES (...)', params: [...] },
 *   { sql: 'INSERT INTO order_items (...) VALUES (...)', params: [...] }
 * ])
 * ```
 */
export async function transaction(
  env: Env | null,
  statements: Array<{ sql: string; params: unknown[] }>
): Promise<D1Result[]> {
  if (!env || !env.DB) {
    console.error('[db.ts] Database not available');
    throw new Error('Database not available');
  }

  try {
    // Prepare all statements
    const preparedStatements = statements.map(stmt =>
      env.DB!.prepare(stmt.sql).bind(...stmt.params)
    );

    // Execute all statements in a batch (atomic transaction)
    const results = await env.DB.batch(preparedStatements);

    return results;
  } catch (error) {
    console.error('[db.ts] Transaction failed:', error);
    throw error;
  }
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
 * Generate a unique ID using timestamp and secure random string
 */
export function generateId(): string {
  return generateSecureId();
}

/**
 * Generate a human-readable order number
 * Format: ORD-YYYY-NNNNNN (e.g., ORD-2025-004521)
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const sequence = secureRandomInt(1, 999999)
  const paddedSequence = sequence.toString().padStart(6, '0')
  return `ORD-${year}-${paddedSequence}`
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
