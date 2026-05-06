import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { BannerRepository } from '@/db/banner.repository'
import { queryFirst } from '@/db/db'
import { csrfMiddleware } from '@/lib/csrf'


export async function GET(request: NextRequest) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const env = getEnv()
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

  // Check CSRF protection
  const env = getEnv()
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
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
      orderNum: bannerOrder
    })

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
