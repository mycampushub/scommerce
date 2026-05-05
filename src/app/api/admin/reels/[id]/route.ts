import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { ReelRepository } from '@/db/reel.repository'
import { csrfMiddleware } from '@/lib/csrf'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const env = getEnv()
    const { id } = await params
    const reel = await ReelRepository.findById(env, id)

    if (!reel) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reel not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: reel
    })
  } catch (error) {
    console.error('Error fetching reel:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch reel'
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
    const { title, thumbnail, videoUrl, productIds, isActive, orderNum } = body

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

    if (videoUrl !== undefined) {
      if (typeof videoUrl !== 'string' || videoUrl.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Video URL cannot be empty'
          },
          { status: 400 }
        )
      }
      // Validate video URL
      try {
        new URL(videoUrl)
      } catch (e) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid video URL'
          },
          { status: 400 }
        )
      }
    }

    const reel = await ReelRepository.update(env, id, {
      title,
      thumbnail,
      videoUrl,
      productIds,
      isActive,
      orderNum
    })

    return NextResponse.json({
      success: true,
      data: reel
    })
  } catch (error) {
    console.error('Error updating reel:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update reel'
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
    await ReelRepository.delete(env, id)

    return NextResponse.json({
      success: true,
      message: 'Reel deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting reel:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete reel'
      },
      { status: 500 }
    )
  }
}
