import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { BannerRepository } from '@/db/banner.repository'
import { queryFirst } from '@/db/db'

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request)
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
  try {
    const env = getEnv(request)
    const body = await request.json()
    const { title, description, image, mobileImage, buttonText, buttonLink, isActive, order } = body

    // Validate required fields
    if (!title || !image) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title and image are required'
        },
        { status: 400 }
      )
    }

    // Get highest order value if not provided
    let bannerOrder = order
    if (bannerOrder === undefined) {
      const maxOrder = await queryFirst<{ orderNum: number }>(
        env,
        'SELECT orderNum FROM banners ORDER BY orderNum DESC LIMIT 1'
      )
      bannerOrder = maxOrder ? maxOrder.orderNum + 1 : 0
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
