import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { queryFirst, execute, generateId, now, parseJSON, stringifyJSON, boolToNumber, numberToBool, queryAll } from '@/db/db'
import { getClientIp, rateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { logAdminAction } from '@/lib/audit-logger'

const SECTION_NAME = 'mosaic_grid'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication (admin or staff)
    const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse
    }

    const env = await getEnv()
    if (!env) {
      console.error('[Mosaic Grid GET] No env available')
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      )
    }

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
          heading: 'Shop the Look',
          description: 'Explore our curated collection of trending styles',
        }
      })
    }

    const settings = parseJSON<any>(setting.settings) || {}

    return NextResponse.json({
      success: true,
      data: {
        sectionName: SECTION_NAME,
        productIds: settings.productIds || [],
        isEnabled: typeof setting.isEnabled === 'boolean' ? setting.isEnabled : numberToBool(setting.isEnabled),
        heading: settings.heading || 'Shop the Look',
        description: settings.description || 'Explore our curated collection of trending styles',
      }
    })
  } catch (error) {
    console.error('Error fetching mosaic grid settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch mosaic grid settings'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const userOrResponse = await verifyAdminAuth(request, ['admin'])
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse
    }

    const env = await getEnv()
    if (!env) {
      console.error('[Mosaic Grid PUT] No env available')
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      )
    }

    // Rate limiting: 10 requests per minute per admin
    const clientIp = getClientIp(request)
    const rateLimitKey = `admin-mosaic-grid:${clientIp}`
    const rateLimitResult = await rateLimit(env, rateLimitKey, {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute window
    })

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const body = await request.json()
    const { productIds, isEnabled, heading, description } = body

    console.log('[Mosaic Grid] Request body:', body)

    // Validate productIds
    if (productIds !== undefined && !Array.isArray(productIds)) {
      console.error('[Mosaic Grid] Invalid productIds:', productIds)
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
      console.error('[Mosaic Grid] Invalid isEnabled:', isEnabled)
      return NextResponse.json(
        {
          success: false,
          error: 'isEnabled must be a boolean'
        },
        { status: 400 }
      )
    }

    // Validate heading if provided
    if (heading !== undefined && (typeof heading !== 'string' || heading.length > 200)) {
      return NextResponse.json(
        {
          success: false,
          error: 'heading must be a string with max 200 characters'
        },
        { status: 400 }
      )
    }

    // Validate description if provided
    if (description !== undefined && (typeof description !== 'string' || description.length > 500)) {
      return NextResponse.json(
        {
          success: false,
          error: 'description must be a string with max 500 characters'
        },
        { status: 400 }
      )
    }

    // If productIds provided and not empty, verify they exist
    if (productIds && productIds.length > 0) {
      console.log('[Mosaic Grid] Verifying product IDs:', productIds)

      // Build a simpler query to verify products exist
      const existingProducts = await queryAll<any>(
        env,
        'SELECT id FROM products WHERE id IN (' + productIds.map(() => '?').join(',') + ')',
        ...productIds
      )

      console.log('[Mosaic Grid] Found products:', existingProducts.length, 'expected:', productIds.length)

      if (existingProducts.length !== productIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: 'One or more product IDs are invalid',
            details: `Found ${existingProducts.length} of ${productIds.length} products`
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

    console.log('[Mosaic Grid] Existing setting:', existing ? 'Found' : 'Not found')

    const customSettings = {
      productIds: productIds || [],
      heading: heading && heading.trim() ? heading : undefined,
      description: description && description.trim() ? description : undefined,
    }

    const settingsJson = stringifyJSON(customSettings)
    console.log('[Mosaic Grid] Settings JSON length:', settingsJson?.length)
    console.log('[Mosaic Grid] Product IDs count:', productIds?.length || 0)

    if (existing) {
      // Update existing setting - always update isEnabled to ensure consistency
      const updates: string[] = ['isEnabled = ?', 'settings = ?', 'updatedAt = ?']
      const params: any[] = [
        boolToNumber(isEnabled !== undefined ? isEnabled : true),
        settingsJson,
        now(),
        SECTION_NAME
      ]

      console.log('[Mosaic Grid] Updating existing setting')
      await execute(
        env,
        `UPDATE homepage_settings SET ${updates.join(', ')} WHERE sectionName = ?`,
        ...params
      )
      console.log('[Mosaic Grid] Updated existing setting')
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
        5000,  // autoPlay default value (NOT NULL in schema)
        null,  // displayLimit is optional
        settingsJson,
        currentTime,
        currentTime
      )
      console.log('[Mosaic Grid] Created new setting')
    }

    // Fetch updated setting
    const updated = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      SECTION_NAME
    )

    if (!updated) {
      console.error('[Mosaic Grid] Failed to fetch updated setting')
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to verify update'
        },
        { status: 500 }
      )
    }

    const settings = parseJSON<any>(updated.settings) || {}

    // Log audit event
    const admin = userOrResponse as { id: string }
    await logAdminAction(
      env,
      request,
      admin.id,
      'UPDATE',
      'HomepageSettings',
      SECTION_NAME,
      `Updated mosaic grid: ${productIds ? productIds.length : 0} products, enabled: ${isEnabled !== undefined ? isEnabled : 'unchanged'}`
    )

    return NextResponse.json({
      success: true,
      data: {
        sectionName: SECTION_NAME,
        productIds: settings.productIds || [],
        isEnabled: typeof updated?.isEnabled === 'boolean' ? updated?.isEnabled : numberToBool(updated?.isEnabled),
        heading: settings.heading || 'Shop the Look',
        description: settings.description || 'Explore our curated collection of trending styles',
      }
    })
  } catch (error) {
    console.error('Error updating mosaic grid settings:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update mosaic grid settings',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}