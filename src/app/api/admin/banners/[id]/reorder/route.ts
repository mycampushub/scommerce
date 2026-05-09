import { NextRequest, NextResponse } from 'next/server'
import { getEnv } from '@/lib/cloudflare'
import { BannerRepository } from '@/db/banner.repository'
import { verifyAdminAuth } from '@/lib/admin-auth'
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
  const env = getEnv()
  const csrfError = await csrfMiddleware(request, env)
  if (csrfError) {
    return csrfError
  }

  try {
    const { id } = await params
    const body = await request.json() as any
    const { order } = body

    // Validate order
    if (order === undefined || order === null || typeof order !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid order number is required'
        },
        { status: 400 }
      )
    }

    const banner = await BannerRepository.update(env, id, { orderNum: order })

    if (!banner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Banner not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: banner
    })
  } catch (error) {
    console.error('Error reordering banner:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reorder banner'
      },
      { status: 500 }
    )
  }
}
