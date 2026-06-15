import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { queryFirst, execute, generateId, now, parseJSON, stringifyJSON, boolToNumber, numberToBool, queryAll } from '@/db/db'
import { getClientIp, rateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { logAdminAction } from '@/lib/audit-logger'

const SECTION_NAME = 'section-manager'

// Define all available homepage sections with their default order
const DEFAULT_SECTIONS = [
  { id: 'fullscreen-video', name: 'Fullscreen Video', order: 1, enabled: true },
  { id: 'hero-slider', name: 'Hero Carousel', order: 2, enabled: true },
  { id: 'marquee', name: 'Marquee Banner', order: 3, enabled: true },
  { id: 'categories', name: 'Categories', order: 4, enabled: true },
  { id: 'category-carousel', name: 'Category Carousel', order: 5, enabled: true },
  { id: 'brands', name: 'Brand Carousel', order: 6, enabled: true },
  { id: 'featured-products', name: 'Featured Products', order: 7, enabled: true },
  { id: 'mosaic-grid', name: 'Mosaic Grid', order: 8, enabled: true },
  { id: 'video-reels', name: 'Video Reels', order: 9, enabled: true },
  { id: 'promotions', name: 'Promotions', order: 10, enabled: true },
  { id: 'stories', name: 'Stories', order: 11, enabled: true },
]

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication (admin or staff)
    const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse
    }

    const env = await getEnv()

    const setting = await queryFirst<any>(
      env,
      'SELECT * FROM homepage_settings WHERE sectionName = ? LIMIT 1',
      SECTION_NAME
    )

    if (!setting) {
      // Return default sections
      return NextResponse.json({
        success: true,
        data: {
          sectionName: SECTION_NAME,
          sections: DEFAULT_SECTIONS,
        }
      })
    }

    const settings = parseJSON<any>(setting.settings) || {}
    const savedSections = settings.sections || []

    // Merge saved sections with defaults to include new sections
    const mergedSections = DEFAULT_SECTIONS.map(defaultSection => {
      const savedSection = savedSections.find((s: any) => s.id === defaultSection.id)
      return {
        ...defaultSection,
        ...(savedSection || {}),
        enabled: savedSection?.enabled !== undefined ? savedSection.enabled : defaultSection.enabled,
        order: savedSection?.order !== undefined ? savedSection.order : defaultSection.order,
      }
    }).sort((a, b) => a.order - b.order)

    return NextResponse.json({
      success: true,
      data: {
        sectionName: SECTION_NAME,
        sections: mergedSections,
      }
    })
  } catch (error) {
    console.error('Error fetching section manager settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch section manager settings'
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

    // Rate limiting: 10 requests per minute per admin
    const clientIp = getClientIp(request)
    const rateLimitKey = `admin-section-manager:${clientIp}`
    const rateLimitResult = await rateLimit(env, rateLimitKey, {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute window
    })

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }

    const body = await request.json()
    const { sections } = body

    console.log('[Section Manager] Request body:', body)
    
    // Validate sections
    if (!sections || !Array.isArray(sections)) {
      console.error('[Section Manager] Invalid sections:', body)
      return NextResponse.json(
        {
          success: false,
          error: 'sections must be an array'
        },
        { status: 400 }
      )
    }

    if (sections.length === 0) {
      console.error('[Section Manager] Empty sections array')
      return NextResponse.json(
        {
          success: false,
          error: 'sections cannot be empty'
        },
        { status: 400 }
      )
    }

    // Validate each section
    for (const section of sections) {
      if (!section.id || typeof section.id !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: 'Each section must have a valid id'
          },
          { status: 400 }
        )
      }
      if (section.order !== undefined && (typeof section.order !== 'number' || section.order < 1)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Section order must be a positive number'
          },
          { status: 400 }
        )
      }
      if (section.enabled !== undefined && typeof section.enabled !== 'boolean') {
        return NextResponse.json(
          {
            success: false,
            error: 'Section enabled must be a boolean'
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

    console.log('[Section Manager] Existing setting:', existing ? 'Found' : 'Not found')

    const customSettings = {
      sections: sections.map((s: any) => ({
        id: s.id,
        name: s.name,
        order: s.order,
        enabled: s.enabled !== undefined ? s.enabled : true,
      })),
    }

    const settingsJson = stringifyJSON(customSettings)
    console.log('[Section Manager] Settings JSON length:', settingsJson?.length)

    if (existing) {
      // Update existing setting
      await execute(
        env,
        `UPDATE homepage_settings SET settings = ?, updatedAt = ? WHERE sectionName = ?`,
        settingsJson,
        now(),
        SECTION_NAME
      )
      console.log('[Section Manager] Updated existing setting')
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
        boolToNumber(true),
        5000,  // autoPlay default value (NOT NULL in schema)
        null,  // displayLimit is optional
        settingsJson,
        currentTime,
        currentTime
      )
      console.log('[Section Manager] Created new setting')
    }

    // Log audit event
    const admin = userOrResponse as { id: string }
    await logAdminAction(
      env,
      request,
      admin.id,
      'UPDATE',
      'HomepageSettings',
      SECTION_NAME,
      `Updated section ordering: ${sections.length} sections reordered`
    )

    return NextResponse.json({
      success: true,
      data: {
        sectionName: SECTION_NAME,
        sections: customSettings.sections,
      }
    })
  } catch (error) {
    console.error('Error updating section manager settings:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update section manager settings',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}