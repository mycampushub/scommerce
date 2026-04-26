import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const story = await db.story.findUnique({
      where: { id }
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

    // Parse images JSON
    const storyWithParsedImages = {
      ...story,
      images: JSON.parse(story.images || '[]')
    }

    return NextResponse.json({
      success: true,
      data: storyWithParsedImages
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
    const body = await request.json()
    const { title, thumbnail, images, isActive, order } = body

    const story = await db.story.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(images !== undefined && { images: JSON.stringify(Array.isArray(images) ? images : []) }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order })
      }
    })

    // Return with parsed images
    const storyWithParsedImages = {
      ...story,
      images: JSON.parse(story.images || '[]')
    }

    return NextResponse.json({
      success: true,
      data: storyWithParsedImages
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
    await db.story.delete({
      where: { id }
    })

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
