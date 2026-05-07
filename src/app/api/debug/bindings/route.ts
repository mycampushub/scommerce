import { NextRequest, NextResponse } from 'next/server';
import { extractBindingsFromRequest, extractBindingsFromGlobal } from '@/lib/bindings-extractor';
import { getEnv } from '@/lib/cloudflare';

export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
  };

  // Try to extract bindings from request
  debugInfo.requestBindings = extractBindingsFromRequest(request);
  debugInfo.hasRequestBindings = !!debugInfo.requestBindings;

  // Try to extract bindings from global
  debugInfo.globalBindings = extractBindingsFromGlobal();
  debugInfo.hasGlobalBindings = !!debugInfo.globalBindings;

  // Try existing getEnv function
  debugInfo.getEnvResult = getEnv(request);
  debugInfo.hasGetEnv = !!debugInfo.getEnvResult;

  // Request object inspection
  const r = request as any;
  debugInfo.requestKeys = Object.keys(r);
  debugInfo.requestPrototype = Object.getPrototypeOf(r)?.constructor?.name;

  // Global this inspection
  if (typeof globalThis !== 'undefined') {
    debugInfo.globalKeys = Object.keys(globalThis).filter(k => 
      !k.startsWith('_') && !['window', 'self', 'global', 'document'].includes(k)
    );
  }

  return NextResponse.json(debugInfo);
}
