import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { StoryRepository } from '@/db/story.repository'

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const env = getEnv(request)
    const story = await StoryRepository.findById(env, id)

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
    console.error('Error fetching story:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch story'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const env = getEnv(request)
    const body = await request.json()
    const { title, thumbnail, images, isActive, order } = body

    const story = await StoryRepository.update(env, id, {
      ...(title !== undefined && { title }),
      ...(thumbnail !== undefined && { thumbnail }),
      ...(images !== undefined && { images: Array.isArray(images) ? images : [] }),
      ...(isActive !== undefined && { isActive }),
      ...(order !== undefined && { orderNum: order })
    })

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
    console.error('Error updating story:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update story'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const env = getEnv(request)
    await StoryRepository.delete(env, id)

    return NextResponse.json({
      success: true,
      message: 'Story deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting story:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete story'
      },
      { status: 500 }
    )
  }
}
