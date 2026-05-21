import { Env } from './types';
import { getDatabase } from './unified-db';
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
  const db = getDatabase(env);
  if (!db) {
    console.error('[db.ts] Database not available - cannot execute query:', sql);
    return null;
  }
  
  try {
    const stmt = db.prepare(sql);
    const result = await stmt.bind(...params).first() as T | null;

    console.log('[db.ts] queryFirst result:', {
      hasResult: !!result,
      sql: sql.substring(0, 100)
    });

    return result;
  } catch (error) {
    console.error('[db.ts] queryFirst execution error:', {
      sql: sql.substring(0, 100),
      error: String(error)
    });
    return null;
  }
}

/**
 * Execute a SQL query and return all results
 */
export async function queryAll<T = Record<string, unknown>>(
  env: Env | null,
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const db = getDatabase(env);
  if (!db) {
    console.error('[db.ts] Database not available - cannot execute query:', sql);
    return [];
  }
  
  try {
    const stmt = db.prepare(sql);
    const result = await stmt.bind(...params).all() as { results: T[] };

    console.log('[db.ts] Query executed successfully:', {
      sql: sql.substring(0, 100),
      paramsCount: params.length,
      resultCount: result?.results?.length || 0
    });

    return result?.results || [];
  } catch (error) {
    console.error('[db.ts] Query execution error:', {
      sql: sql.substring(0, 100),
      error: String(error)
    });
    return [];
  }
}

/**
 * Execute a SQL statement (no return value)
 * Throws an error if the execution fails
 */
export async function execute(
  env: Env | null,
  sql: string,
  ...params: unknown[]
): Promise<void> {
  const db = getDatabase(env);
  if (!db) {
    throw new Error('Database not available');
  }
  const stmt = db.prepare(sql);
  const result = await stmt.bind(...params).run();

  // Check if there was an error (for D1)
  if ('error' in result && result.error) {
    console.error('[db.ts] Execute error:', {
      sql: sql.substring(0, 100),
      error: result.error.message
    });
    throw result.error;
  }
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
  const db = getDatabase(env);
  if (!db) {
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
 * Only stringifies if value is not already a string
 */
export function stringifyJSON(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null'
  }

  // If it's already a string, check if it's valid JSON before re-stringifying
  if (typeof value === 'string') {
    try {
      // Try to parse it - if it's already JSON, use it as-is
      JSON.parse(value)
      return value
    } catch {
      // If it's not valid JSON, this is a plain string, so stringify it
      return JSON.stringify(value)
    }
  }

  // For objects and arrays, always stringify
  return JSON.stringify(value)
}

/**
 * Build pagination clause for SQL queries
 */
export function buildPaginationClause(options: { limit?: number; offset?: number } = {}): string {
  const { limit = 20, offset = 0 } = options;
  return `LIMIT ${limit} OFFSET ${offset}`;
}

/**
 * Execute SQL within a transaction
 * Cloudflare D1 uses batch() for atomic transactions
 * Prisma/SQLite uses BEGIN/COMMIT
 */
export async function transaction<T>(
  env: Env | null,
  callback: (env: Env | null) => Promise<T>
): Promise<T> {
  const db = getDatabase(env);
  if (!db) {
    throw new Error('Database not available');
  }

  // Check if we're using Cloudflare D1 (has batch method)
  if (db && typeof (db as any).batch === 'function') {
    // Cloudflare D1 - execute without explicit BEGIN/COMMIT
    // NOTE: For atomic operations in D1, use batchTransaction() instead
    console.warn('[db.ts] Cloudflare D1 detected - using non-atomic execution. Use batchTransaction() for atomic operations.');
    return await callback(env);
  } else {
    // Prisma/SQLite - use traditional transactions
    try {
      // Begin transaction
      await execute(env, 'BEGIN TRANSACTION');

      // Execute callback
      const result = await callback(env);

      // Commit transaction
      await execute(env, 'COMMIT');

      return result;
    } catch (error) {
      // Rollback on error
      try {
        await execute(env, 'ROLLBACK');
      } catch (rollbackError) {
        console.error('[db.ts] Error during rollback:', rollbackError);
      }
      throw error;
    }
  }
}

/**
 * Execute multiple SQL statements atomically using D1 batch() API
 * This provides true atomicity for Cloudflare D1
 * For Prisma/SQLite, falls back to traditional transaction
 *
 * @param env - Environment object with database binding
 * @param operations - Array of { sql, params } objects to execute atomically
 * @returns Array of results from each operation
 */
export async function batchTransaction(
  env: Env | null,
  operations: Array<{ sql: string; params?: unknown[] }>
): Promise<void> {
  const db = getDatabase(env);
  if (!db) {
    throw new Error('Database not available');
  }

  // Check if we're using Cloudflare D1
  if (db && typeof (db as any).batch === 'function') {
    // Cloudflare D1 - use batch() for atomic execution
    console.log('[db.ts] Executing batch transaction with', operations.length, 'operations');

    try {
      // Prepare all statements
      const statements = operations.map(op => {
        const stmt = db.prepare(op.sql);
        return op.params ? stmt.bind(...op.params) : stmt;
      });

      // Execute all statements atomically
      const results = await (db as any).batch(statements);

      // Check for errors in any of the results
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if ('error' in result && result.error) {
          console.error('[db.ts] Batch operation failed at index', i, ':', result.error);
          throw new Error(`Batch operation failed: ${result.error.message}`);
        }
      }

      console.log('[db.ts] Batch transaction completed successfully');
    } catch (error) {
      console.error('[db.ts] Batch transaction error:', error);
      throw error;
    }
  } else {
    // Prisma/SQLite - fall back to traditional transaction
    console.log('[db.ts] Using traditional transaction for non-D1 database');
    try {
      await execute(env, 'BEGIN TRANSACTION');

      for (const op of operations) {
        await execute(env, op.sql, ...(op.params || []));
      }

      await execute(env, 'COMMIT');
    } catch (error) {
      try {
        await execute(env, 'ROLLBACK');
      } catch (rollbackError) {
        console.error('[db.ts] Error during rollback:', rollbackError);
      }
      throw error;
    }
  }
}

/**
 * Retry a function with exponential backoff
 * Useful for handling race conditions
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is a unique constraint violation (race condition)
      const isUniqueConstraintError = lastError.message.includes('UNIQUE') ||
                                       lastError.message.includes('constraint');
      
      // If it's not a unique constraint error, don't retry
      if (!isUniqueConstraintError) {
        throw lastError;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // Calculate exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Retry failed');
}
