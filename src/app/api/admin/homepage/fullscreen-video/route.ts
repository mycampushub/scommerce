import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { queryFirst, execute, generateId, now, parseJSON, stringifyJSON, boolToNumber, numberToBool } from '@/db/db'
import { getClientIp, rateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { logAdminAction } from '@/lib/audit-logger'

const SECTION_NAME = 'fullscreen-video'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication (admin or staff)
    const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse
    }

    const env = await getEnv()
    if (!env) {
      console.error('[Fullscreen Video GET] No env available')
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
      // Return default - no video configured
      return NextResponse.json({
        success: true,
        data: {
          sectionName: SECTION_NAME,
          videoUrl: '',
          isEnabled: true,
          heading: 'Featured Video',
          description: 'Experience our exclusive video content',
        }
      })
    }

    const settings = parseJSON<any>(setting.settings) || {}

    return NextResponse.json({
      success: true,
      data: {
        sectionName: SECTION_NAME,
        videoUrl: settings.videoUrl || '',
        isEnabled: typeof setting.isEnabled === 'boolean' ? setting.isEnabled : numberToBool(setting.isEnabled),
        heading: settings.heading || 'Featured Video',
        description: settings.description || 'Experience our exclusive video content',
      }
    })
  } catch (error) {
    console.error('Error fetching fullscreen video settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch fullscreen video settings'
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
      console.error('[Fullscreen Video PUT] No env available')
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      )
    }

    // Rate limiting: 10 requests per minute per admin
    const clientIp = getClientIp(request)
    const rateLimitKey = `admin-fullscreen-video:${clientIp}`
    const rateLimitResult = await rateLimit(env, rateLimitKey, {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute window
    })

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const body = await request.json()
    const { videoUrl, isEnabled, heading, description } = body

    console.log('[Fullscreen Video] Request body:', body)

    // Validate videoUrl
    if (videoUrl !== undefined && typeof videoUrl !== 'string') {
      console.error('[Fullscreen Video] Invalid videoUrl:', videoUrl)
      return NextResponse.json(
        {
          success: false,
          error: 'videoUrl must be a string'
        },
        { status: 400 }
      )
    }

    // Validate isEnabled
    if (isEnabled !== undefined && typeof isEnabled !== 'boolean') {
      console.error('[Fullscreen Video] Invalid isEnabled:', isEnabled)
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
      videoUrl: videoUrl || '',
      heading: heading || 'Featured Video',
      description: description || 'Experience our exclusive video content',
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
        5000,  // autoPlay default value (NOT NULL in schema)
        null,  // displayLimit is optional
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
      `Updated fullscreen video: enabled=${isEnabled !== undefined ? isEnabled : 'unchanged'}`
    )

    return NextResponse.json({
      success: true,
      data: {
        sectionName: SECTION_NAME,
        videoUrl: settings.videoUrl || '',
        isEnabled: typeof updated?.isEnabled === 'boolean' ? updated?.isEnabled : numberToBool(updated?.isEnabled),
        heading: settings.heading || 'Featured Video',
        description: settings.description || 'Experience our exclusive video content',
      }
    })
  } catch (error) {
    console.error('Error updating fullscreen video settings:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update fullscreen video settings',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}