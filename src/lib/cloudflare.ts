import { Env } from '@/db/types';

/**
 * Get D1 database from request context
 * This works with Cloudflare Pages and Workers
 */
export function getDB(request: Request): D1Database | null {
  // Check all possible locations where D1 binding could be available
  // 1. request.env.DB (traditional Workers way)
  const requestEnv = (request as any).env;
  if (requestEnv?.DB) {
    return requestEnv.DB as D1Database;
  }

  // 2. global.cloudflare.ctx.env.DB (next-on-pages request context)
  if (globalThis.cloudflare?.ctx?.env?.DB) {
    return globalThis.cloudflare.ctx.env.DB as D1Database;
  }

  // 3. global.cloudflare.env.DB (next-on-pages global)
  if (globalThis.cloudflare?.env?.DB) {
    return globalThis.cloudflare.env.DB as D1Database;
  }

  // 4. Check if there's a global binding directly
  const globalAny = global as any;
  if (globalAny.DB) {
    return globalAny.DB as D1Database;
  }

  console.error('[cloudflare.ts] D1 binding not found in any location');
  return null;
}

/**
 * Helper to get env from request context
 */
export function getEnv(request: Request): Env | null {
  // Check all possible locations where env could be available
  const requestEnv = (request as any).env;
  if (requestEnv?.DB) {
    return requestEnv as Env;
  }

  if (globalThis.cloudflare?.ctx?.env?.DB) {
    return globalThis.cloudflare.ctx.env as Env;
  }

  if (globalThis.cloudflare?.env?.DB) {
    return globalThis.cloudflare.env as Env;
  }

  const globalAny = global as any;
  if (globalAny.DB) {
    return globalAny as Env;
  }

  console.error('[cloudflare.ts] Env not found in any location');
  return null;
}

export interface D1Database {
  prepare: (sql: string) => D1PreparedStatement;
  batch: (statements: D1PreparedStatement[]) => D1Result[];
  exec: (sql: string) => D1Result;
}

export interface D1PreparedStatement {
  bind: (...values: unknown[]) => D1PreparedStatement;
  first: () => Promise<Record<string, unknown> | null>;
  all: () => Promise<{ results: Record<string, unknown>[] }>;
  run: () => Promise<D1Result>;
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

export interface R2Bucket {
  put: (key: string, value: ArrayBuffer | ReadableStream | string, options?: R2PutOptions) => Promise<R2Object>;
  get: (key: string) => Promise<R2Object | null>;
  delete: (key: string) => Promise<void>;
  list: (options?: R2ListOptions) => Promise<R2Objects>;
}

export interface R2PutOptions {
  httpMetadata?: Record<string, string>;
  customMetadata?: Record<string, string>;
}

export interface R2Object {
  key: string;
  size: number;
  httpMetadata?: Record<string, string>;
  customMetadata?: Record<string, string>;
  write?: (options: { signal: AbortSignal }) => Promise<Response>;
}

export interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
}

export interface R2ListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
}

export interface KVNamespace {
  get: (key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream') => Promise<string | null | Record<string, unknown> | ArrayBuffer | ReadableStream | null>;
  put: (key: string, value: string, options?: KVNamespacePutOptions) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

export interface KVNamespacePutOptions {
  expirationTtl?: number;
  expiration?: Date | number;
}
