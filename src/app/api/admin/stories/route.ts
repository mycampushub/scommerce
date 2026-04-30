import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { StoryRepository } from '@/db/story.repository'
import { queryFirst } from '@/db/db'

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv(request)
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const stories = activeOnly
      ? await StoryRepository.findAllActive(env)
      : await StoryRepository.findAll(env)

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
  try {
    const env = getEnv(request)
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

    // Get highest order value if not provided
    let storyOrder = order
    if (storyOrder === undefined) {
      const maxOrder = await queryFirst<{ orderNum: number }>(
        env,
        'SELECT orderNum FROM stories ORDER BY orderNum DESC LIMIT 1'
      )
      storyOrder = maxOrder ? maxOrder.orderNum + 1 : 0
    }

    const story = await StoryRepository.create(env, {
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
