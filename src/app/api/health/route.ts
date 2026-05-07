import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';

/**
 * Health check endpoint
 * Useful for debugging database and environment issues
 */
export async function GET() {
  const env = getEnv();

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env ? 'cloudflare' : 'unknown',
    database: env?.DB ? 'connected' : 'not found',
    dbTest: 'skipped' as 'skipped' | 'passed' | 'failed',
    dbError: '' as string,
    hasKV: !!env?.KV,
    hasR2: !!env?.BUCKET,
    bindings: {
      DB: !!env?.DB,
      KV: !!env?.KV,
      BUCKET: !!env?.BUCKET,
    },
    version: '0.2.0',
  };

  // Test database connection
  if (env?.DB) {
    try {
      const testQuery = await env.DB.prepare('SELECT 1 as test').first();
      if (testQuery) {
        health.database = 'connected';
        health.dbTest = 'passed';
      }
    } catch (error) {
      health.database = 'error';
      health.dbTest = 'failed';
      health.dbError = error instanceof Error ? error.message : String(error);
    }
  }

  return NextResponse.json(health);
}
