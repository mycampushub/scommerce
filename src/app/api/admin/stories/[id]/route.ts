import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { MediaRepository } from '@/db/media.repository'
import { logAdminAction } from '@/lib/audit-logger'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication (admin or staff)
  const userOrResponse = await verifyAdminAuth(request, ['admin', 'staff'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  try {
    const { id } = await params
    const env = await getEnv()
    const story = await MediaRepository.findStoryById(env, id)

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
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }


  try {
    const env = await getEnv()
    const { id } = await params
    const body = await request.json() as any
    const { title, thumbnail, images, isActive, order } = body

    // Validate required fields if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Title cannot be empty'
          },
          { status: 400 }
        )
      }
    }

    if (thumbnail !== undefined) {
      if (typeof thumbnail !== 'string' || thumbnail.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Thumbnail cannot be empty'
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
    }

    if (images !== undefined) {
      if (!Array.isArray(images)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Images must be an array'
          },
          { status: 400 }
        )
      }
      // Validate image URLs
      for (const img of images) {
        if (img) {
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
      }
    }

    const story = await MediaRepository.updateStory(env, id, {
      ...(title !== undefined && { title }),
      ...(thumbnail !== undefined && { thumbnail }),
      ...(images !== undefined && { images: Array.isArray(images) ? images : [] }),
      ...(isActive !== undefined && { isActive }),
      ...(order !== undefined && { order })
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

    // Log audit event
    const admin = userOrResponse as { id: string }
    await logAdminAction(
      env,
      request,
      admin.id,
      'UPDATE',
      'Story',
      story.id,
      `Updated story "${story.title}"`
    )

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
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }


  try {
    const env = await getEnv()
    const { id } = await params

    // Get story title for audit log
    const story = await MediaRepository.findStoryById(env, id)
    const title = story?.title || 'Unknown'

    await MediaRepository.deleteStory(env, id)

    // Log audit event
    const admin = userOrResponse as { id: string }
    await logAdminAction(
      env,
      request,
      admin.id,
      'DELETE',
      'Story',
      id,
      `Deleted story "${title}"`
    )

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
