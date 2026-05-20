import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { queryFirst, execute, generateId, now, parseJSON, stringifyJSON, boolToNumber, numberToBool } from '@/db/db'
import { getClientIp, rateLimit, createRateLimitResponse } from '@/lib/rate-limit'

const SECTION_NAME = 'marquee'
const DEFAULT_MARQUEE_TEXT = 'FREE SHIPPING WORLDWIDE | EASY RETURNS & EXCHANGES | CUSTOM STITCHING AVAILABLE'

export async function GET(request: NextRequest) {
  try {
    const env = await getEnv()

    const setting = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      SECTION_NAME
    )

    if (!setting) {
      // Return default marquee text
      return NextResponse.json({
        success: true,
        data: {
          sectionName: SECTION_NAME,
          text: DEFAULT_MARQUEE_TEXT,
          isEnabled: true,
          animationSpeed: 20, // seconds for full cycle
        }
      })
    }

    const settings = parseJSON<any>(setting.settings) || {}

    return NextResponse.json({
      success: true,
      data: {
        sectionName: SECTION_NAME,
        text: settings.text || DEFAULT_MARQUEE_TEXT,
        isEnabled: typeof setting.isEnabled === 'boolean' ? setting.isEnabled : numberToBool(setting.isEnabled),
        animationSpeed: settings.animationSpeed || 20,
      }
    })
  } catch (error) {
    console.error('Error fetching marquee settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch marquee settings'
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
  const rateLimitKey = `admin-marquee:${clientIp}`;
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute window
  });

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const body = await request.json()
    const { text, isEnabled, animationSpeed } = body

    // Validate text
    if (text !== undefined && (typeof text !== 'string' || text.trim().length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Marquee text must be a non-empty string'
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

    // Validate animationSpeed
    if (animationSpeed !== undefined && (typeof animationSpeed !== 'number' || animationSpeed < 5 || animationSpeed > 60)) {
      return NextResponse.json(
        {
          success: false,
          error: 'animationSpeed must be a number between 5 and 60 seconds'
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
      text: text || DEFAULT_MARQUEE_TEXT,
      animationSpeed: animationSpeed || 20,
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
        5000, // Default autoPlay value (NOT NULL column)
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
        text: settings.text || DEFAULT_MARQUEE_TEXT,
        isEnabled: typeof updated?.isEnabled === 'boolean' ? updated?.isEnabled : numberToBool(updated?.isEnabled),
        animationSpeed: settings.animationSpeed || 20,
      }
    })
  } catch (error) {
    console.error('Error updating marquee settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update marquee settings'
      },
      { status: 500 }
    )
  }
}
