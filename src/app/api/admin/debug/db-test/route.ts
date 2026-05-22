import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { execute, queryFirst, queryAll, generateId, now, stringifyJSON } from '@/db/db'
import { verifyAdminAuth } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()

    const results = {
      timestamp: new Date().toISOString(),
      envAvailable: !!env,
      dbAvailable: !!(env as any)?.DB,
      tests: [] as any[],
    }

    // Test 1: Simple SELECT
    try {
      const count = await queryFirst<{ count: number }>(
        env,
        'SELECT COUNT(*) as count FROM promotions'
      )
      results.tests.push({
        name: 'Simple SELECT COUNT',
        success: true,
        result: count
      })
    } catch (error: any) {
      results.tests.push({
        name: 'Simple SELECT COUNT',
        success: false,
        error: error?.message || String(error)
      })
    }

    // Test 2: INSERT with all data types
    try {
      const id = generateId()
      await execute(
        env,
        `INSERT INTO promotions (id, title, description, image, ctaText, ctaLink, type,
         promoCode, discountType, discountValue, minOrderAmount, maxDiscountAmount,
         startDate, endDate, usageLimit, usedCount, userLimit, applicableCategories,
         applicableProducts, conditions, discountRules, isActive, \`order\`, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        'Test Promotion',
        'Test description',
        null,
        null,
        null,
        'coupon',
        'TESTCODE123',
        'percentage',
        10.5,
        100.0,
        50.0,
        null,
        null,
        100,
        0,
        1,
        stringifyJSON(['cat-test']),
        stringifyJSON(['prod-test']),
        'Test conditions',
        stringifyJSON({ rule: 'test' }),
        1,
        0,
        now(),
        now()
      )

      // Cleanup
      await execute(env, 'DELETE FROM promotions WHERE id = ?', id)

      results.tests.push({
        name: 'INSERT with all data types',
        success: true,
        result: 'Inserted and deleted successfully'
      })
    } catch (error: any) {
      results.tests.push({
        name: 'INSERT with all data types',
        success: false,
        error: error?.message || String(error)
      })
    }

    // Test 3: Check database schema
    try {
      const schemaInfo = await queryAll<any>(
        env,
        'SELECT name, type FROM pragma_table_info("promotions") ORDER BY cid'
      )
      results.tests.push({
        name: 'Schema Check',
        success: true,
        result: schemaInfo
      })
    } catch (error: any) {
      results.tests.push({
        name: 'Schema Check',
        success: false,
        error: error?.message || String(error)
      })
    }

    return NextResponse.json({
      success: true,
      data: results
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
      stack: error?.stack
    }, { status: 500 })
  }
}
