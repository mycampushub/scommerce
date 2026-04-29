import { Env } from '@/db/types';

/**
 * Enhanced Cloudflare binding detection for Cloudflare Pages and Workers
 * This function tries multiple locations and name variations to find bindings
 */
function findBinding(envObj: any, bindingName: string): any {
  if (!envObj) return null;

  // Try exact match first
  if (envObj[bindingName] !== undefined) {
    return envObj[bindingName];
  }

  // Try case-insensitive match
  const keys = Object.keys(envObj);
  for (const key of keys) {
    if (key.toLowerCase() === bindingName.toLowerCase()) {
      console.log(`[cloudflare.ts] Found binding "${bindingName}" as "${key}"`);
      return envObj[key];
    }
  }

  return null;
}

/**
 * Get D1 database from request context
 * This works with Cloudflare Pages, Workers, and OpenNext
 */
export function getDB(request: Request): D1Database | null {
  const checked: string[] = [];

  // 1. Try request.env (OpenNext and traditional Workers way)
  const requestEnv = (request as any).env;
  if (requestEnv) {
    checked.push('request.env');
    const db = findBinding(requestEnv, 'DB');
    if (db) {
      console.log('[cloudflare.ts] D1 found in request.env');
      return db as D1Database;
    }
  }

  // 2. Try globalThis.cloudflare.ctx.env (next-on-pages request context)
  const ctxEnv = globalThis.cloudflare?.ctx?.env;
  if (ctxEnv) {
    checked.push('globalThis.cloudflare.ctx.env');
    const db = findBinding(ctxEnv, 'DB');
    if (db) {
      console.log('[cloudflare.ts] D1 found in globalThis.cloudflare.ctx.env');
      return db as D1Database;
    }
  }

  // 3. Try globalThis.cloudflare.env (next-on-pages global)
  const cloudflareEnv = globalThis.cloudflare?.env;
  if (cloudflareEnv) {
    checked.push('globalThis.cloudflare.env');
    const db = findBinding(cloudflareEnv, 'DB');
    if (db) {
      console.log('[cloudflare.ts] D1 found in globalThis.cloudflare.env');
      return db as D1Database;
    }
  }

  // 4. Check global scope
  const globalAny = global as any;
  if (globalAny.DB) {
    checked.push('global');
    console.log('[cloudflare.ts] D1 found in global scope');
    return globalAny.DB as D1Database;
  }

  console.error('[cloudflare.ts] D1 binding not found in any location', {
    checked,
    availableKeys: {
      ctxEnv: ctxEnv ? Object.keys(ctxEnv).filter(k => !k.startsWith('__')) : [],
      cloudflareEnv: cloudflareEnv ? Object.keys(cloudflareEnv).filter(k => !k.startsWith('__')) : [],
      requestEnv: requestEnv ? Object.keys(requestEnv).filter(k => !k.startsWith('__')) : [],
      global: Object.keys(globalAny).filter(k => ['DB', 'BUCKET', 'KV'].includes(k)),
    },
  });
  return null;
}

/**
 * Helper to get env from request context
 * Works with OpenNext, next-on-pages, and traditional Workers
 */
export function getEnv(request: Request): Env | null {
  const checked: string[] = [];

  // 1. Try request.env (OpenNext and traditional Workers way)
  const requestEnv = (request as any).env;
  if (requestEnv) {
    checked.push('request.env');
    if (requestEnv.DB || requestEnv.BUCKET || requestEnv.KV) {
      console.log('[cloudflare.ts] Env found in request.env');
      return requestEnv as Env;
    }
  }

  // 2. Try globalThis.cloudflare.ctx.env (next-on-pages request context)
  const ctxEnv = globalThis.cloudflare?.ctx?.env;
  if (ctxEnv) {
    checked.push('globalThis.cloudflare.ctx.env');
    // Check if at least one binding exists
    if (ctxEnv.DB || ctxEnv.BUCKET || ctxEnv.KV) {
      console.log('[cloudflare.ts] Env found in globalThis.cloudflare.ctx.env');
      return ctxEnv as Env;
    }
  }

  // 3. Try globalThis.cloudflare.env (next-on-pages global)
  const cloudflareEnv = globalThis.cloudflare?.env;
  if (cloudflareEnv) {
    checked.push('globalThis.cloudflare.env');
    if (cloudflareEnv.DB || cloudflareEnv.BUCKET || cloudflareEnv.KV) {
      console.log('[cloudflare.ts] Env found in globalThis.cloudflare.env');
      return cloudflareEnv as Env;
    }
  }

  // 4. Check global scope
  const globalAny = global as any;
  if (globalAny.DB || globalAny.BUCKET || globalAny.KV) {
    checked.push('global');
    console.log('[cloudflare.ts] Env found in global scope');
    return globalAny as Env;
  }

  console.error('[cloudflare.ts] Env not found in any location', {
    checked,
    availableKeys: {
      ctxEnv: ctxEnv ? Object.keys(ctxEnv).filter(k => !k.startsWith('__')) : [],
      cloudflareEnv: cloudflareEnv ? Object.keys(cloudflareEnv).filter(k => !k.startsWith('__')) : [],
      requestEnv: requestEnv ? Object.keys(requestEnv).filter(k => !k.startsWith('__')) : [],
      global: Object.keys(globalAny).filter(k => ['DB', 'BUCKET', 'KV'].includes(k)),
    },
  });
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
