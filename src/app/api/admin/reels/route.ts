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

    const reels = activeOnly
      ? await MediaRepository.findAllActiveReels(env)
      : await MediaRepository.findAllReels(env)

    return NextResponse.json({
      success: true,
      data: reels
    })
  } catch (error) {
    console.error('Error fetching reels:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch reels'
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
  const rateLimitKey = `admin-reel-create:${clientIp}`
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  })

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult)
  }

  try {
    const body = await request.json() as any
    const { title, thumbnail, videoUrl, productIds, isActive, order } = body

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

    if (thumbnail && typeof thumbnail === 'string' && thumbnail.trim().length > 0) {
      // Validate thumbnail URL - allow relative URLs starting with /
      function isValidUrl(url: string): boolean {
        if (!url || typeof url !== 'string') return false
        if (url.startsWith('/')) return true
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
    }

    if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Video URL is required'
        },
        { status: 400 }
      )
    }

    // Validate video URL - allow relative URLs and common video platforms
    function isValidVideoUrl(url: string): boolean {
      if (!url || typeof url !== 'string') return false

      // Allow relative URLs starting with /
      if (url.startsWith('/')) return true

      // Allow common video platforms
      const videoPatterns = [
        /^https?:\/\/(www\.)?youtube\.com/,
        /^https?:\/\/(www\.)?youtu\.be/,
        /^https?:\/\/(www\.)?vimeo\.com/,
        /^https?:\/\/.+\/.+\.(mp4|webm|ogg|mov)(\?.*)?$/i
      ]

      if (videoPatterns.some(pattern => pattern.test(url))) {
        return true
      }

      // Try URL constructor for other cases
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    }

    if (!isValidVideoUrl(videoUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid video URL. Must be a valid URL, start with /, or be from YouTube/Vimeo'
        },
        { status: 400 }
      )
    }

    // Get highest order value if not provided
    let reelOrder = order
    if (reelOrder === undefined || reelOrder === null) {
      const maxOrder = await queryFirst<{ order: number }>(
        env,
        'SELECT "order" FROM reels ORDER BY "order" DESC LIMIT 1'
      )
      reelOrder = maxOrder ? maxOrder.order + 1 : 0
    }

    const reel = await MediaRepository.createReel(env, {
      title,
      thumbnail,
      videoUrl,
      productIds: productIds || [],
      isActive: isActive !== undefined ? isActive : true,
      order: reelOrder
    })

    // Log audit event
    const admin = userOrResponse as { id: string }
    await logAdminAction(
      env,
      request,
      admin.id,
      'CREATE',
      'AdminLog',
      reel.id,
      `Created reel "${reel.title}"`
    )

    return NextResponse.json({
      success: true,
      data: reel
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating reel:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create reel'
      },
      { status: 500 }
    )
  }
}
