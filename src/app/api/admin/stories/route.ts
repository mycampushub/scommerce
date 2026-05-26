import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { MediaRepository } from '@/db/media.repository'
import { queryFirst } from '@/db/db'
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/rate-limit'
import { logAdminAction } from '@/lib/audit-logger'


export async function GET(request: NextRequest) {
  // Verify admin authentication (admin or staff)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const stories = activeOnly
      ? await MediaRepository.findAllActiveStories(env)
      : await MediaRepository.findAllStories(env)

    return NextResponse.json({
      success: true,
      data: stories
    })
  } catch (error) {
    console.error('Error fetching stories:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stories'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  // Rate limiting: 20 requests per minute per admin
  const env = await getEnv()
  const clientIp = getClientIp(request)
  const rateLimitKey = `admin-story-create:${clientIp}`
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  })

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult)
  }

  try {
    const body = await request.json() as any
    const { title, thumbnail, images, isActive, order } = body

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title is required'
        },
        { status: 400 }
      )
    }

    if (!thumbnail || typeof thumbnail !== 'string' || thumbnail.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thumbnail is required'
        },
        { status: 400 }
      )
    }

    // Validate thumbnail URL - allow relative URLs starting with /
    function isValidUrl(url: string): boolean {
      if (!url || typeof url !== 'string') return false

      // Allow relative URLs starting with /
      if (url.startsWith('/')) return true

      // Validate full URLs
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    }

    if (!isValidUrl(thumbnail)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid thumbnail URL. Must be a valid URL or start with /'
        },
        { status: 400 }
      )
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one image is required'
        },
        { status: 400 }
      )
    }

    // Validate image URLs - allow relative URLs starting with /
    for (const img of images) {
      if (!isValidUrl(img)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid image URL: ${img}. Must be a valid URL or start with /`
          },
          { status: 400 }
        )
      }
    }

    // Get highest order value if not provided
    let storyOrder = order
    if (storyOrder === undefined) {
      const maxOrder = await queryFirst<{ order: number }>(
        env,
        'SELECT "order" FROM stories ORDER BY "order" DESC LIMIT 1'
      )
      storyOrder = maxOrder ? maxOrder.order + 1 : 0
    }

    const story = await MediaRepository.createStory(env, {
      title,
      thumbnail,
      images: Array.isArray(images) ? images : [],
      isActive: isActive !== undefined ? isActive : true,
      order: storyOrder
    })

    // Log audit event
    const admin = userOrResponse as { id: string }
    await logAdminAction(
      env,
      request,
      admin.id,
      'CREATE',
      'Story',
      story.id,
      `Created story "${story.title}"`
    )

    return NextResponse.json({
      success: true,
      data: story
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating story:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create story'
      },
      { status: 500 }
    )
  }
}
