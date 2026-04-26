import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const reels = await db.reel.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      where: activeOnly ? { isActive: true } : undefined
    })

    // Parse productIds JSON
    const reelsWithParsedProductIds = reels.map(reel => ({
      ...reel,
      productIds: reel.productIds ? JSON.parse(reel.productIds) : []
    }))

    return NextResponse.json({
      success: true,
      data: reelsWithParsedProductIds
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
  try {
    const body = await request.json()
    const { title, thumbnail, videoUrl, productIds, isActive, order } = body

    // Validate required fields
    if (!title || !thumbnail || !videoUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title, thumbnail, and videoUrl are required'
        },
        { status: 400 }
      )
    }

    // Get the highest order value if not provided
    let reelOrder = order
    if (reelOrder === undefined) {
      const maxOrder = await db.reel.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      reelOrder = maxOrder ? maxOrder.order + 1 : 0
    }

    const reel = await db.reel.create({
      data: {
        title,
        thumbnail,
        videoUrl,
        productIds: productIds ? JSON.stringify(Array.isArray(productIds) ? productIds : []) : null,
        isActive: isActive !== undefined ? isActive : true,
        order: reelOrder
      }
    })

    // Return with parsed productIds
    const reelWithParsedProductIds = {
      ...reel,
      productIds: reel.productIds ? JSON.parse(reel.productIds) : []
    }

    return NextResponse.json({
      success: true,
      data: reelWithParsedProductIds
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
