import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { ReelRepository } from '@/db/reel.repository'
import { csrfMiddleware } from '@/lib/csrf'


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
  const env = getEnv(request)
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

  try {
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

    const reel = await ReelRepository.update(env, id, {
      orderNum: order
    })

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
