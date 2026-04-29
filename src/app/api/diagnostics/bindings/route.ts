import { NextResponse } from 'next/server';

// Edge Runtime export for Cloudflare

export async function GET(request: Request) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    bindings: {},
    globalChecks: {},
    environmentChecks: {},
  };

  // Check 1: Request context (traditional Workers way)
  const requestEnv = (request as any).env;
  if (requestEnv) {
    diagnostics.environmentChecks.requestEnv = {
      exists: !!requestEnv,
      keys: requestEnv ? Object.keys(requestEnv).filter((k: string) => !k.startsWith('__')) : [],
    };

    // Check individual bindings from request.env
    diagnostics.bindings.requestEnv = {
      DB: {
        exists: !!requestEnv?.DB,
        type: requestEnv?.DB ? typeof requestEnv.DB : 'undefined',
        hasPrepare: requestEnv?.DB && typeof requestEnv.DB.prepare === 'function',
      },
      BUCKET: {
        exists: !!requestEnv?.BUCKET,
        type: requestEnv?.BUCKET ? typeof requestEnv.BUCKET : 'undefined',
        hasPut: requestEnv?.BUCKET && typeof requestEnv.BUCKET.put === 'function',
      },
      KV: {
        exists: !!requestEnv?.KV,
        type: requestEnv?.KV ? typeof requestEnv.KV : 'undefined',
        hasGet: requestEnv?.KV && typeof requestEnv.KV.get === 'function',
        hasPut: requestEnv?.KV && typeof requestEnv.KV.put === 'function',
      },
    };
  }

  // Check 2: global.cloudflare.ctx.env (next-on-pages request context)
  const ctxEnv = globalThis.cloudflare?.ctx?.env;
  if (ctxEnv) {
    diagnostics.environmentChecks.cloudflareCtxEnv = {
      exists: !!ctxEnv,
      keys: Object.keys(ctxEnv).filter((k: string) => !k.startsWith('__')),
    };

    diagnostics.bindings.cloudflareCtxEnv = {
      DB: {
        exists: !!ctxEnv.DB,
        type: ctxEnv.DB ? typeof ctxEnv.DB : 'undefined',
        hasPrepare: ctxEnv.DB && typeof ctxEnv.DB.prepare === 'function',
      },
      BUCKET: {
        exists: !!ctxEnv.BUCKET,
        type: ctxEnv.BUCKET ? typeof ctxEnv.BUCKET : 'undefined',
        hasPut: ctxEnv.BUCKET && typeof ctxEnv.BUCKET.put === 'function',
      },
      KV: {
        exists: !!ctxEnv.KV,
        type: ctxEnv.KV ? typeof ctxEnv.KV : 'undefined',
        hasGet: ctxEnv.KV && typeof ctxEnv.KV.get === 'function',
        hasPut: ctxEnv.KV && typeof ctxEnv.KV.put === 'function',
      },
    };
  }

  // Check 3: global.cloudflare.env (next-on-pages global)
  const cloudflareEnv = globalThis.cloudflare?.env;
  if (cloudflareEnv) {
    diagnostics.environmentChecks.cloudflareEnv = {
      exists: !!cloudflareEnv,
      keys: Object.keys(cloudflareEnv).filter((k: string) => !k.startsWith('__')),
    };

    diagnostics.bindings.cloudflareEnv = {
      DB: {
        exists: !!cloudflareEnv.DB,
        type: cloudflareEnv.DB ? typeof cloudflareEnv.DB : 'undefined',
        hasPrepare: cloudflareEnv.DB && typeof cloudflareEnv.DB.prepare === 'function',
      },
      BUCKET: {
        exists: !!cloudflareEnv.BUCKET,
        type: cloudflareEnv.BUCKET ? typeof cloudflareEnv.BUCKET : 'undefined',
        hasPut: cloudflareEnv.BUCKET && typeof cloudflareEnv.BUCKET.put === 'function',
      },
      KV: {
        exists: !!cloudflareEnv.KV,
        type: cloudflareEnv.KV ? typeof cloudflareEnv.KV : 'undefined',
        hasGet: cloudflareEnv.KV && typeof cloudflareEnv.KV.get === 'function',
        hasPut: cloudflareEnv.KV && typeof cloudflareEnv.KV.put === 'function',
      },
    };
  }

  // Check 4: Global scope
  const globalAny = global as any;
  diagnostics.globalChecks = {
    DB: {
      exists: !!globalAny.DB,
      type: globalAny.DB ? typeof globalAny.DB : 'undefined',
    },
    BUCKET: {
      exists: !!globalAny.BUCKET,
      type: globalAny.BUCKET ? typeof globalAny.BUCKET : 'undefined',
    },
    KV: {
      exists: !!globalAny.KV,
      type: globalAny.KV ? typeof globalAny.KV : 'undefined',
    },
  };

  // Test KV connection
  if (ctxEnv?.KV) {
    try {
      await ctxEnv.KV.put('diagnostic-test', 'test-value', { expirationTtl: 60 });
      const testValue = await ctxEnv.KV.get('diagnostic-test');
      diagnostics.tests = {
        KV: {
          write: 'SUCCESS',
          read: testValue === 'test-value' ? 'SUCCESS' : 'FAILED',
          value: testValue,
        },
      };
    } catch (error: any) {
      diagnostics.tests = {
        KV: {
          write: 'FAILED',
          read: 'FAILED',
          error: error.message,
        },
      };
    }
  }

  // Test DB connection
  if (ctxEnv?.DB) {
    try {
      const result = await ctxEnv.DB.prepare('SELECT 1 as test').first();
      diagnostics.tests = {
        ...diagnostics.tests,
        DB: {
          query: 'SUCCESS',
          result: result,
        },
      };
    } catch (error: any) {
      diagnostics.tests = {
        ...diagnostics.tests,
        DB: {
          query: 'FAILED',
          error: error.message,
          stack: error.stack,
        },
      };
    }
  }

  return NextResponse.json(diagnostics);
}
