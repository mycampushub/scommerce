import { NextRequest, NextResponse } from 'next/server';
import { extractBindingsFromRequest } from '@/lib/bindings-extractor';
import { getEnv } from '@/lib/cloudflare';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const isFull = url.searchParams.get('full') === 'true';

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_RUNTIME: process.env.NEXT_RUNTIME,
    },
  };

  // Request information
  diagnostics.request = {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    cookies: Object.keys(request.cookies || {}),
  };

  // Bindings diagnostics
  const bindings = extractBindingsFromRequest(request);
  const env = getEnv(request);
  
  diagnostics.bindings = {
    foundOnRequest: !!bindings,
    hasDB: !!bindings?.DB,
    hasKV: !!bindings?.KV,
    hasBUCKET: !!bindings?.BUCKET,
    envResult: !!env,
    envHasDB: !!env?.DB,
    envHasKV: !!env?.KV,
    envHasBUCKET: !!env?.BUCKET,
  };

  // Test database connection if bindings available
  if (bindings?.DB) {
    try {
      const testResult = await bindings.DB.prepare('SELECT 1 as test').first();
      diagnostics.database = {
        status: 'connected',
        testResult: testResult,
      };
    } catch (error: any) {
      diagnostics.database = {
        status: 'error',
        error: error?.message || String(error),
      };
    }
  } else {
    diagnostics.database = {
      status: 'no_bindings',
    };
  }

  // Include additional info if full debug requested
  if (isFull) {
    const r = request as any;
    diagnostics._full = {
      requestKeys: Object.keys(r),
      requestPrototype: Object.getPrototypeOf(r)?.constructor?.name,
      globalKeys: typeof globalThis !== 'undefined' 
        ? Object.keys(globalThis).filter(k => !k.startsWith('_') && !['window', 'self', 'global', 'document'].includes(k))
        : [],
    };
  }

  return NextResponse.json(diagnostics, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Helper endpoint to log API calls for troubleshooting
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'log-error') {
    try {
      const body = await request.json();
      console.error('[API-DEBUG] Error logged:', body);
      
      return NextResponse.json({
        success: true,
        message: 'Error logged to console',
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse error log',
      }, { status: 400 });
    }
  }

  if (action === 'test-api') {
    const { endpoint, method = 'GET', headers = {}, body } = await request.json();
    
    try {
      const testUrl = new URL(endpoint, request.url);
      const testHeaders = new Headers(headers);
      
      const response = await fetch(testUrl.toString(), {
        method,
        headers: testHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseData = await response.text();
      
      return NextResponse.json({
        success: true,
        test: {
          endpoint,
          method,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          response: responseData,
        },
      });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: error?.message || String(error),
      });
    }
  }

  return NextResponse.json({
    availableActions: ['log-error', 'test-api'],
    usage: {
      'log-error': 'POST with { action: "log-error", error: {...} } to log errors',
      'test-api': 'POST with { action: "test-api", endpoint: "...", method: "...", headers?: {...}, body?: {...} } to test any API endpoint',
    },
  });
}
