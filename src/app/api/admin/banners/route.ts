import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const banners = await db.banner.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      where: activeOnly ? { isActive: true } : undefined
    })

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

    // Get the highest order value if not provided
    let bannerOrder = order
    if (bannerOrder === undefined) {
      const maxOrder = await db.banner.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      bannerOrder = maxOrder ? maxOrder.order + 1 : 0
    }

    const banner = await db.banner.create({
      data: {
        title,
        description,
        image,
        mobileImage,
        buttonText,
        buttonLink,
        isActive: isActive !== undefined ? isActive : true,
        order: bannerOrder
      }
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
