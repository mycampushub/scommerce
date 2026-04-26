import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const stories = await db.story.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      where: activeOnly ? { isActive: true } : undefined
    })

    // Parse images JSON
    const storiesWithParsedImages = stories.map(story => ({
      ...story,
      images: JSON.parse(story.images || '[]')
    }))

    return NextResponse.json({
      success: true,
      data: storiesWithParsedImages
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
  try {
    const body = await request.json()
    const { title, thumbnail, images, isActive, order } = body

    // Validate required fields
    if (!title || !thumbnail || !images) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title, thumbnail, and images are required'
        },
        { status: 400 }
      )
    }

    // Get the highest order value if not provided
    let storyOrder = order
    if (storyOrder === undefined) {
      const maxOrder = await db.story.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      storyOrder = maxOrder ? maxOrder.order + 1 : 0
    }

    const story = await db.story.create({
      data: {
        title,
        thumbnail,
        images: JSON.stringify(Array.isArray(images) ? images : []),
        isActive: isActive !== undefined ? isActive : true,
        order: storyOrder
      }
    })

    // Return with parsed images
    const storyWithParsedImages = {
      ...story,
      images: JSON.parse(story.images)
    }

    return NextResponse.json({
      success: true,
      data: storyWithParsedImages
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
