import { NextRequest, NextResponse } from 'next/server'
import { getEnv, isCloudflareEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { StoryRepositoryPrisma } from '@/db/story-prisma.repository'
import { StoryRepository } from '@/db/story.repository'
import { queryFirst } from '@/db/db'


export async function GET(request: NextRequest) {
  try {
    const env = getEnv()
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'

    if (isCloudflareEnv()) {
      const stories = activeOnly
        ? await StoryRepository.findAllActive(env)
        : await StoryRepository.findAll(env)

      return NextResponse.json({
        success: true,
        data: stories
      })
    } else {
      const stories = activeOnly
        ? await StoryRepositoryPrisma.findAllActive(env)
        : await StoryRepositoryPrisma.findAll(env)

      return NextResponse.json({
        success: true,
        data: stories
      })
    }
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

  const env = getEnv()

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

    // Validate thumbnail URL
    try {
      new URL(thumbnail)
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid thumbnail URL'
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

    // Validate image URLs
    for (const img of images) {
      try {
        new URL(img)
      } catch (e) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid image URL'
          },
          { status: 400 }
        )
      }
    }

    // Get highest order value if not provided
    let storyOrder = order
    if (storyOrder === undefined) {
      if (isCloudflareEnv()) {
        const maxOrder = await queryFirst<{ orderNum: number }>(
          env,
          'SELECT orderNum FROM stories ORDER BY orderNum DESC LIMIT 1'
        )
        storyOrder = maxOrder ? maxOrder.orderNum + 1 : 0
      } else {
        const maxStory = await StoryRepositoryPrisma.findAll(env)
        storyOrder = maxStory.length > 0 ? Math.max(...maxStory.map(s => s.orderNum)) + 1 : 0
      }
    }

    const story = isCloudflareEnv()
      ? await StoryRepository.create(env, {
          title,
          thumbnail,
          images: Array.isArray(images) ? images : [],
          isActive: isActive !== undefined ? isActive : true,
          orderNum: storyOrder
        })
      : await StoryRepositoryPrisma.create(env, {
          title,
          thumbnail,
          images: Array.isArray(images) ? images : [],
          isActive: isActive !== undefined ? isActive : true,
          orderNum: storyOrder
        })

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
