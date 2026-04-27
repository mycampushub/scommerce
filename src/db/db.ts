import { Env } from './types';

/**
 * Generate a unique ID (replaces Prisma's @default(cuid()))
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique order number
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SC${year}${month}${day}${random}`;
}

/**
 * Convert SQLite integer boolean to JavaScript boolean
 */
export function boolToNumber(bool: boolean): number {
  return bool ? 1 : 0;
}

/**
 * Convert SQLite integer to JavaScript boolean
 */
export function numberToBool(num: number | undefined | null): boolean {
  return num === 1 ? true : false;
}

/**
 * Get current timestamp in ISO format
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Parse JSON string safely
 */
export function parseJSON<T = unknown>(json: string | null | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Serialize object to JSON string
 */
export function stringifyJSON(obj: unknown): string {
  return JSON.stringify(obj);
}

/**
 * Pagination helper
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export function buildPaginationClause(options: PaginationOptions = {}): string {
  const { limit = 10, offset = 0 } = options;
  return `LIMIT ${limit} OFFSET ${offset}`;
}

/**
 * Helper to execute a query and get the first result
 */
export async function queryFirst<T = Record<string, unknown>>(
  env: Env,
  sql: string,
  ...params: unknown[]
): Promise<T | null> {
  const stmt = env.DB.prepare(sql);
  const result = stmt.bind(...params).first();
  return (result as T) || null;
}

/**
 * Helper to execute a query and get all results
 */
export async function queryAll<T = Record<string, unknown>>(
  env: Env,
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const stmt = env.DB.prepare(sql);
  const results = stmt.bind(...params).all();
  return (results as T[]) || [];
}

/**
 * Helper to execute a statement and return success status
 */
export async function execute(
  env: Env,
  sql: string,
  ...params: unknown[]
): Promise<{ success: boolean; meta?: any }> {
  const stmt = env.DB.prepare(sql);
  const result = stmt.bind(...params).run();
  return { success: result.success, meta: result.meta };
}

/**
 * Helper to batch execute multiple statements
 */
export async function batchExecute(
  env: Env,
  statements: Array<{ sql: string; params: unknown[] }>
): Promise<Array<{ success: boolean; meta?: any }>> {
  const preparedStatements = statements.map(s => env.DB.prepare(s.sql).bind(...s.params));
  const results = env.DB.batch(preparedStatements);
  return results as Array<{ success: boolean; meta?: any }>;
}

/**
 * Helper for counting records
 */
export async function count(
  env: Env,
  table: string,
  whereClause: string = '',
  ...params: unknown[]
): Promise<number> {
  const sql = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
  const result = await queryFirst<{ count: number }>(env, sql, ...params);
  return result?.count || 0;
}
