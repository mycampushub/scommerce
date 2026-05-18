import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { BannerRepository } from '@/db/banner.repository'
import { queryFirst } from '@/db/db'
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/rate-limit'
import { logAdminAction } from '@/lib/audit-logger'


export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = await getEnv()
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const banners = activeOnly
      ? await BannerRepository.findAllActive(env)
      : await BannerRepository.findAll(env)

    return NextResponse.json({
      success: true,
      data: banners
    })
  } catch (error) {
    console.error('Error fetching banners:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch banners'
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
  const rateLimitKey = `admin-banner-create:${clientIp}`
  const rateLimitResult = await rateLimit(env, rateLimitKey, {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  })

  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult)
  }

  try {
    const body = await request.json() as any
    const { title, description, image, mobileImage, buttonText, buttonLink, isActive, order } = body

    // Validate required fields manually
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title is required'
        },
        { status: 400 }
      )
    }

    if (!image || typeof image !== 'string' || image.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image is required'
        },
        { status: 400 }
      )
    }

    // Validate image URLs
    try {
      new URL(image)
      if (mobileImage) {
        new URL(mobileImage)
      }
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid image URL'
        },
        { status: 400 }
      )
    }

    // Get highest order value if not provided
    let bannerOrder = order
    if (bannerOrder === undefined) {
      // Fix: Use "order" (with quotes) instead of orderNum
      const maxOrder = await queryFirst<{ "order": number }>(
        env,
        'SELECT "order" FROM banners ORDER BY "order" DESC LIMIT 1'
      )
      bannerOrder = maxOrder ? maxOrder["order"] + 1 : 0
    }

    const banner = await BannerRepository.create(env, {
      title,
      description,
      image,
      mobileImage,
      buttonText,
      buttonLink,
      isActive: isActive !== undefined ? isActive : true,
      order: bannerOrder
    })

    // Log audit event
    const admin = userOrResponse as { id: string }
    await logAdminAction(
      env,
      request,
      admin.id,
      'CREATE',
      'Banner',
      banner.id,
      `Created banner "${banner.title}"`
    )

    return NextResponse.json({
      success: true,
      data: banner
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating banner:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create banner'
      },
      { status: 500 }
    )
  }
}
