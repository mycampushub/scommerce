import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { queryFirst, execute, generateId, now, parseJSON, stringifyJSON, boolToNumber, numberToBool } from '@/db/db'
import { getClientIp, rateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { logAdminAction } from '@/lib/audit-logger'

const SECTION_NAME = 'category-grid'

export async function GET(request: NextRequest) {
  try {
    const env = await getEnv()

    const setting = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      SECTION_NAME
    )

    if (!setting) {
      return NextResponse.json({
        success: true,
        data: {
          categoryIds: [],
          isEnabled: true,
          heading: 'Shop by Category',
          description: 'Explore our wide range of categories'
        }
      })
    }

    const settings = parseJSON<any>(setting.settings) || {}

    return NextResponse.json({
      success: true,
      data: {
        categoryIds: settings.categoryIds || [],
        isEnabled: numberToBool(setting.isEnabled),
        heading: settings.heading || 'Shop by Category',
        description: settings.description || 'Explore our wide range of categories'
      }
    })
  } catch (error) {
    console.error('Error fetching category grid settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch category grid settings'
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
  const clientIp = getClientIp(request)
  const rateLimitKey = `admin-category-grid:${clientIp}`
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute window
  })

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult)
  }

  try {
    const body = await request.json()
    const { categoryIds, isEnabled, heading, description } = body

    // Validate categoryIds
    if (categoryIds !== undefined && !Array.isArray(categoryIds)) {
      return NextResponse.json(
        {
          success: false,
          error: 'categoryIds must be an array'
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

    // Validate heading
    if (heading !== undefined && (typeof heading !== 'string' || heading.length > 200)) {
      return NextResponse.json(
        {
          success: false,
          error: 'heading must be a string with max 200 characters'
        },
        { status: 400 }
      )
    }

    // Validate description
    if (description !== undefined && (typeof description !== 'string' || description.length > 500)) {
      return NextResponse.json(
        {
          success: false,
          error: 'description must be a string with max 500 characters'
        },
        { status: 400 }
      )
    }

    // Check if setting exists
    const existing = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      SECTION_NAME
    )

    const customSettings = {
      categoryIds: categoryIds || [],
      heading: heading || 'Shop by Category',
      description: description || 'Explore our wide range of categories',
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
        boolToNumber(true), // autoPlay should be a boolean (1 or 0)
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

    // Log audit event
    const admin = userOrResponse as { id: string }
    await logAdminAction(
      env,
      request,
      admin.id,
      'UPDATE',
      'HomepageSettings',
      SECTION_NAME,
      `Updated category grid: ${categoryIds ? categoryIds.length : 0} categories selected`
    )

    return NextResponse.json({
      success: true,
      data: {
        sectionName: SECTION_NAME,
        categoryIds: settings.categoryIds || [],
        isEnabled: typeof updated?.isEnabled === 'boolean' ? updated?.isEnabled : numberToBool(updated?.isEnabled),
        heading: settings.heading || 'Shop by Category',
        description: settings.description || 'Explore our wide range of categories',
      }
    })
  } catch (error) {
    console.error('Error updating category grid settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update category grid settings'
      },
      { status: 500 }
    )
  }
}