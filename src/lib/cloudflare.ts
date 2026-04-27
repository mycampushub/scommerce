import { Env } from '@/db/types';

/**
 * Get D1 database from request context
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
