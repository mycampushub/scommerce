import { NextRequest, NextResponse } from 'next/server'
import { getEnv, isCloudflareEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { StoryRepositoryPrisma } from '@/db/story-prisma.repository'
import { StoryRepository } from '@/db/story.repository'
import { csrfMiddleware } from '@/lib/csrf'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const env = getEnv()
    const story = isCloudflareEnv()
      ? await StoryRepository.findById(env, id)
      : await StoryRepositoryPrisma.findById(env, id)

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

  // Check CSRF protection
  const env = getEnv()
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

  try {
    const { id } = await params
    const body = await request.json() as any
    const { title, thumbnail, images, isActive, orderNum } = body

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

    const story = isCloudflareEnv()
      ? await StoryRepository.update(env, id, {
          ...(title !== undefined && { title }),
          ...(thumbnail !== undefined && { thumbnail }),
          ...(images !== undefined && { images: Array.isArray(images) ? JSON.stringify(images) : '[]' }),
          ...(isActive !== undefined && { isActive }),
          ...(orderNum !== undefined && { orderNum })
        })
      : await StoryRepositoryPrisma.update(env, id, {
          ...(title !== undefined && { title }),
          ...(thumbnail !== undefined && { thumbnail }),
          ...(images !== undefined && { images }),
          ...(isActive !== undefined && { isActive }),
          ...(orderNum !== undefined && { orderNum })
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
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const userOrResponse = await verifyAdminAuth(request, ['admin'])
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse
  }

  // Check CSRF protection
  const env = getEnv()
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

  try {
    const { id } = await params
    if (isCloudflareEnv()) {
      await StoryRepository.delete(env, id)
    } else {
      await StoryRepositoryPrisma.delete(env, id)
    }

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
