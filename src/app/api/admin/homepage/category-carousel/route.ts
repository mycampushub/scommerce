import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { queryFirst, execute, generateId, now, parseJSON, stringifyJSON, boolToNumber, numberToBool, queryAll } from '@/db/db'
import { getClientIp, rateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { logAdminAction } from '@/lib/audit-logger'

const SECTION_NAME = 'category-carousel'

export async function GET(request: NextRequest) {
  // Verify admin authentication (admin or staff)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()

    const setting = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      SECTION_NAME
    )

    if (!setting) {
      // Return default - no categories selected
      return NextResponse.json({
        success: true,
        data: {
          sectionName: SECTION_NAME,
          categoryIds: [],
          isEnabled: true,
          autoScroll: true,
          scrollInterval: 4000,
          heading: 'Shop by Category',
          description: 'Explore our wide range of categories',
        }
      })
    }

    const settings = parseJSON<any>(setting.settings) || {}

    return NextResponse.json({
      success: true,
      data: {
        sectionName: SECTION_NAME,
        categoryIds: settings.categoryIds || [],
        isEnabled: typeof setting.isEnabled === 'boolean' ? setting.isEnabled : numberToBool(setting.isEnabled),
        autoScroll: settings.autoScroll !== undefined ? settings.autoScroll : true,
        scrollInterval: settings.scrollInterval || 4000,
        heading: settings.heading || 'Shop by Category',
        description: settings.description || 'Explore our wide range of categories',
      }
    })
  } catch (error) {
    console.error('Error fetching category carousel settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch category carousel settings'
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
  const rateLimitKey = `admin-category-carousel:${clientIp}`;
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute window
  });

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json()
    const { categoryIds, isEnabled, autoScroll, scrollInterval, heading, description } = body

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

    // Validate autoScroll
    if (autoScroll !== undefined && typeof autoScroll !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: 'autoScroll must be a boolean'
        },
        { status: 400 }
      )
    }

    // Validate scrollInterval
    if (scrollInterval !== undefined && (typeof scrollInterval !== 'number' || scrollInterval < 2000 || scrollInterval > 10000)) {
      return NextResponse.json(
        {
          success: false,
          error: 'scrollInterval must be a number between 2000 and 10000 milliseconds'
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

    // If categoryIds provided, verify they exist
    if (categoryIds && categoryIds.length > 0) {
      const placeholders = categoryIds.map(() => '?').join(',')
      const categories = await queryAll<any>(
        env,
        `SELECT id FROM categories WHERE id IN (${placeholders})`,
        ...(categoryIds || [])
      )

      if (categories.length !== categoryIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: 'One or more category IDs are invalid'
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
      categoryIds: categoryIds || [],
      autoScroll: autoScroll !== undefined ? autoScroll : true,
      scrollInterval: scrollInterval || 4000,
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
      'AdminLog',
      SECTION_NAME,
      `Updated category carousel: ${categoryIds ? categoryIds.length : 0} categories, autoScroll: ${autoScroll !== undefined ? autoScroll : 'unchanged'}, scrollInterval: ${scrollInterval || 'default'}ms`
    )

    return NextResponse.json({
      success: true,
      data: {
        sectionName: SECTION_NAME,
        categoryIds: settings.categoryIds || [],
        isEnabled: typeof updated?.isEnabled === 'boolean' ? updated?.isEnabled : numberToBool(updated?.isEnabled),
        autoScroll: settings.autoScroll !== undefined ? settings.autoScroll : true,
        scrollInterval: settings.scrollInterval || 4000,
        heading: settings.heading || 'Shop by Category',
        description: settings.description || 'Explore our wide range of categories',
      }
    })
  } catch (error) {
    console.error('Error updating category carousel settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update category carousel settings'
      },
      { status: 500 }
    )
  }
}
