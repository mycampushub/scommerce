import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const promotions = await db.promotion.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      where: activeOnly ? { isActive: true } : undefined
    })

    return NextResponse.json({
      success: true,
      data: promotions
    })
  } catch (error) {
    console.error('Error fetching promotions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch promotions'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, image, ctaText, ctaLink, isActive, order } = body

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
    let promotionOrder = order
    if (promotionOrder === undefined) {
      const maxOrder = await db.promotion.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      promotionOrder = maxOrder ? maxOrder.order + 1 : 0
    }

    const promotion = await db.promotion.create({
      data: {
        title,
        description,
        image,
        ctaText,
        ctaLink,
        isActive: isActive !== undefined ? isActive : true,
        order: promotionOrder
      }
    })

    return NextResponse.json({
      success: true,
      data: promotion
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating promotion:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create promotion'
      },
      { status: 500 }
    )
  }
}
