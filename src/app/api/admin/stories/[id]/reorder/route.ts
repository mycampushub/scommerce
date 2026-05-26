import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { MediaRepository } from '@/db/media.repository'
import { logAdminAction } from '@/lib/audit-logger'


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

    const story = await MediaRepository.updateStory(env, id, { order: order })

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
      id,
      `Reordered story "${story.title || id}" to position ${order}`
    )

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
