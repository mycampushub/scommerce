import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { queryAll, count } from '@/db/db'

/**
 * Test API to verify Cloudflare bindings are working
 * GET /api/test-bindings
 */
export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request)
    const results: any = {
      bindings: {},
      operations: {},
      errors: []
    }

    // Test 1: Check D1 Database Binding
    console.log('[Test Bindings] Checking DB binding...')
    if (env?.DB) {
      results.bindings.DB = 'connected'

      try {
        // Test read operation
        const users = await queryAll(env, 'SELECT COUNT(*) as count FROM users LIMIT 1')
        results.operations.database = {
          read: 'success',
          userCount: users[0]?.count || 0
        }
      } catch (dbError: any) {
        results.operations.database = {
          read: 'failed',
          error: dbError.message
        }
        results.errors.push(`Database read error: ${dbError.message}`)
      }
    } else {
      results.bindings.DB = 'NOT FOUND'
      results.errors.push('DB binding is not available')
    }

    // Test 2: Check KV Namespace Binding
    console.log('[Test Bindings] Checking KV binding...')
    if (env?.KV) {
      results.bindings.KV = 'connected'

      try {
        // Test write operation
        const testKey = `test:${Date.now()}`
        await env.KV.put(testKey, 'test-value', { expirationTtl: 60 })

        // Test read operation
        const value = await env.KV.get(testKey, 'text')

        results.operations.kv = {
          write: 'success',
          read: 'success',
          testValue: value
        }

        // Cleanup
        await env.KV.delete(testKey)
      } catch (kvError: any) {
        results.operations.kv = {
          write: 'failed',
          read: 'failed',
          error: kvError.message
        }
        results.errors.push(`KV operation error: ${kvError.message}`)
      }
    } else {
      results.bindings.KV = 'NOT FOUND'
      results.errors.push('KV binding is not available')
    }

    // Test 3: Check R2 Bucket Binding
    console.log('[Test Bindings] Checking R2 binding...')
    if (env?.BUCKET) {
      results.bindings.BUCKET = 'connected'

      try {
        // Test list operation
        const listed = await env.BUCKET.list({ limit: 1 })
        results.operations.r2 = {
          list: 'success',
          objectsFound: listed.objects.length
        }
      } catch (r2Error: any) {
        results.operations.r2 = {
          list: 'failed',
          error: r2Error.message
        }
        results.errors.push(`R2 operation error: ${r2.message}`)
      }
    } else {
      results.bindings.BUCKET = 'NOT FOUND'
      results.errors.push('R2 bucket binding is not available')
    }

    // Summary
    const allBindingsConnected = Object.values(results.bindings).every(val => val === 'connected')
    const hasErrors = results.errors.length > 0

    return NextResponse.json({
      success: allBindingsConnected,
      hasErrors,
      environment: process.env.NODE_ENV || 'unknown',
      bindings: results.bindings,
      operations: results.operations,
      errors: results.errors,
      summary: allBindingsConnected
        ? 'All bindings are connected and working!'
        : 'Some bindings are missing or not working. See errors below.'
    }, {
      status: hasErrors ? 500 : 200
    })
  } catch (error: any) {
    console.error('[Test Bindings] Critical error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
