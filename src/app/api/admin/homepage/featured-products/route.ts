import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { queryFirst, execute, generateId, now, parseJSON, stringifyJSON, boolToNumber, queryAll } from '@/db/db'
import { getClientIp, rateLimit, createRateLimitResponse } from '@/lib/rate-limit'

const SECTION_NAME = 'featured_products'

export async function GET(request: NextRequest) {
  try {
    const env = await getEnv()

    const setting = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      SECTION_NAME
    )

    if (!setting) {
      // Return default - no products selected
      return NextResponse.json({
        success: true,
        data: {
          sectionName: SECTION_NAME,
          productIds: [],
          isEnabled: true,
        }
      })
    }

    const settings = parseJSON<any>(setting.settings) || {}

    return NextResponse.json({
      success: true,
      data: {
        sectionName: SECTION_NAME,
        productIds: settings.productIds || [],
        isEnabled: typeof setting.isEnabled === 'boolean' ? setting.isEnabled : boolToNumber(setting.isEnabled),
      }
    })
  } catch (error) {
    console.error('Error fetching featured products settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch featured products settings'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  const env = await getEnv()

  // Rate limiting: 10 requests per minute per admin
  const clientIp = getClientIp(request);
  const rateLimitKey = `admin-featured-products:${clientIp}`;
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute window
  });

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json()
    const { productIds, isEnabled } = body

    // Validate productIds
    if (productIds !== undefined && !Array.isArray(productIds)) {
      return NextResponse.json(
        {
          success: false,
          error: 'productIds must be an array'
        },
        { status: 400 }
      )
    }

    // Validate isEnabled
    if (isEnabled !== undefined && typeof isEnabled !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'isEnabled must be a boolean'
        },
        { status: 400 }
      )
    }

    // If productIds provided, verify they exist
    if (productIds && productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',')
      const products = await queryAll<any>(
        env,
        `SELECT id FROM products WHERE id IN (${placeholders})`,
        ...(productIds || [])
      )

      if (products.length !== productIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: 'One or more product IDs are invalid'
          },
          { status: 400 }
        )
      }
    }

    // Check if setting exists
    const existing = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      SECTION_NAME
    )

    const customSettings = {
      productIds: productIds || [],
    }

    if (existing) {
      // Update existing setting
      const updates: string[] = []
      const params: any[] = []

      if (isEnabled !== undefined) {
        updates.push('isEnabled = ?')
        params.push(boolToNumber(isEnabled))
      }

      updates.push('settings = ?')
      params.push(stringifyJSON(customSettings))
      updates.push('updatedAt = ?')
      params.push(now())
      params.push(SECTION_NAME)

      await execute(
        env,
        `UPDATE homepage_settings SET ${updates.join(', ')} WHERE sectionName = ?`,
        ...params
      )
    } else {
      // Create new setting
      const id = generateId()
      const currentTime = now()

      await execute(
        env,
        `INSERT INTO homepage_settings (id, sectionName, isEnabled, autoPlay, displayLimit, settings, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        SECTION_NAME,
        boolToNumber(isEnabled !== undefined ? isEnabled : true),
        null,
        null,
        stringifyJSON(customSettings),
        currentTime,
        currentTime
      )
    }

    // Fetch updated setting
    const updated = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      SECTION_NAME
    )

    const settings = parseJSON<any>(updated?.settings) || {}

    return NextResponse.json({
      success: true,
      data: {
        sectionName: SECTION_NAME,
        productIds: settings.productIds || [],
        isEnabled: typeof updated?.isEnabled === 'boolean' ? updated?.isEnabled : boolToNumber(updated?.isEnabled),
      }
    })
  } catch (error) {
    console.error('Error updating featured products settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update featured products settings'
      },
      { status: 500 }
    )
  }
}
