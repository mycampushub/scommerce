import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { queryFirst, execute, generateId, now, parseJSON, stringifyJSON, boolToNumber, numberToBool } from '@/db/db'
import { getClientIp, rateLimit, createRateLimitResponse } from '@/lib/rate-limit'

const SECTION_NAME = 'reels_carousel'

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
      // Return default settings
      return NextResponse.json({
        success: true,
        data: {
          sectionName: SECTION_NAME,
          isEnabled: true,
          autoPlay: 3000,
          autoScroll: true,
          heading: 'Trending Reels',
          description: 'Watch the latest video content',
        }
      })
    }

    const settings = parseJSON<any>(setting.settings) || {}

    return NextResponse.json({
      success: true,
      data: {
        sectionName: SECTION_NAME,
        isEnabled: typeof setting.isEnabled === 'boolean' ? setting.isEnabled : numberToBool(setting.isEnabled),
        autoPlay: setting.autoPlay || 3000,
        autoScroll: settings.autoScroll !== undefined ? settings.autoScroll : true,
        heading: settings.heading || 'Trending Reels',
        description: settings.description || 'Watch the latest video content',
      }
    })
  } catch (error) {
    console.error('Error fetching reels carousel settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch reels carousel settings'
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
  const rateLimitKey = `admin-reels-carousel:${clientIp}`;
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute window
  });

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json()
    const { isEnabled, autoPlay, autoScroll, heading, description } = body

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

    // Validate autoPlay
    if (autoPlay !== undefined && (typeof autoPlay !== 'number' || autoPlay < 1000 || autoPlay > 10000)) {
      return NextResponse.json(
        {
          success: false,
          error: 'autoPlay must be a number between 1000 and 10000 milliseconds'
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
      autoScroll: autoScroll !== undefined ? autoScroll : true,
      heading: heading || 'Trending Reels',
      description: description || 'Watch the latest video content',
    }

    if (existing) {
      // Update existing setting
      const updates: string[] = []
      const params: any[] = []

      if (isEnabled !== undefined) {
        updates.push('isEnabled = ?')
        params.push(boolToNumber(isEnabled))
      }

      if (autoPlay !== undefined) {
        updates.push('autoPlay = ?')
        params.push(autoPlay)
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
        autoPlay || 3000,
        null, // displayLimit can be NULL
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
        isEnabled: typeof updated?.isEnabled === 'boolean' ? updated?.isEnabled : numberToBool(updated?.isEnabled),
        autoPlay: updated?.autoPlay || 3000,
        autoScroll: settings.autoScroll !== undefined ? settings.autoScroll : true,
        heading: settings.heading || 'Trending Reels',
        description: settings.description || 'Watch the latest video content',
      }
    })
  } catch (error) {
    console.error('Error updating reels carousel settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update reels carousel settings'
      },
      { status: 500 }
    )
  }
}
