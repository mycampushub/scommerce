import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';

export async function GET() {
  const env = getEnv();
  
  const results: any = {
    bindingsPresent: !!env,
    hasDB: !!env?.DB,
    hasBUCKET: !!env?.BUCKET,
    hasKV: !!env?.KV,
    timestamp: new Date().toISOString(),
  };

  // Test D1 binding if available
  if (env?.DB) {
    try {
      const result = await env.DB.prepare('SELECT 1 as test').first();
      results.d1Test = { success: true, result };
    } catch (error: any) {
      results.d1Test = { success: false, error: error.message };
    }
  }

  // Test KV binding if available
  if (env?.KV) {
    try {
      await env.KV.put('test-key', 'test-value');
      const value = await env.KV.get('test-key');
      results.kvTest = { success: true, value };
      await env.KV.delete('test-key');
    } catch (error: any) {
      results.kvTest = { success: false, error: error.message };
    }
  }

  // Test R2 binding if available
  if (env?.BUCKET) {
    try {
      const testKey = `test-${Date.now()}.txt`;
      await env.BUCKET.put(testKey, 'test content');
      const object = await env.BUCKET.get(testKey);
      results.r2Test = { 
        success: true, 
        uploaded: !!object,
        key: testKey 
      };
      await env.BUCKET.delete(testKey);
    } catch (error: any) {
      results.r2Test = { success: false, error: error.message };
    }
  }

  return NextResponse.json(results);
}
