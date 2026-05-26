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

    const reel = await MediaRepository.updateReel(env, id, { order: order })

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
      id,
      `Reordered reel "${reel.title || id}" to position ${order}`
    )

    return NextResponse.json({
      success: true,
      data: reel
    })
  } catch (error) {
    console.error('Error reordering reel:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reorder reel'
      },
      { status: 500 }
    )
  }
}
