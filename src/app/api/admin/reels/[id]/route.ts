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
    const env = await getEnv()
    const { id } = await params
    const reel = await MediaRepository.findReelById(env, id)

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


  try {
    const env = await getEnv()
    const { id } = await params
    const body = await request.json() as any
    const { title, thumbnail, videoUrl, productIds, isActive, order } = body

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

    if (thumbnail !== undefined && thumbnail !== '') {
      if (typeof thumbnail !== 'string' || thumbnail.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Thumbnail cannot be empty'
          },
          { status: 400 }
        )
      }
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

    if (productIds !== undefined) {
      if (!Array.isArray(productIds)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Product IDs must be an array'
          },
          { status: 400 }
        )
      }
    }

    const reel = await MediaRepository.updateReel(env, id, {
      ...(title !== undefined && { title }),
      ...(thumbnail !== undefined && { thumbnail }),
      ...(videoUrl !== undefined && { videoUrl }),
      ...(productIds !== undefined && { productIds }),
      ...(isActive !== undefined && { isActive }),
      ...(order !== undefined && { order })
    })

    if (!reel) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reel not found'
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
      'AdminLog',
      reel.id,
      `Updated reel "${reel.title}"`
    )

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


  try {
    const env = await getEnv()
    const { id } = await params

    // Get reel title for audit log
    const reel = await MediaRepository.findReelById(env, id)
    const title = reel?.title || 'Unknown'

    await MediaRepository.deleteReel(env, id)

    // Log audit event
    const admin = userOrResponse as { id: string }
    await logAdminAction(
      env,
      request,
      admin.id,
      'DELETE',
      'Reel',
      id,
      `Deleted reel "${title}"`
    )

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
