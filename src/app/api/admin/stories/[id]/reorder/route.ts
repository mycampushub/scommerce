import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { StoryRepository } from '@/db/story.repository'

export const runtime = 'edge';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const env = getEnv(request)
    const body = await request.json()
    const { order } = body

    if (order === undefined || order === null) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order is required'
        },
        { status: 400 }
      )
    }

    const story = await StoryRepository.update(env, id, { orderNum: order })

    if (!story) {
      return NextResponse.json(
        {
          success: false,
          error: 'Story not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: story
    })
  } catch (error) {
    console.error('Error reordering story:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reorder story'
      },
      { status: 500 }
    )
  }
}
