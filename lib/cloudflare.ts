import { Env } from '../db/types';

/**
 * Get the D1 database from the request context
 * This works with Cloudflare Pages and Workers
 */
export function getDB(request: Request): D1Database {
  return (request as any).env?.DB as D1Database;
}

/**
 * Helper to get env from request context
 */
export function getEnv(request: Request): Env {
  return (request as any).env as Env;
}

export interface D1Database {
  prepare: (sql: string) => D1PreparedStatement;
  batch: (statements: D1PreparedStatement[]) => D1Result[];
  exec: (sql: string) => void;
}

export interface D1PreparedStatement {
  bind: (...values: unknown[]) => D1PreparedStatement;
  first: () => Record<string, unknown> | null;
  all: () => Record<string, unknown>[];
  run: () => D1Result;
}

export interface D1Result {
  meta: {
    duration: number;
    last_row_id: number | null;
    rows_read: number;
    rows_written: number;
    changed_db: boolean;
    size_after: number;
  };
  success: boolean;
}
